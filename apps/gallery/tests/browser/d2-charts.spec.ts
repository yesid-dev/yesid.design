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
		await grid.focus();
		await expect(grid).toBeFocused();
		const before = (await rowHeader.boundingBox())!.x;
		await page.keyboard.press('ArrowRight');
		await expect.poll(() => grid.evaluate((region) => region.scrollLeft)).toBeGreaterThan(0);
		const after = (await rowHeader.boundingBox())!.x;
		expect(Math.abs(before - after)).toBeLessThanOrEqual(8);
		await expectAccessible(page);
	});
});
