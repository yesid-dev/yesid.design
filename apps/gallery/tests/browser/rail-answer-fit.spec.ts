import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

test.describe('Rail and answer reflow', { tag: '@theme' }, () => {
	test('keeps the pill label and fits whole figures as text grows', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/rail-answer-fit');
		await page.locator('html[data-gallery-ready]').waitFor();
		await page.evaluate(() => document.fonts.ready);

		const pill = page.getByRole('button', { name: 'Controls 7 days selected · Open controls' });
		const label = pill.locator('.surface-rail-pill-label');
		const summary = pill.getByText('7 days selected', { exact: true });
		const figures = page.locator('.answer-value > .metric-value');

		for (const [width, textSize] of [[390, 100], [390, 200], [320, 200], [390, 100]]) {
			await page.setViewportSize({ width, height: 900 });
			await page.locator('html').evaluate((html, scale) => { html.style.fontSize = `${scale}%`; }, textSize);
			const name = `${width}px at ${textSize}% text`;

			await expect(pill).toBeVisible();
			const labelClips = await label.evaluate((el) => el.scrollWidth > el.clientWidth);
			expect(labelClips, name).toBe(false);
			if (width === 320) {
				await expect(summary, name).toBeHidden();
			} else {
				await expect(summary, name).toBeVisible();
				const summaryClips = await summary.evaluate((el) => el.scrollWidth > el.clientWidth);
				expect(summaryClips, name).toBe(textSize === 200);
			}

			await expect(figures).toHaveCount(12);
			await expect.poll(() => figures.evaluateAll((elements) => elements.map((element) => {
				const range = document.createRange();
				range.selectNodeContents(element);
				const figure = range.getBoundingClientRect();
				const available = element.parentElement!.getBoundingClientRect();
				return range.getClientRects().length === 1 && figure.right <= available.right + 0.5;
			})), { message: name }).toEqual(Array(12).fill(true));
			if (textSize === 100) {
				await expect(figures.first()).toHaveCSS('font-size', '20px');
				await expect(figures.nth(3)).toHaveCSS('font-size', '40px');
			} else if (width === 390) {
				await expect(figures.first()).toHaveCSS('font-size', '40px');
			}
			await expectNoHorizontalOverflow(page);
		}
	});
});
