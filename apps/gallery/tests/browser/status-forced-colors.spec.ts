import { expect, test } from '@playwright/test';

test('status dots and status tokens stay visible in forced colours', async ({ page }) => {
	await page.emulateMedia({ forcedColors: 'active' });
	await page.goto('/');
	const dots = page.locator('[data-gallery-family="brand:StatusDot"] [data-slot="status-dot"]');
	await expect(dots.first()).toBeVisible();

	const text = await page.evaluate(() => getComputedStyle(document.body).color);
	const backgrounds = await dots.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
	expect(backgrounds.length).toBeGreaterThan(0);
	for (const background of backgrounds) expect(background).toBe(text);

	const tokens = await page.evaluate(() =>
		['early', 'on-time', 'late', 'severe', 'unknown'].map((status) =>
			getComputedStyle(document.documentElement).getPropertyValue(`--dataviz-status-${status}`).trim(),
		),
	);
	expect(tokens).toEqual(['CanvasText', 'CanvasText', 'CanvasText', 'CanvasText', 'CanvasText']);
});
