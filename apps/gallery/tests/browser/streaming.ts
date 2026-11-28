import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, type Page } from '@playwright/test';

// Long enough for Chromium to paint while the parser waits for the rest of the document.
export const PAUSE_MS = 1_500;

/**
 * Serve the Gallery from another port, sending `documentPath` in two writes with a pause at the
 * offset `splitAt` returns, as a slow network or a busy server would.
 */
export async function streamingProxy(origin: string, documentPath: string, splitAt: (html: string) => number) {
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
		const split = splitAt(html);
		if (split <= 0 || split >= html.length) throw new Error(`${documentPath} has no split point`);
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

export type Box = { x: number; y: number; width: number; height: number };
type Frame = Box & { time: number; visible: boolean };
type Shift = { time: number; previous: Box; current: Box };

/** Record `selector`'s box in every rendered frame until load, and each layout shift of a node inside it. */
export async function watchBox(page: Page, selector: string): Promise<void> {
	await page.addInitScript((watched) => {
		const record = { frames: [] as Frame[], shifts: [] as Shift[] };
		Object.assign(window, { __watched: record });
		const box = ({ x, y, width, height }: DOMRectReadOnly) => ({ x, y, width, height });
		const inside = (node: Node | null) =>
			!!(node instanceof Element ? node : node?.parentElement)?.closest(watched);
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as (PerformanceEntry & { sources: { node: Node | null; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[] })[]) {
				for (const source of entry.sources) {
					if (!inside(source.node)) continue;
					record.shifts.push({ time: entry.startTime, previous: box(source.previousRect), current: box(source.currentRect) });
				}
			}
		}).observe({ type: 'layout-shift', buffered: true });
		const frame = () => {
			const element = document.querySelector(watched);
			if (element) {
				record.frames.push({
					time: performance.now(),
					...box(element.getBoundingClientRect()),
					visible: getComputedStyle(element).visibility === 'visible',
				});
			}
			if (document.readyState !== 'complete') requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}, selector);
}

/** Wait for the Gallery to hydrate and fonts to settle, then return the record and the settled box. */
export async function settle(page: Page, selector: string) {
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	return page.evaluate(async (watched) => {
		await document.fonts.ready;
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
		const { x, y, width, height } = document.querySelector(watched)!.getBoundingClientRect();
		const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
		const paint = performance.getEntriesByName('first-contentful-paint')[0];
		const record = (window as unknown as { __watched?: { frames: Frame[]; shifts: Shift[] } }).__watched;
		return {
			frames: record?.frames ?? [],
			shifts: record?.shifts ?? [],
			settled: { x, y, width, height },
			viewport: innerHeight,
			parsed: navigation!.domInteractive,
			firstPaint: paint?.startTime,
		};
	}, selector);
}

type Settled = Awaited<ReturnType<typeof settle>>;

/** Fail unless Chromium painted mid-stream and every visible frame showed the settled box. */
export function expectSteadyWhileStreaming(result: Settled, name: string): void {
	const partial = result.frames.filter((frame) => frame.time < result.parsed - PAUSE_MS / 2);
	expect(partial.length, `Chromium rendered frames while the ${name} was partly parsed`).toBeGreaterThan(0);
	expect(result.shifts, `no layout shift names a ${name} node`).toEqual([]);
	const near = (a: number, b: number) => Math.abs(a - b) <= 1;
	const moved = result.frames.filter((frame) => frame.visible && !(near(frame.x, result.settled.x)
		&& near(frame.y, result.settled.y) && near(frame.width, result.settled.width) && near(frame.height, result.settled.height)));
	expect(moved, `a visible ${name} always has its settled box ${JSON.stringify(result.settled)}`).toEqual([]);
}
