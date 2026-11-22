import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { LABELS } from '../../src/lib/gallery/site-header-fixture.js';

const frame = '[data-slot="app-frame"]';
const chrome = '[data-slot="app-frame-chrome"]';

async function openFrame(page: Page, path = '/app-frame'): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto(path);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
}

test('ready ranges commit resolved dates and custom validation names and focuses the field', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 850 });
	await openFrame(page);
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	const ranges = page.getByRole('combobox', { name: 'Ready ranges' });
	await expect(ranges.getByRole('option', { name: 'Impossible dates' })).toHaveJSProperty('disabled', true);
	await expect(ranges.getByRole('option', { name: 'Five-digit year' })).toHaveJSProperty('disabled', true);
	await ranges.selectOption('month');
	await expect(page.getByText('Showing service from 2026-10-01 to 2026-10-31.')).toBeVisible();
	await ranges.selectOption('');
	const start = page.getByLabel('Start date');
	const end = page.getByLabel('End date');
	const apply = page.getByRole('button', { name: 'Apply dates' });
	await expect(start).toHaveValue('2026-10-01');
	await expect(end).toHaveValue('2026-10-31');
	await expect(start).toHaveAttribute('min', '2026-01-01');
	await expect(end).toHaveAttribute('max', '2027-12-31');
	await expectNoHorizontalOverflow(page);
	await expectAccessible(page, { include: frame });

	await start.fill('');
	await end.fill('');
	await apply.press('Enter');
	const alert = page.getByRole('alert');
	await expect(alert).toHaveText('Enter two valid dates.');
	await expect(start).toBeFocused();
	await expect(start).toHaveAttribute('aria-invalid', 'true');
	await expect(end).toHaveAttribute('aria-invalid', 'true');
	await apply.press('Enter');
	await expect(alert).toHaveText('Enter two valid dates.');
	await start.fill('2025-12-31');
	await end.fill('2026-10-31');
	await apply.press('Enter');
	await expect(alert).toHaveText('Choose dates within the record.');
	await expect(start).toBeFocused();
	await page.getByRole('button', { name: 'Refresh date data' }).dispatchEvent('click');
	await expect(start).toHaveValue('2025-12-31');
	await expect(start).toBeFocused();
	await page.getByRole('button', { name: 'Extend the date bounds' }).dispatchEvent('click');
	await expect(alert).toHaveText('');
	await expect(start).not.toHaveAttribute('aria-invalid');
	await start.fill('2026-10-20');
	await end.fill('2026-10-10');
	await apply.press('Enter');
	await expect(page.getByRole('alert')).toHaveText('End date must follow the start date.');
	await expect(end).toBeFocused();
	await expect(page.getByText('Showing service from 2026-10-01 to 2026-10-31.')).toBeVisible();
	await end.fill('2026-10-21');
	await apply.press('Enter');
	await expect(alert).toHaveText('');
	await expect(page.getByText('Showing service from 2026-10-20 to 2026-10-21.')).toBeVisible();
});

