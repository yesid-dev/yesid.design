import { expect, test } from '@playwright/test';

// Headless Chromium hides scrollbars by default.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

for (const nested of [false, true]) {
	test(`the Controls pill follows the ${nested ? 'nested' : 'document'} scroll content centre`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run at a compact width');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/app-frame/controls-rail');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		if (nested) await page.getByRole('button', { name: 'Full viewport' }).click();
		const pill = page.getByRole('button', { name: /Open controls/ });
		const measure = () => pill.evaluate((button, nested) => {
			const scroller = nested ? document.getElementById('main')! : document.documentElement;
			const frame = scroller.getBoundingClientRect();
			const rect = button.getBoundingClientRect();
			const left = frame.left + scroller.clientLeft;
			const right = left + scroller.clientWidth;
			return {
				offset: (rect.left + rect.right - left - right) / 2,
				gutter: (nested ? frame.width : innerWidth) - scroller.clientWidth,
				left: rect.left - left,
				right: right - rect.right,
			};
		}, nested);
		const scrollbar = await page.addStyleTag({
			content: `
				* { scrollbar-width: auto !important; scrollbar-color: auto !important; }
				::-webkit-scrollbar { width: 15px !important; }
			`,
		});

		async function check(gutter: number) {
			await expect.poll(async () => (await measure()).gutter).toBe(gutter);
			await expect.poll(async () => Math.abs((await measure()).offset)).toBeLessThanOrEqual(1);
			const { left, right } = await measure();
			expect(left).toBeGreaterThanOrEqual(0);
			expect(right).toBeGreaterThanOrEqual(0);
		}
		await check(15);

		await scrollbar.evaluate((style) => { style.textContent = '* { scrollbar-width: none !important; }'; });
		await check(0);
	});
}
