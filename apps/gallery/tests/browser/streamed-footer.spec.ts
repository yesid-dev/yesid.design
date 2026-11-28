import { expect, test } from '@playwright/test';
import { PAUSE_MS, expectSteadyWhileStreaming, settle, streamingProxy, watchBox } from './streaming.js';

const footer = '[data-slot="footer"]';

/** Pause after the footer's first link group. */
function insideFooter(html: string): number {
	const start = html.indexOf('data-slot="footer"');
	return start < 0 ? -1 : html.indexOf('</nav>', start) + '</nav>'.length;
}

test('a short page never shows its footer growing while the footer streams in', async ({ page, baseURL }) => {
	const proxy = await streamingProxy(baseURL!, '/app-frame/short-page', insideFooter);
	try {
		await watchBox(page, footer);
		await page.goto(proxy.url);
		const result = await settle(page, footer);
		expect(result.settled.y + result.settled.height, 'the footer ends inside the first viewport').toBeLessThanOrEqual(result.viewport + 1);
		expectSteadyWhileStreaming(result, 'footer');
	} finally {
		await proxy.close();
	}
});

test('a long page paints before its footer finishes streaming', async ({ page, baseURL }) => {
	const proxy = await streamingProxy(baseURL!, '/app-frame/record-parts/en', insideFooter);
	try {
		await page.goto(proxy.url);
		const result = await settle(page, footer);
		expect(result.firstPaint, 'first contentful paint').toBeDefined();
		expect(result.firstPaint!).toBeLessThan(result.parsed - PAUSE_MS / 2);
	} finally {
		await proxy.close();
	}
});
