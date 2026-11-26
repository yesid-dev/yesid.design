import { expect, test, type Locator, type Page } from '@playwright/test';
import { LABELS } from '../../src/lib/gallery/site-header-fixture.js';

// Opening an overlay locks body scroll. On a scrolled page the header must stay where it was.
const WIDTHS = [390, 768, 1023, 1440];
const SCROLL = 248;
const FIXTURES = [
	{ name: 'inside AppFrame', path: '/app-frame', tall: false },
	{ name: 'without AppFrame', path: '/site-header', tall: true },
];

const top = (locator: Locator) => locator.evaluate((element) => element.getBoundingClientRect().top);
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
// The topmost element at the control's centre belongs to it, so a pointer reaches it.
const hit = (locator: Locator) => locator.evaluate((element) => {
	const rect = element.getBoundingClientRect();
	return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
});
// Playwright's locator click scrolls its target into view; a person clicks where the control is.
async function pointerClick(page: Page, locator: Locator) {
	const box = (await locator.boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function openScrolled(page: Page, path: string, tall: boolean) {
	await page.goto(path);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	if (tall) await page.addStyleTag({ content: 'main#main { min-block-size: 300vh; }' });
	await page.evaluate((y) => window.scrollTo(0, y), SCROLL);
	await expect.poll(() => scrollY(page)).toBe(SCROLL);
}

for (const { name, path, tall } of FIXTURES) {
	for (const motion of ['reduce', 'no-preference'] as const) {
		test(`the open menu keeps the pill and its close button in place on a scrolled page ${name} (${motion} motion)`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run sets every width');
			await page.emulateMedia({ reducedMotion: motion });
			for (const width of WIDTHS) {
				await page.setViewportSize({ width, height: 844 });
				await openScrolled(page, path, tall);
				const pill = page.getByTestId('nav-pill');
				const toggle = page.getByTestId('nav-menu-toggle');
				const before = { pill: await top(pill), toggle: await top(toggle), scroll: await scrollY(page) };

				await pointerClick(page, toggle);
				await expect(page.getByRole('dialog', { name: LABELS.menu })).toBeVisible();
				await expect(toggle).toHaveAccessibleName(LABELS.closeMenu);
				await expect(toggle).toBeFocused();
				expect(await top(pill), `pill top at ${width}px`).toBeCloseTo(before.pill, 0);
				expect(await top(toggle), `close button top at ${width}px`).toBeCloseTo(before.toggle, 0);
				await expect(pill).toBeInViewport({ ratio: 1 });
				await expect(toggle).toBeInViewport({ ratio: 1 });
				await expect.poll(() => hit(toggle), `close button reachable at ${width}px`).toBe(true);

				await page.keyboard.press('Enter');
				await expect(page.getByRole('dialog', { name: LABELS.menu })).toBeHidden();
				await expect(toggle).toHaveAccessibleName(LABELS.openMenu);
				await expect(toggle).toBeFocused();
				// The lock releases after the dialog leaves; measure once the page scrolls again.
				await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
				expect(await scrollY(page), `scroll after closing at ${width}px`).toBe(before.scroll);
				expect(await top(pill), `pill top after closing at ${width}px`).toBeCloseTo(before.pill, 0);
			}
		});
	}
}

test('an open sheet keeps the AppFrame chrome in place on a scrolled page', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets its own width');
	await page.setViewportSize({ width: 390, height: 844 });
	await openScrolled(page, '/app-frame', false);
	const chrome = page.locator('[data-slot="app-frame-chrome"]');
	const before = await top(chrome);

	await pointerClick(page, page.getByRole('button', { name: /Open evidence/ }));
	await expect(page.getByRole('dialog', { name: 'Evidence' })).toBeVisible();
	expect(await top(chrome)).toBeCloseTo(before, 0);
	await expect(page.getByTestId('nav-pill')).toBeInViewport({ ratio: 1 });
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Evidence' })).toBeHidden();
	expect(await scrollY(page)).toBe(SCROLL);
});
