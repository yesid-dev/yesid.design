import { expect, test, type Locator } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

async function rowGeometry(example: Locator) {
	return example.locator('tbody tr').evaluateAll((rows) => rows.map((row) => {
		const bounds = row.getBoundingClientRect();
		const compact = getComputedStyle(row).display === 'flex';
		return [bounds.height, ...Array.from(row.children).flatMap((cell) => {
			const rect = cell.getBoundingClientRect();
			const placement = [rect.x - bounds.x, rect.y - bounds.y, rect.height];
			// Compact details flow as text and size to their contents. The primary/value pair
			// and the native table or stacked grid cells have measurable column widths.
			return compact && !cell.hasAttribute('data-row-position') ? placement : [...placement, rect.width];
		})];
	}));
}

for (const width of [390, 1440]) {
	test(`loading preserves table and chart geometry at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/loading-states');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.evaluate(() => document.fonts.ready);
		const modes = ['scroll', 'stack', 'rows'];
		const before = [];
		for (const mode of modes) {
			const example = page.getByTestId(mode);
			await expect(example.getByRole('table')).toHaveAccessibleName(/table|rows/i);
			await expect(example.getByRole('columnheader', { name: 'Station' })).toHaveCount(1);
			await expect(example.getByRole('button', { name: 'Station' })).toBeDisabled();
			await expect(example.locator('tbody [data-slot="skeleton"]')).toHaveCount(6);
			await expect(example.locator('caption')).toHaveCount(1);
			await expect(example.locator('[data-slot="data-table-frame"]')).toHaveAttribute('aria-busy', 'true');
			await expect(example.getByRole('region')).toHaveCount(mode === 'scroll' && width === 390 ? 1 : 0);
			before.push(await rowGeometry(example));
		}
		const chart = page.locator('[data-slot="chart-frame"]');
		const area = chart.locator('[data-slot="chart-area"]');
		await expect(chart).toHaveAttribute('aria-busy', 'true');
		await expect(area.locator('[data-slot="skeleton"]')).toHaveCount(1);
		const chartHeight = (await chart.boundingBox())!.height;
		const areaHeight = (await area.boundingBox())!.height;
		await expectNoHorizontalOverflow(page);
		await expectAccessible(page, { include: '[data-testid="loading-states"]' });

		await page.getByRole('button', { name: 'Show loaded examples' }).click();
		for (const [index, mode] of modes.entries()) {
			const example = page.getByTestId(mode);
			await expect(example.getByRole('button', { name: 'Station' })).toBeEnabled();
			const after = await rowGeometry(example);
			expect(after).toHaveLength(2);
			for (const [rowIndex, row] of after.entries()) {
				for (const [dimension, value] of row.entries()) {
					expect(Math.abs(value - before[index]![rowIndex]![dimension]!), `${mode} row ${rowIndex} dimension ${dimension}`).toBeLessThanOrEqual(1);
				}
			}
		}
		await expect(chart).not.toHaveAttribute('aria-busy');
		await expect(area.locator('svg')).toHaveCount(1);
		expect((await chart.boundingBox())!.height).toBe(chartHeight);
		expect((await area.boundingBox())!.height).toBe(areaHeight);
		await expectNoHorizontalOverflow(page);
		await expectAccessible(page, { include: '[data-testid="loading-states"]' });
	});
}

test('busy skeletons pulse until loading ends and respect reduced motion', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/loading-states');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	const skeletons = page.locator('[data-slot="skeleton"]');
	const standalone = skeletons.first();
	expect(await standalone.evaluate((element) => element.closest('[aria-busy="true"]'))).toBe(null);
	const animationNames = () => skeletons.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
	const pulsing = await animationNames();
	expect(pulsing.length).toBeGreaterThan(1);
	expect(pulsing.every((name) => name.includes('pulse'))).toBe(true);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect.poll(animationNames).toEqual(pulsing.map(() => 'none'));
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.getByRole('button', { name: 'Show loaded examples' }).click();
	await expect(skeletons).toHaveCount(1);
	await expect(standalone).toHaveCSS('animation-name', 'none');
});
