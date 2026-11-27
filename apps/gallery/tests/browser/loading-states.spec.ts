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
		const modes = ['scroll', 'stack', 'rows'] as const;
		const before = [];
		for (const mode of modes) {
			const example = page.getByTestId(mode);
			const caption = { scroll: 'Scrollable table', stack: 'Stacked table', rows: 'Compact rows' }[mode];
			await expect(example.getByRole('table', { name: caption })).toHaveAttribute('aria-busy', 'true');
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

	test(`sorting retains focus throughout a refresh at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/loading-states');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.getByRole('button', { name: 'Show loaded examples' }).click();
		const table = page.getByRole('table', { name: 'Compact rows' });
		const header = table.getByRole('columnheader', { name: 'Station' });
		const sort = header.getByRole('button');
		await sort.focus();
		await expect(sort).toBeFocused();
		// Trigger a refresh without transferring focus to the Gallery control.
		await page.getByRole('button', { name: 'Show loading examples' }).evaluate((button: HTMLButtonElement) => button.click());
		await expect(table).toHaveAttribute('aria-busy', 'true');
		await expect(sort).toBeDisabled();
		await expect(sort).toBeFocused();
		await page.keyboard.press('Enter');
		await page.keyboard.press('Space');
		await expect(header).toHaveAttribute('aria-sort', 'ascending');
		await page.getByRole('button', { name: 'Show loaded examples' }).evaluate((button: HTMLButtonElement) => button.click());
		await expect(table).not.toHaveAttribute('aria-busy');
		await expect(sort).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(header).toHaveAttribute('aria-sort', 'descending');
	});
}

for (const position of ['end', 'moved'] as const) {
	test(`first loaded rows preserve the ${position} scroll position on a phone`, async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/loading-states');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		const frame = page.getByRole('region', { name: 'Latest service' });
		const getScroll = () => frame.evaluate((element) => ({ left: element.scrollLeft, max: element.scrollWidth - element.clientWidth }));
		await expect.poll(async () => {
			const { left, max } = await getScroll();
			return max > 0 && Math.abs(left - max) <= 1;
		}).toBe(true);
		if (position === 'moved') {
			await frame.evaluate((element) => { element.scrollLeft = 40; });
		}
		const before = await getScroll();
		await page.getByRole('button', { name: 'Show loaded examples' }).click();
		await expect.poll(async () => {
			const { left, max } = await getScroll();
			return max > before.max && Math.abs(left - (position === 'end' ? max : before.left)) <= 1;
		}).toBe(true);
	});
}

test('known empty compact rows keep their one-line height during loading', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto('/loading-states');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
	const table = page.getByRole('table', { name: 'Refreshing service reports' });
	const placeholders = table.locator('tbody tr');
	await expect(placeholders).toHaveCount(3);
	await expect(placeholders.nth(0)).toHaveAttribute('data-row-empty', 'true');
	await expect(placeholders.nth(1)).not.toHaveAttribute('data-row-empty');
	await expect(placeholders.nth(2)).not.toHaveAttribute('data-row-empty');
	const waitingHeight = (await placeholders.first().boundingBox())!.height;
	await page.getByRole('button', { name: 'Show loaded examples' }).click();
	const row = table.getByRole('row', { name: /Central/ });
	await expect(row).toHaveCount(1);
	expect(Math.abs((await row.boundingBox())!.height - waitingHeight)).toBeLessThanOrEqual(1);
});

test('skeleton fill separates from its card and the page background @theme', async ({ page }, testInfo) => {
	await page.goto('/loading-states');
	await expect(page.locator('html')).toHaveAttribute('data-theme', testInfo.project.name);
	const card = page.getByTestId('skeleton-card');
	const skeleton = card.locator('[data-slot="skeleton"]');
	const colors = testInfo.project.name === 'dark'
		? { card: 'rgb(26, 26, 26)', page: 'rgb(20, 20, 20)', skeleton: 'rgb(58, 58, 58)' }
		: { card: 'rgb(249, 250, 253)', page: 'rgb(243, 246, 251)', skeleton: 'rgb(220, 226, 236)' };
	await expect(card).toHaveCSS('background-color', colors.card);
	await expect(page.locator('.min-h-screen.bg-background')).toHaveCSS('background-color', colors.page);
	await expect(skeleton).toHaveCSS('background-color', colors.skeleton);

	await page.emulateMedia({ forcedColors: 'active' });
	await expect(skeleton).toBeVisible();
	await expect(skeleton).toHaveCSS('background-color', await card.evaluate((el) => getComputedStyle(el).backgroundColor));
});

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