test('network selection offers full option names and shows the phone code', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 800 });
	await openFrame(page);
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	const network = page.getByRole('combobox', { name: 'Transit network' });
	const picker = page.locator('[data-slot="network-picker"]');
	await expect(picker.getByText('STM', { exact: true })).toBeVisible();
	await expect(network.getByRole('option', { name: 'Ottawa · OC Transpo' })).toHaveCount(1);
	await network.focus();
	await page.keyboard.press('End');
	await expect(network).toHaveValue('ott');
	await expect(picker.getByText('OC', { exact: true })).toBeVisible();
	await expect(picker).toHaveCSS('outline-style', 'solid');
	await page.getByRole('button', { name: 'Defer network changes' }).click();
	await network.focus();
	await page.keyboard.press('Home');
	const confirm = page.getByRole('button', { name: 'Confirm network change' });
	await expect(confirm).toBeVisible();
	await expect(network).toHaveValue('ott');
	await expect(picker.getByText('OC', { exact: true })).toBeVisible();
	await confirm.click();
	await expect(network).toHaveValue('mtl');
	await page.setViewportSize({ width: 1200, height: 800 });
	await expect(picker.getByText('Montréal · STM', { exact: true }).first()).toBeVisible();
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
	const pill = page.getByTestId('nav-pill');
	await expect(pill.getByRole('searchbox', { includeHidden: true })).toHaveCount(1);
	await expect(pill.getByText('Record', { exact: true })).toHaveCount(1);
	const dividers = pill.locator(':scope > .nav-divider');
	for (const divider of await dividers.all()) await expect(divider).toBeHidden();

	const stack = page.locator(chrome);
	const before = (await stack.boundingBox())!.height;
	await page.getByRole('combobox', { name: 'Ready ranges' }).selectOption('');
	await expect(page.getByLabel('Start date')).toBeVisible();
	const measured = (await stack.boundingBox())!.height;
	expect(measured).toBeGreaterThan(before);
	await expect(page.getByTestId('chrome-height')).toHaveText(String(Math.ceil(measured)));
	await expect(page.locator(frame)).toHaveCSS('--app-frame-chrome-height', `${Math.ceil(measured)}px`);
	await expect(page.locator('html')).toHaveCSS('scroll-padding-top', `${Math.ceil(measured)}px`);
	expect(await page.locator('html').evaluate((el) => parseFloat(getComputedStyle(el).scrollPaddingBottom)))
		.toBeGreaterThanOrEqual(44);
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
	await page.getByRole('link', { name: 'Jump to details' }).click();
	await expect(page).toHaveURL(/#details$/);
	await expect.poll(async () => (await page.locator('#details').boundingBox())!.y).toBeGreaterThanOrEqual(measured - 1);
	await expect(page.getByRole('contentinfo')).toBeVisible();
	await expect(page.getByRole('main', { name: 'Service workspace' }).getByRole('contentinfo')).toHaveCount(0);
});

for (const width of [320, 390]) {
	test(`short viewport at ${width}px keeps custom dates, the header menu and the evidence sheet reachable`, async ({ page }) => {
		await page.setViewportSize({ width, height: 275 });
		await openFrame(page, '/app-frame/viewport');
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await page.getByRole('combobox', { name: 'Ready ranges' }).selectOption('');
		const main = page.getByRole('main');
		await expect.poll(async () => (await main.boundingBox())!.height).toBeGreaterThanOrEqual(44);
		const apply = page.getByRole('button', { name: 'Apply dates' });
		await apply.scrollIntoViewIfNeeded();
		await expect(apply).toBeInViewport();
		await apply.click();
		await page.getByRole('button', { name: LABELS.openMenu }).click();
		const menu = page.getByRole('dialog', { name: LABELS.menu });
		await expect(menu.getByRole('link', { name: 'Full viewport' })).toBeInViewport();
		await page.keyboard.press('Escape');
		await expect(menu).toBeHidden();
		await page.getByRole('button', { name: /Open evidence/ }).click();
		const sheet = page.getByRole('dialog', { name: 'Evidence' });
		await expect(sheet).toBeVisible();
		await expect(page.getByText('Scheduled trips and reported arrivals.')).toBeInViewport();
		await sheet.getByRole('link', { name: 'Read the record' }).click({ trial: true });
		await expectNoHorizontalOverflow(page);
	});
}

test('short document viewport lets tall chrome scroll away', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 185 });
	await openFrame(page);
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	await page.getByRole('combobox', { name: 'Ready ranges' }).selectOption('');
	await expect(page.getByLabel('Start date')).toBeVisible();
	const stack = page.locator(chrome);
	await expect(stack).toHaveCSS('position', 'relative');
	await expect(page.locator('html')).toHaveCSS('scroll-padding-top', '0px');
	await page.evaluate(() => window.scrollTo(0, 400));
	await expect.poll(async () => (await stack.boundingBox())!.y).toBeLessThan(0);
});

test.describe('desktop input', () => {
	test.use({ hasTouch: false, isMobile: false });

	test('wheel scroll reaches the full-viewport main with Lenis enabled', async ({ page }) => {
		await page.setViewportSize({ width: 1200, height: 800 });
		await openFrame(page, '/app-frame/viewport');
		await expect(page.locator('html')).toHaveClass(/\blenis\b/);
		const main = page.getByRole('main');
		const box = (await main.boundingBox())!;
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
		await page.mouse.wheel(0, 400);
		await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(0);
	});
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
