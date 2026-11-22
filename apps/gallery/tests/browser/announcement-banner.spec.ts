import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const first = '/announcement-banner';
const second = '/announcement-banner/second';
const omitted = '/announcement-banner/none';
const slot = '[data-slot="announcement-banner"]';
const message = 'See what is coming next on the project roadmap';
const secondMessage = 'Explore the new project roadmap';
const closeLabel = 'Dismiss announcement';

test('dismissal lasts across reloads and navigation for only that message', async ({ page }) => {
	await page.goto(first);
	await page.getByRole('button', { name: closeLabel }).click();
	await expect(page.getByRole('region', { name: message })).toBeHidden();
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Site announcement banner' })).toBeVisible();
	await expect(page.locator(slot)).toBeHidden();
	await page.getByRole('link', { name: 'Second message', exact: true }).click();
	await expect(page).toHaveURL(second);
	await expect(page.getByRole('link', { name: secondMessage })).toBeVisible();
	await page.getByRole('link', { name: 'First message', exact: true }).click();
	await expect(page).toHaveURL(first);
	await expect(page.locator(slot)).toBeHidden();
});

test('a saved dismissal has the same pre-hydration geometry as an omitted banner', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('yesid:announcement:first', 'dismissed'));
	await page.route('**/_app/**/*.js', (route) => route.abort());
	await page.goto(omitted);
	await expect(page.locator(slot)).toHaveCount(0);
	const header = page.getByRole('banner');
	const headerTop = await header.evaluate((element) => element.getBoundingClientRect().top);
	await page.goto(first);
	await expect(page.locator('html')).toHaveAttribute('data-announcement-dismissed', 'first');
	await expect(page.locator(slot)).toHaveCount(1);
	await expect(page.locator(slot)).toBeHidden();
	expect(await header.evaluate((element) => element.getBoundingClientRect().top)).toBe(headerTop);
});

test('blocked storage keeps the announcement readable and clicking close does not throw', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', {
			get: () => { throw new DOMException('Storage is blocked', 'SecurityError'); },
		});
	});
	await page.goto(first);
	await page.getByRole('button', { name: closeLabel }).click();
	await expect(page.getByRole('link', { name: message })).toBeVisible();
	expect(errors).toEqual([]);
});

test('the banner fits 320px at 200% text and follows keyboard order', { tag: '@theme' }, async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 800 });
	await page.goto(first);
	await expectAccessible(page, { include: slot });
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	const link = page.getByRole('link', { name: message });
	const close = page.getByRole('button', { name: closeLabel });
	await expect(close).toBeEnabled();
	const banner = page.getByRole('region', { name: message });
	await expect(banner).toBeVisible();
	const bannerBottom = await banner.evaluate((element) => element.getBoundingClientRect().bottom);
	const headerTop = await page.getByRole('banner').evaluate((element) => element.getBoundingClientRect().top);
	expect(headerTop).toBeGreaterThanOrEqual(bannerBottom);
	await expectNoHorizontalOverflow(page);
	await expectAccessible(page, { include: slot });
	await page.keyboard.press('Tab');
	await expect(link).toBeFocused();
	await expect(link).toHaveCSS('outline-style', 'solid');
	await page.keyboard.press('Tab');
	await expect(close).toBeFocused();
	await expect(close).toHaveCSS('outline-style', 'solid');
	await page.keyboard.press('Enter');
	await expect(link).toBeHidden();
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('shows the message and follows the native link', async ({ page }) => {
		await page.goto(first);
		const link = page.getByRole('link', { name: message });
		await expect(link).toBeVisible();
		await expect(page.getByRole('button', { name: closeLabel })).toBeHidden();
		await link.click();
		await expect(page).toHaveURL(second);
		await expect(page.getByRole('link', { name: secondMessage })).toBeVisible();
	});
});
