import { expect, test } from '@playwright/test';

test('the listing measure caps a column and fits a narrow viewport', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const measures = page.getByRole('region', { name: 'Measures' }).getByRole('list');
	const listing = measures.getByRole('listitem').filter({ hasText: '--measure-listing: 46rem' });
	await expect(listing).toHaveCSS('width', '736px');

	await page.setViewportSize({ width: 320, height: 640 });
	await expect(listing).toHaveCSS('width', '272px');
});
