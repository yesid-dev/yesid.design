import { expect, test } from '@playwright/test';
import { preloadFont } from '@yesid/tokens/fonts';

const fonts = /\/(?:inter|jetbrains-mono)-latin(?:-ext)?-wght-normal[\w.-]*\.woff2$/;
const families = ['Inter Variable', 'JetBrains Mono Variable'];

for (const width of [390, 1024]) {
	test(`font swap preserves reading layout at ${width}px`, { tag: '@motion' }, async ({ page }, info) => {
		await page.setViewportSize({ width, height: 844 });
		const { promise: held, resolve: release } = Promise.withResolvers<void>();
		const requested = new Set<string>();
		await page.route(fonts, async (route) => {
			requested.add(new URL(route.request().url()).pathname);
			await held;
			await route.continue();
		});

		const heading = page.locator('#panels-heading');
		const blocks = page.locator('#panels-heading, #panels-heading + p, [data-testid="dimension-terminal"] p.font-mono');
		const measure = () => blocks.evaluateAll((elements) => elements.map((element) => {
			const { height, y } = element.getBoundingClientRect();
			const text = document.createRange();
			text.selectNodeContents(element);
			return { height, y, lines: text.getClientRects().length };
		}));
		const loadedWebFonts = () => page.evaluate((names) => [...document.fonts]
			.filter((face) => names.includes(face.family.replaceAll('"', '').replaceAll("'", '')) && face.status === 'loaded')
			.map((face) => face.family.replaceAll('"', '').replaceAll("'", '')), families);

		let before: Awaited<ReturnType<typeof measure>>;
		let swapStart: number;
		try {
			await page.goto('/dividers/fr', { waitUntil: 'domcontentloaded' });
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			await expect(blocks).toHaveCount(3);
			await expect.poll(() => [...requested].filter(preloadFont).length).toBe(2);
			await heading.evaluate((element) => element.scrollIntoView({ behavior: 'instant' }));
			await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
			expect(await loadedWebFonts()).toEqual([]);
			before = await measure();
			swapStart = await page.evaluate(() => performance.now());
		} finally {
			release();
		}

		const shifts = await page.evaluate(async (start) => {
			await document.fonts.ready;
			if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
				throw new Error('Chromium must expose layout-shift entries');
			}
			type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
			const entries: LayoutShift[] = [];
			const observer = new PerformanceObserver((list) => collect(list.getEntries()));
			function collect(records: PerformanceEntry[]) {
				// This observer is subscribed only to layout-shift.
				for (const entry of records) entries.push(entry as LayoutShift);
			}
			observer.observe({ type: 'layout-shift', buffered: true });
			await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
			collect(observer.takeRecords());
			observer.disconnect();
			return entries.filter((entry) => entry.startTime >= start && !entry.hadRecentInput)
				.map(({ startTime, value }) => ({ startTime, value }));
		}, swapStart);
		const after = await measure();
		const shift = shifts.reduce((sum, entry) => sum + entry.value, 0);
		const evidence = JSON.stringify({ width, before, after, shift, shifts });
		await info.attach('font-swap', { body: evidence, contentType: 'application/json' });

		expect(new Set(await loadedWebFonts())).toEqual(new Set(families));
		expect(after.map(({ lines }) => lines), evidence).toEqual(before.map(({ lines }) => lines));
		for (const [index, block] of after.entries()) {
			expect(Math.abs(block.height - before[index]!.height), evidence).toBeLessThanOrEqual(0.5);
		}
		expect(shift, evidence).toBeLessThan(0.001);
	});
}
