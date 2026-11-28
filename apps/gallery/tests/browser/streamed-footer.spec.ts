import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test, type Page } from '@playwright/test';

// Long enough for Chromium to paint while the parser waits for the rest of the footer.
const PAUSE_MS = 1_500;

/**
 * Serve the Gallery from another port, sending `documentPath` in two writes with a pause after
 * the footer's first link group, as a slow network or a busy server would.
 */
async function streamingProxy(origin: string, documentPath: string) {
	const server = createServer(async (request, response) => {
		// Only the path and query come from the request; the upstream origin stays fixed, so a
		// request target such as //other.host/ or an absolute URL cannot redirect the fetch.
		const requested = new URL(request.url ?? '/', 'http://proxy.invalid');
		const target = new URL(origin);
		target.pathname = requested.pathname;
		target.search = requested.search;
		const upstream = await fetch(target);
		const type = upstream.headers.get('content-type') ?? 'application/octet-stream';
		if (target.pathname !== documentPath) {
			response.writeHead(upstream.status, { 'content-type': type });
			response.end(Buffer.from(await upstream.arrayBuffer()));
			return;
		}
		const html = await upstream.text();
		const footer = html.indexOf('data-slot="footer"');
		const split = html.indexOf('</nav>', footer) + '</nav>'.length;
		if (footer < 0 || split < footer) throw new Error(`${documentPath} has no footer navigation to split`);
		response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
		response.write(html.slice(0, split));
		await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
		response.end(html.slice(split));
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.address() as AddressInfo;
	return {
		url: `http://127.0.0.1:${port}${documentPath}`,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
}

type FooterFrame = { time: number; y: number; height: number; visible: boolean };
type FooterShift = { time: number; previous: number[]; current: number[] };

/** Record the footer's box in every rendered frame and each layout shift of a footer node. */
async function watchFooter(page: Page): Promise<void> {
	await page.addInitScript(() => {
		const record = { frames: [] as FooterFrame[], shifts: [] as FooterShift[] };
		Object.assign(window, { __footer: record });
		const inFooter = (node: Node | null) =>
			!!(node instanceof Element ? node : node?.parentElement)?.closest('[data-slot="footer"]');
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as (PerformanceEntry & { sources: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[] })[]) {
				for (const source of entry.sources) {
					if (!inFooter(source.node)) continue;
					const { previousRect: p, currentRect: c } = source;
					record.shifts.push({ time: entry.startTime, previous: [p.y, p.height], current: [c.y, c.height] });
				}
			}
		}).observe({ type: 'layout-shift', buffered: true });
		const frame = () => {
			const footer = document.querySelector('[data-slot="footer"]');
			if (footer) {
				const { y, height } = footer.getBoundingClientRect();
				record.frames.push({ time: performance.now(), y, height, visible: getComputedStyle(footer).visibility === 'visible' });
			}
			if (document.readyState !== 'complete') requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	});
}

async function settle(page: Page) {
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	return page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const footer = document.querySelector('[data-slot="footer"]')!.getBoundingClientRect();
		const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
		const paint = performance.getEntriesByName('first-contentful-paint')[0];
		return {
			...(window as unknown as { __footer: { frames: FooterFrame[]; shifts: FooterShift[] } }).__footer,
			footer: { y: footer.y, height: footer.height },
			viewport: innerHeight,
			parsed: navigation!.domInteractive,
			firstPaint: paint?.startTime,
		};
	});
}

test('a short page never shows its footer growing while the footer streams in', async ({ page, baseURL }) => {
	const proxy = await streamingProxy(baseURL!, '/app-frame/short-page');
	try {
		await watchFooter(page);
		await page.goto(proxy.url);
		const result = await settle(page);
		expect(result.footer.y + result.footer.height, 'the footer ends inside the first viewport').toBeLessThanOrEqual(result.viewport + 1);
		const partial = result.frames.filter((frame) => frame.time < result.parsed - PAUSE_MS / 2);
		expect(partial.length, 'Chromium rendered frames while the footer was partly parsed').toBeGreaterThan(0);
		expect(result.shifts, 'no layout shift names a footer node').toEqual([]);
		const moved = result.frames.filter((frame) => frame.visible
			&& (Math.abs(frame.y - result.footer.y) > 1 || Math.abs(frame.height - result.footer.height) > 1));
		expect(moved, `a visible footer always has its settled box ${JSON.stringify(result.footer)}`).toEqual([]);
	} finally {
		await proxy.close();
	}
});

test('a long page paints before its footer finishes streaming', async ({ page, baseURL }) => {
	const proxy = await streamingProxy(baseURL!, '/app-frame/record-parts/en');
	try {
		await page.goto(proxy.url);
		const result = await settle(page);
		expect(result.firstPaint, 'first contentful paint').toBeDefined();
		expect(result.firstPaint!).toBeLessThan(result.parsed - PAUSE_MS / 2);
	} finally {
		await proxy.close();
	}
});
