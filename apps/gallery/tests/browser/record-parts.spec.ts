import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

test('localized record data stays readable at 200% text and preserves missing observations', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await page.goto('/record-parts');
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	const table = page.getByRole('table', { name: 'Heures de service par jour' });
	await expect(table.getByRole('columnheader', { name: 'Heures avec signalements' })).toHaveCount(1);
	await expect(table.getByRole('rowheader', { name: 'Mercredi 18 novembre' })).toBeVisible();
	await expect(table.getByRole('cell', { name: 'Aucun signalement' })).toBeVisible();
	await expect(table.locator('td [aria-hidden="true"]').first()).toBeVisible();
	await expect(page.getByText('En retard', { exact: true })).toBeVisible();
	await expect(page.locator('[data-slot="route-plate"][data-schedule-only]')).toHaveCSS('border-top-style', 'dashed');
	const strip = page.getByRole('list', { name: 'Signalements par jour' });
	await expect(strip.getByRole('listitem')).toHaveCount(5);
	await expect(strip.locator('[data-reported="false"]')).toContainText('Aucun signalement');
	await expect(page.locator('[data-slot="chart-bar-series"] rect')).toHaveCount(4);
	await expect(page.locator('[data-slot="chart-line-series"] polyline')).toHaveCount(2);
	await expect(page.locator('[data-slot="chart-line-series"] circle')).toHaveCount(4);
	await expect(page.getByText('À lire avec prudence')).toBeVisible();
	await expectNoHorizontalOverflow(page);
	await expectAccessible(page, { include: '[data-testid="record-parts"]' });
	await page.setViewportSize({ width: 390, height: 900 });
	await expectNoHorizontalOverflow(page);
});

test('a chart takes the available card height after the viewport changes', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/record-parts');
	const charts = page.locator('[data-slot="chart-area"]');
	await expect(charts).toHaveCount(2);
	await expect.poll(async () => {
		const heights = await charts.evaluateAll((elements) => elements.map((el) => el.clientHeight));
		return heights[0]! - heights[1]!;
	}).toBeGreaterThan(10);
	const widths = async () => charts.evaluateAll((elements) => elements.map((el) => el.clientWidth));
	const previous = await widths();
	await page.setViewportSize({ width: 390, height: 900 });
	await expect.poll(widths).not.toEqual(previous);
	await expectNoHorizontalOverflow(page);
});
