import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const path = '/chart-parts';

test.describe('D2 service charts', { tag: '@theme' }, () => {
	test('exposes chart names, reference and missing values', async ({ page }) => {
		await page.goto(path);
		const share = page.getByRole('img', { name: '8% early, 83% on time, 8% late, 1% unknown' });
		await expect(share).toBeVisible();
		const [track, smallest] = await share.evaluate((element) => [
			element.getBoundingClientRect().width,
			element.lastElementChild!.getBoundingClientRect().width,
		]);
		expect(smallest).toBeGreaterThanOrEqual(track * 0.02 - 0.1);
		await expect(page.getByText('No measured departures.')).toBeVisible();
		const grid = page.getByRole('table', { name: 'Late departures by hour' });
		await expect(grid.getByRole('columnheader', { name: '6:00' })).toBeVisible();
		await expect(grid.getByRole('rowheader', { name: 'Monday' })).toBeVisible();
		for (const name of [
			'Monday, 6:00, 0 late departures',
			'Tuesday, 6:00, too few trips',
			'Tuesday, 7:00, no service',
			'Tuesday, 8:00, no measurement',
		]) {
			await expect(grid.getByRole('cell', { name })).toHaveAttribute('title', name);
		}
		const range = page.getByRole('img', { name: 'Estimated wait 12 minutes, between 9 and 15' });
		await expect(range).toHaveAccessibleDescription('Network wait is 10 minutes');
		await expect(page.getByText('9–15 minutes', { exact: true })).toBeVisible();
		const stops = page.getByRole('list', { name: 'Stops along route 24' });
		await expect(stops.getByRole('link', { name: 'Main Street' })).toHaveAttribute('href', '#main-street');
		await expect(stops.getByText('On time', { exact: true })).toBeVisible();
		await expect(stops.getByText('Too few trips', { exact: true })).toBeVisible();
		await expect(stops.getByText('River crossing')).toHaveCount(1);
		await expect(page.getByText('Five-minute threshold')).toBeVisible();
		await expectAccessible(page);
	});

	test('reflows at 320px and scrolls the grid at 200% text', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 850 });
		await page.goto(path);
		await expectNoHorizontalOverflow(page);
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await expectNoHorizontalOverflow(page);
		const grid = page.getByRole('region', { name: 'Late departures by hour' });
		const rowHeader = grid.getByRole('rowheader', { name: 'Monday' });
		const card = page.getByTestId('hour-grid-card');
		const surface = await card.evaluate((element) => getComputedStyle(element).backgroundColor);
		const canvas = await page.locator('html').evaluate((element) => getComputedStyle(element).backgroundColor);
		expect(surface).not.toBe(canvas);
		await expect(rowHeader).toHaveCSS('background-color', surface);
		await grid.focus();
		await expect(grid).toBeFocused();
		const before = (await rowHeader.boundingBox())!.x;
		await page.keyboard.press('ArrowRight');
		await expect.poll(() => grid.evaluate((region) => region.scrollLeft)).toBeGreaterThan(0);
		const after = (await rowHeader.boundingBox())!.x;
		expect(Math.abs(before - after)).toBeLessThanOrEqual(8);
		await expect(rowHeader).toHaveCSS('background-color', surface);
		await expectAccessible(page);
	});

	for (const width of [320, 1440]) {
		test(`chart targets meet the kit tap minimum at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 850 });
			await page.goto(path);
			if (width === 320) await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			const stops = page.getByRole('list', { name: 'Stops along route 24' });
			const grid = page.getByRole('region', { name: 'Late departures by hour' });
			for (const target of [...await stops.getByRole('link').all(), grid]) {
				const bounds = await target.boundingBox();
				expect(bounds?.width).toBeGreaterThanOrEqual(44);
				expect(bounds?.height).toBeGreaterThanOrEqual(44);
			}
		});
	}

	test('forced colors preserve band gaps and the full label without rows', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' });
		await page.goto(path);
		const label = 'Early 8%, on time 83%, late 8%, unknown 1%';
		const share = page.getByRole('img', { name: label });
		await expect(share).toHaveAccessibleName(label);
		await expect(share.locator('..').locator('dl')).toHaveCount(0);
		const bands = await share.locator(':scope > span').evaluateAll((elements) => elements.map((element) => {
			const { left, right } = element.getBoundingClientRect();
			return { left, right, ink: getComputedStyle(element).backgroundColor };
		}));
		expect(bands).toHaveLength(4);
		expect(new Set(bands.map((band) => band.ink)).size).toBe(1);
		for (let index = 1; index < bands.length; index++) {
			expect(bands[index].left - bands[index - 1].right).toBeCloseTo(2, 1);
		}
	});
});
