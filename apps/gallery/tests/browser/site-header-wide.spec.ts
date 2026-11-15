import { expect, test, type Browser, type Page } from '@playwright/test';
import { WIDE_LANGS } from '../../src/lib/gallery/wide-header-fixture.js';

// Each case loads a fresh page per width.
test.describe.configure({ timeout: 120_000 });

// Transit R1063-1: a wider supplied brand plus search and actions fit only from a wider header
// than the default tiers assume, so links showed before hydration and links-fit took them out
// after, moving both toggles. The fixture raises priority 3 to 1280px with linkTiers. The tiers
// are in em, so at a 20px default font size the same floor is 1600px.

interface HeaderBoxes {
	pill: { x: number; right: number };
	brand: { x: number; width: number } | null;
	toggles: number[];
	links: { label: string; x: number }[];
	divider: boolean;
	pageWidth: number;
}

function boxes(page: Page): Promise<HeaderBoxes> {
	return page.getByTestId('nav-pill').evaluate((nav) => {
		const box = (el: Element) => el.getBoundingClientRect();
		const brand = nav.querySelector('[data-slot="product-brand"]');
		const divider = nav.querySelector<HTMLElement>('.nav-divider.nav-links-part');
		return {
			pill: { x: box(nav).x, right: box(nav).right },
			brand: brand ? { x: box(brand).x, width: box(brand).width } : null,
			toggles: [nav.querySelector('[role="switch"]')!, nav.querySelector('[data-testid="language-toggle"]')!].map((el) => box(el).x),
			links: [...nav.querySelectorAll<HTMLElement>('.nav-pill-link')]
				.filter((link) => link.checkVisibility({ visibilityProperty: true }))
				.map((link) => ({ label: link.textContent!.trim(), x: box(link).x })),
			divider: divider ? divider.checkVisibility({ visibilityProperty: true }) : false,
			pageWidth: document.documentElement.scrollWidth,
		};
	});
}

/** Loads the page with its scripts held, measures the styled pre-hydration header, hydrates, measures again. */
async function throughHydration(browser: Browser, url: string, width: number, fontSize = 16) {
	const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion: 'no-preference' });
	let release!: () => void;
	const gate = new Promise<void>((resolve) => { release = resolve; });
	await context.route('**/*.js', async (route) => { await gate; await route.continue(); });
	try {
		const page = await context.newPage();
		const cdp = await context.newCDPSession(page);
		await cdp.send('Page.setFontSizes', { fontSizes: { standard: fontSize, fixed: 13 } });
		await page.goto(url, { waitUntil: 'commit' });
		await expect(page.getByTestId('language-toggle')).toBeVisible();
		await page.waitForFunction(() => [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every((link) => link.sheet));
		await page.evaluate(() => document.fonts.ready);
		expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(`${fontSize}px`);
		const before = await boxes(page);
		release();
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.evaluate(() => new Promise<void>((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		}));
		return { before, after: await boxes(page) };
	} finally {
		release();
		await context.unrouteAll({ behavior: 'wait' });
		await context.close();
	}
}

function expectStill({ before, after }: { before: HeaderBoxes; after: HeaderBoxes }, width: number, where: string, fits = true) {
	expect(after.links.map((link) => link.label), `links, ${where}`).toEqual(before.links.map((link) => link.label));
	after.links.forEach((link, i) => {
		expect(Math.abs(link.x - before.links[i].x), `${link.label} moved, ${where}`).toBeLessThanOrEqual(0.1);
	});
	if (before.brand && after.brand) {
		expect(Math.abs(after.brand.x - before.brand.x), `brand moved, ${where}`).toBeLessThanOrEqual(0.1);
		expect(Math.abs(after.brand.width - before.brand.width), `brand width, ${where}`).toBeLessThanOrEqual(0.1);
	}
	after.toggles.forEach((x, i) => {
		expect(Math.abs(x - before.toggles[i]), `toggle ${i} moved, ${where}`).toBeLessThanOrEqual(0.1);
	});
	expect(after.divider, `divider, ${where}`).toBe(after.links.length > 0);
	if (!fits) return;
	expect(after.pill.x, `pill left edge, ${where}`).toBeGreaterThanOrEqual(0);
	expect(after.pill.right, `pill right edge, ${where}`).toBeLessThanOrEqual(width);
	expect(after.pageWidth, `page width, ${where}`).toBeLessThanOrEqual(width);
}

for (const lang of WIDE_LANGS) {
	test(`${lang}: a wide brand keeps the header still through hydration at the default font size`, async ({ browser, baseURL }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers every width');
		// 1100px: wider than the default 1024px tier, narrower than this pill with its links.
		for (const width of [320, 390, 1100, 1206, 1279, 1280]) {
			const result = await throughHydration(browser, `${baseURL}/site-header-wide/${lang}`, width);
			// The fixture's phone pill is wider than Transit's (its phone composition is Transit's own
			// check), so fit is asserted from 1024px; stillness at every width.
			expectStill(result, width, `${lang} at ${width}px`, width >= 1024);
			expect(result.after.links.length, `priority 3 from 1280px, ${lang} at ${width}px`).toBe(width >= 1280 ? 3 : 0);
		}
	});

	test(`${lang}: at a 20px default font size the floor scales to 1600px and the header stays still`, async ({ browser, baseURL }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers every width');
		for (const width of [1279, 1280, 1599, 1600]) {
			const result = await throughHydration(browser, `${baseURL}/site-header-wide/${lang}`, width, 20);
			expectStill(result, width, `${lang} at ${width}px, 20px font`);
			expect(result.after.links.length, `priority 3 from 80em, ${lang} at ${width}px`).toBe(width >= 1600 ? 3 : 0);
		}
	});
}

test('a raised priority 2 never hides priority 3 at its own tier, with and without JavaScript', async ({ browser, baseURL }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run covers every width');
	const expected: Record<number, string[]> = { 1023: [], 1024: ['Reference'], 1279: ['Reference'], 1280: ['Guides', 'Reference'] };
	for (const [width, labels] of Object.entries(expected).map(([w, l]) => [Number(w), l] as const)) {
		const result = await throughHydration(browser, `${baseURL}/site-header-mixed`, width);
		expect(result.before.links.map((link) => link.label), `before hydration at ${width}px`).toEqual(labels);
		expectStill(result, width, `mixed at ${width}px`);
		const context = await browser.newContext({ viewport: { width, height: 800 }, javaScriptEnabled: false });
		try {
			const page = await context.newPage();
			await page.goto(`${baseURL}/site-header-mixed`);
			const noScript = await boxes(page);
			expect(noScript.links.map((link) => link.label), `without JavaScript at ${width}px`).toEqual(labels);
			expect(noScript.divider, `divider without JavaScript at ${width}px`).toBe(labels.length > 0);
		} finally {
			await context.close();
		}
	}
});

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
