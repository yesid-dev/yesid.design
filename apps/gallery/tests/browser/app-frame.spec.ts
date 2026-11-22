import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { LABELS } from '../../src/lib/gallery/site-header-fixture.js';

const frame = '[data-slot="app-frame"]';
const chrome = '[data-slot="app-frame-chrome"]';

async function openFrame(page: Page, path = '/app-frame'): Promise<void> {
	await page.goto(path);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
}

test('ready ranges commit resolved dates and custom validation names and focuses the field', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 850 });
	await openFrame(page);
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	const ranges = page.getByRole('combobox', { name: 'Ready ranges' });
	await ranges.selectOption('month');
	await expect(page.getByText('Showing service from 2026-10-01 to 2026-10-31.')).toBeVisible();
	await ranges.selectOption('');
	const start = page.getByLabel('Start date');
	const end = page.getByLabel('End date');
	const apply = page.getByRole('button', { name: 'Apply dates' });
	await expect(start).toHaveValue('2026-10-01');
	await expect(end).toHaveValue('2026-10-31');
	await expect(start).toHaveAttribute('min', '2026-10-01');
	await expect(end).toHaveAttribute('max', '2026-10-31');
	await expectNoHorizontalOverflow(page);
	await expectAccessible(page, { include: frame });

	await start.fill('');
	await apply.press('Enter');
	await expect(page.getByRole('alert')).toHaveText('Enter both dates.');
	await expect(start).toBeFocused();
	await expect(start).toHaveAttribute('aria-invalid', 'true');
	await start.fill('2026-09-30');
	await apply.press('Enter');
	await expect(page.getByRole('alert')).toHaveText('Choose dates in October.');
	await expect(start).toBeFocused();
	await start.fill('2026-10-20');
	await end.fill('2026-10-10');
	await apply.press('Enter');
	await expect(page.getByRole('alert')).toHaveText('End date must follow the start date.');
	await expect(end).toBeFocused();
	await expect(page.getByText('Showing service from 2026-10-01 to 2026-10-31.')).toBeVisible();
	await end.fill('2026-10-21');
	await apply.press('Enter');
	await expect(page.getByRole('alert')).toHaveCount(0);
	await expect(page.getByText('Showing service from 2026-10-20 to 2026-10-21.')).toBeVisible();
});

test('network selection offers full option names and shows the phone code', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await openFrame(page);
	const network = page.getByRole('combobox', { name: 'Transit network' });
	const picker = page.locator('[data-slot="network-picker"]');
	await expect(picker.getByText('STM', { exact: true })).toBeVisible();
	await expect(network.getByRole('option', { name: 'Ottawa · OC Transpo' })).toHaveCount(1);
	await network.focus();
	await page.keyboard.press('End');
	await expect(network).toHaveValue('ott');
	await expect(picker.getByText('OC', { exact: true })).toBeVisible();
	await expect(picker).toHaveCSS('outline-style', 'solid');
	await page.setViewportSize({ width: 1200, height: 800 });
	await expect(picker.getByText('Ottawa · OC Transpo', { exact: true }).first()).toBeVisible();
});

test('wrapped chrome publishes its changed height and sticks together at 200% text', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await openFrame(page);
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	const brand = page.getByRole('link', { name: 'Transit', exact: true });
	const lines = await brand.evaluate((link) => {
		const range = document.createRange();
		range.selectNodeContents(link);
		return range.getClientRects().length;
	});
	expect(lines).toBe(1);
	await expectNoHorizontalOverflow(page);

	const stack = page.locator(chrome);
	const before = (await stack.boundingBox())!.height;
	await page.getByRole('combobox', { name: 'Ready ranges' }).selectOption('');
	await expect(page.getByLabel('Start date')).toBeVisible();
	const measured = (await stack.boundingBox())!.height;
	expect(measured).toBeGreaterThan(before);
	await expect(page.getByTestId('chrome-height')).toHaveText(String(Math.round(measured)));
	await expect(page.locator(frame)).toHaveCSS('--app-frame-chrome-height', `${Math.round(measured)}px`);
	await page.evaluate(() => window.scrollTo(0, 300));
	expect((await stack.boundingBox())!.y).toBeCloseTo(0, 0);
	const header = (await page.getByRole('banner').boundingBox())!;
	const controls = (await page.locator('[data-slot="app-frame-controls"]').boundingBox())!;
	expect(controls.y).toBeCloseTo(header.y + header.height, 0);

	await page.getByRole('button', { name: LABELS.openMenu }).click();
	const dialog = page.getByRole('dialog', { name: LABELS.menu });
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('link', { name: 'Full viewport' })).toBeInViewport();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});

test('full viewport reserves chrome and places the evidence in a desktop rail or mobile sheet', async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 800 });
	await openFrame(page, '/app-frame/viewport');
	const main = page.getByRole('main');
	const evidence = page.getByRole('complementary', { name: 'Evidence' });
	await expect(evidence).toBeVisible();
	const body = (await main.boundingBox())!;
	expect(body.y + body.height).toBeCloseTo(800, 0);
	expect((await evidence.boundingBox())!.x).toBeGreaterThanOrEqual(body.x + body.width);
	expect(body.y).toBeCloseTo((await page.locator(chrome).boundingBox())!.height, 0);

	await page.setViewportSize({ width: 390, height: 800 });
	await expect(evidence).toBeHidden();
	const button = page.getByRole('button', { name: /Open evidence/ });
	await button.click();
	const dialog = page.getByRole('dialog', { name: 'Evidence' });
	await expect(dialog.getByText('Scheduled trips and reported arrivals.')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
	await expect(button).toBeFocused();
});

test.describe('server layout', () => {
	test.use({ javaScriptEnabled: false });

	test('the header already reserves its height above the controls and content', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 800 });
		await page.goto('/app-frame');
		const header = (await page.getByRole('banner').boundingBox())!;
		const controls = (await page.locator('[data-slot="app-frame-controls"]').boundingBox())!;
		const main = (await page.getByRole('main').boundingBox())!;
		expect(controls.y).toBeCloseTo(header.y + header.height, 0);
		expect(main.y).toBeCloseTo(controls.y + controls.height, 0);
	});
});
