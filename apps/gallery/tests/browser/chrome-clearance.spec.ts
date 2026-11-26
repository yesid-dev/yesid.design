import { expect, test, type Page } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
	a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

async function open(page: Page, theme = 'dark', width = 390): Promise<void> {
	await page.setViewportSize({ width, height: 844 });
	await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
	await page.goto('/chrome-clearance');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await expect(page.locator('html')).toHaveClass(/chrome-clearance/);
	await page.evaluate(() => document.fonts.ready);
}

const tocPill = (page: Page) => page.locator('[data-testid="toc-pill"] .toc-pill');
const railPill = (page: Page) => page.locator('.surface-rail-pill');

for (const theme of ['dark', 'light']) {
	for (const width of [320, 390, 768]) {
		test(`the contents and rail pills never share a spot at ${width}px in ${theme}`, async ({ page }) => {
			await open(page, theme, width);
			const toc = (await tocPill(page).boundingBox())!;
			const rail = (await railPill(page).boundingBox())!;
			expect(overlaps(toc, rail)).toBe(false);
			expect(toc.y + toc.height).toBeLessThanOrEqual(rail.y);
			expect(rail.y + rail.height).toBeLessThanOrEqual(width >= 1024 ? Infinity : 844);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		});
	}
}

test('the contents pill steps aside while the rail sheet is open, and returns', async ({ page }) => {
	await open(page);
	await railPill(page).click();
	await expect(page.locator('[data-slot="surface-rail-mobile"]')).toHaveAttribute('data-open', 'true');
	await expect(tocPill(page)).toBeHidden();
	await page.keyboard.press('Escape');
	await expect(page.locator('[data-slot="surface-rail-mobile"]')).toHaveAttribute('data-open', 'false');
	await expect(tocPill(page)).toBeVisible();
});

test('forward Tab keeps the focused link above both pills', async ({ page }) => {
	await open(page);
	const pillTop = (await tocPill(page).boundingBox())!.y;
	const links = page.locator('[data-fixture="prose-link"]');
	const count = await links.count();
	let checked = 0;
	// Four links per section; the first link of a section follows its heading button in tab order.
	for (let index = 1; index < count && checked < 4; index += 1) {
		if (index % 4 === 0) continue;
		const target = links.nth(index);
		const below = await target.evaluate((element) => element.getBoundingClientRect().top > innerHeight);
		if (!below) continue;
		await links.nth(index - 1).evaluate((element: HTMLElement) => element.focus({ preventScroll: true }));
		await page.keyboard.press('Tab');
		await expect(target).toBeFocused();
		const box = (await target.boundingBox())!;
		expect(box.y + box.height, `link ${index}`).toBeLessThanOrEqual(pillTop);
		checked += 1;
		await page.evaluate(() => scrollTo(0, 0));
	}
	expect(checked).toBeGreaterThan(0);
});

test('backward Tab keeps the focused link below the header', async ({ page }) => {
	await open(page);
	const links = page.locator('[data-fixture="prose-link"]');
	const last = (await links.count()) - 1;
	await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
	const headerBottom = (await page.locator('body header').first().boundingBox())!;
	let checked = 0;
	for (let index = last - 1; index >= 0 && checked < 4; index -= 1) {
		if (index % 4 === 3) continue;
		const target = links.nth(index);
		const above = await target.evaluate((element) => element.getBoundingClientRect().bottom < 0);
		if (!above) continue;
		await links.nth(index + 1).evaluate((element: HTMLElement) => element.focus({ preventScroll: true }));
		await page.keyboard.press('Shift+Tab');
		await expect(target).toBeFocused();
		const box = (await target.boundingBox())!;
		expect(box.y, `link ${index}`).toBeGreaterThanOrEqual(headerBottom.y + headerBottom.height);
		checked += 1;
		await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
	}
	expect(checked).toBeGreaterThan(0);
});

test('a contents jump still lands on the 25% line under the clearance padding', async ({ page }) => {
	await open(page);
	await tocPill(page).click();
	// Sample before the click that starts the jump; on a fast runner it lands before the section reads expanded.
	const startY = await page.evaluate(() => scrollY);
	await page.locator('.toc-drawer-item', { hasText: 'Section limits' }).click();
	const target = page.locator('[data-toc="limits"]');
	await expect(target.locator('[data-section-trigger]')).toHaveAttribute('aria-expanded', 'true');
	// The jump settles layout over a few frames before it lands, so wait for the landing itself.
	await expect
		.poll(async () => Math.abs(await target.evaluate((element) => element.getBoundingClientRect().top - innerHeight * 0.25)))
		.toBeLessThanOrEqual(2);
	expect(await page.evaluate(() => scrollY)).toBeGreaterThan(startY);
});
