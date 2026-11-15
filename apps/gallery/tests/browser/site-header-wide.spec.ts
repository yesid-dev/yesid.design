import { expect, test, type Page } from '@playwright/test';
import { WIDE_LANGS } from '../../src/lib/gallery/wide-header-fixture.js';

// Transit R1063-1: a wider supplied brand plus extra controls fit only from about 1230px, yet
// priority 3 showed from 1024px before hydration and links-fit took it out after, moving both
// toggles about 169px at 1206px. The fixture raises priority 3 to 1280px with linkTiers.
const WIDTHS = [320, 390, 1206, 1280];

interface HeaderBoxes {
	pill: { x: number; right: number };
	brand: { x: number; width: number };
	toggles: number[];
	links: { label: string; x: number }[];
	pageWidth: number;
}

function boxes(page: Page): Promise<HeaderBoxes> {
	return page.getByTestId('nav-pill').evaluate((nav) => {
		const box = (el: Element) => el.getBoundingClientRect();
		const brand = box(nav.querySelector('[data-slot="product-brand"]')!);
		return {
			pill: { x: box(nav).x, right: box(nav).right },
			brand: { x: brand.x, width: brand.width },
			toggles: [nav.querySelector('[role="switch"]')!, nav.querySelector('[data-testid="language-toggle"]')!].map((el) => box(el).x),
			links: [...nav.querySelectorAll<HTMLElement>('.nav-pill-link')]
				.filter((link) => link.checkVisibility({ visibilityProperty: true }))
				.map((link) => ({ label: link.textContent!.trim(), x: box(link).x })),
			pageWidth: document.documentElement.scrollWidth,
		};
	});
}

async function stylesheetsLoaded(page: Page) {
	await page.waitForFunction(() => [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every((link) => link.sheet));
}

for (const lang of WIDE_LANGS) {
	test(`${lang}: a wide brand keeps the header still through hydration at 320, 390, 1206 and 1280px`, async ({ browser, baseURL }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers every width');
		for (const width of WIDTHS) {
			const where = `${lang} at ${width}px`;
			const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'no-preference' });
			let release!: () => void;
			const gate = new Promise<void>((resolve) => { release = resolve; });
			await context.route('**/*.js', async (route) => { await gate; await route.continue(); });
			try {
				const page = await context.newPage();
				await page.goto(`${baseURL}/site-header-wide/${lang}`, { waitUntil: 'commit' });
				await expect(page.getByTestId('language-toggle')).toBeVisible();
				await stylesheetsLoaded(page);
				await page.evaluate(() => document.fonts.ready);
				const before = await boxes(page);
				release();
				await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
				await page.evaluate(() => new Promise<void>((resolve) => {
					requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
				}));
				const after = await boxes(page);

				expect(after.links.map((link) => link.label), `links, ${where}`).toEqual(before.links.map((link) => link.label));
				expect(after.links.length, `priority 3 shows only from 1280px, ${where}`).toBe(width >= 1280 ? 3 : 0);
				after.links.forEach((link, i) => {
					expect(Math.abs(link.x - before.links[i].x), `${link.label} moved, ${where}`).toBeLessThanOrEqual(0.1);
				});
				expect(Math.abs(after.brand.x - before.brand.x), `brand moved, ${where}`).toBeLessThanOrEqual(0.1);
				expect(Math.abs(after.brand.width - before.brand.width), `brand width, ${where}`).toBeLessThanOrEqual(0.1);
				after.toggles.forEach((x, i) => {
					expect(Math.abs(x - before.toggles[i]), `toggle ${i} moved, ${where}`).toBeLessThanOrEqual(0.1);
				});
				expect(after.pill.x, `pill left edge, ${where}`).toBeGreaterThanOrEqual(0);
				expect(after.pill.right, `pill right edge, ${where}`).toBeLessThanOrEqual(width);
				expect(after.pageWidth, `page width, ${where}`).toBeLessThanOrEqual(width);
			} finally {
				release();
				await context.unrouteAll({ behavior: 'wait' });
				await context.close();
			}
		}
	});
}

test('without linkTiers the defaults are unchanged: priority 3 from 1024px', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run');
	await page.goto('/site-header');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	const nav = page.getByTestId('nav-pill');
	await expect(nav).not.toHaveAttribute('data-priority2-from');
	await expect(nav).not.toHaveAttribute('data-priority3-from');
	await page.setViewportSize({ width: 1024, height: 800 });
	await expect(nav.getByRole('link', { name: 'Detail', exact: true })).toBeVisible();
	await page.setViewportSize({ width: 1023, height: 800 });
	await expect(nav.getByRole('link', { name: 'Detail', exact: true })).toBeHidden();
});
