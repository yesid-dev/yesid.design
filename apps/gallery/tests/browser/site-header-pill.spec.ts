import { expect, test, type Page } from '@playwright/test';
import { PRODUCT_COPY, PRODUCT_LANGS, type ProductLang } from '../../src/lib/gallery/product-header-fixture.js';

// yesid.dev PR 723: with both toggles in the pill, the priority 2 tier showed Services and Projects
// from a 500px header, so between 500 and about 527 (EN), 517 (FR) or 555 (ES) px the pill
// overflowed before hydration and without JavaScript, then links-fit dropped every link at once.
const BAND = [500, 505, 510, 517, 520, 527, 530, 540, 550, 555, 560];
const WIDER = [599, 600, 640, 768];

interface PillState {
	pill: { left: number; right: number };
	controls: { left: number; right: number; width: number; height: number; visible: boolean }[];
	links: string[];
	pageWidth: number;
}

function pillState(page: Page): Promise<PillState> {
	return page.getByTestId('nav-pill').evaluate((nav) => {
		const box = (el: Element) => el.getBoundingClientRect();
		const theme = nav.querySelector('[role="switch"]')!;
		const language = nav.querySelector('[data-testid="language-toggle"]')!;
		return {
			pill: { left: box(nav).left, right: box(nav).right },
			controls: [theme, language].map((el) => ({
				left: box(el).left,
				right: box(el).right,
				width: box(el).width,
				height: box(el).height,
				visible: el.checkVisibility({ visibilityProperty: true }),
			})),
			links: [...nav.querySelectorAll<HTMLElement>('.nav-pill-link')]
				.filter((link) => link.checkVisibility({ visibilityProperty: true }))
				.map((link) => link.textContent!.trim()),
			pageWidth: document.documentElement.scrollWidth,
		};
	});
}

function expectFits(state: PillState, width: number, lang: ProductLang) {
	const where = `${lang} at ${width}px`;
	expect(state.pill.left, `pill left edge, ${where}`).toBeGreaterThanOrEqual(0);
	expect(state.pill.right, `pill right edge, ${where}`).toBeLessThanOrEqual(width);
	expect(state.pageWidth, `page width, ${where}`).toBeLessThanOrEqual(width);
	for (const control of state.controls) {
		expect(control.visible, `toggle visible, ${where}`).toBe(true);
		expect(control.left, `toggle inside the pill, ${where}`).toBeGreaterThanOrEqual(state.pill.left);
		expect(control.right, `toggle inside the pill, ${where}`).toBeLessThanOrEqual(state.pill.right);
	}
	const labels = PRODUCT_COPY[lang].links;
	const expected = width < 600 ? labels.filter((link) => link.priority === 1) : labels;
	expect(state.links, `links in the pill, ${where}`).toEqual(expected.map((link) => link.label));
}

async function settle(page: Page) {
	await page.evaluate(() => new Promise<void>((resolve) => {
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
	}));
}

for (const lang of PRODUCT_LANGS) {
	test(`${lang}: without JavaScript the pill and both toggles fit from 500 to 768px`, async ({ browser, baseURL }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run resizes through every width');
		const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: BAND[0], height: 800 } });
		try {
			const page = await context.newPage();
			await page.goto(`${baseURL}/site-header-pill/${lang}`);
			await page.evaluate(() => document.fonts.ready);
			for (const width of [...BAND, ...WIDER]) {
				await page.setViewportSize({ width, height: 800 });
				expectFits(await pillState(page), width, lang);
			}
		} finally {
			await context.close();
		}
	});

	test(`${lang}: after hydration the priority 1 link stays beside both toggles from 500 to 768px`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run resizes through every width');
		await page.setViewportSize({ width: BAND[0], height: 800 });
		await page.goto(`/site-header-pill/${lang}`);
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.evaluate(() => document.fonts.ready);
		for (const width of [...BAND, ...WIDER]) {
			await page.setViewportSize({ width, height: 800 });
			await settle(page);
			expectFits(await pillState(page), width, lang);
		}
	});

	test(`${lang}: the toggles keep their place through hydration`, async ({ browser, baseURL }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers the band');
		for (const width of [500, 517, 527, 555, 560]) {
			const context = await browser.newContext({ viewport: { width, height: 800 } });
			let release!: () => void;
			const gate = new Promise<void>((resolve) => { release = resolve; });
			await context.route('**/*.js', async (route) => { await gate; await route.continue(); });
			try {
				const page = await context.newPage();
				await page.goto(`${baseURL}/site-header-pill/${lang}`, { waitUntil: 'commit' });
				await expect(page.getByTestId('language-toggle')).toBeVisible();
				await page.evaluate(() => document.fonts.ready);
				const before = await pillState(page);
				expectFits(before, width, lang);
				release();
				await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
				await settle(page);
				const after = await pillState(page);
				expectFits(after, width, lang);
				after.controls.forEach((control, i) => {
					expect(Math.abs(control.left - before.controls[i].left), `${lang} toggle ${i} moved at ${width}px`).toBeLessThanOrEqual(1.5);
				});
			} finally {
				release();
				await context.unrouteAll({ behavior: 'wait' });
				await context.close();
			}
		}
	});
}

test('links that do not fit leave by priority: priority 2 goes, priority 1 stays', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets the width');
	// Measure at 767px (the phone spacing tier) with a wider wordmark, then narrow the header until
	// the full pill misses by 1px: only priority 2 may leave. The labels stay as written, so the row
	// stays inside the 300px limit the menu's collapse transition sets on it.
	await page.setViewportSize({ width: 767, height: 800 });
	await page.goto('/site-header-pill/es');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
	const nav = page.getByTestId('nav-pill');
	await nav.locator('[data-slot="wordmark-letters"]').evaluate((letters) => { letters.textContent = 'yesid design studio'; });
	await settle(page);
	const full = await nav.evaluate((pill) => ({
		pill: pill.getBoundingClientRect().width,
		row: pill.querySelector('.nav-links')!.scrollWidth,
	}));
	expect((await pillState(page)).links).toEqual(['Servicios', 'Proyectos', 'Contacto']);
	const width = Math.ceil(full.pill) + 8 - 1;
	expect(width, 'the full row needs a header of at least 600px').toBeGreaterThanOrEqual(600);
	expect(full.row, 'the row stays inside its 300px collapse limit').toBeLessThan(300);

	// A link's `visibility` follows its colour transition, so wait for it to settle.
	await page.setViewportSize({ width, height: 800 });
	await expect.poll(async () => (await pillState(page)).links).toEqual(['Contacto']);
	let state = await pillState(page);
	expect(state.pill.left).toBeGreaterThanOrEqual(0);
	expect(state.pill.right).toBeLessThanOrEqual(width);
	for (const control of state.controls) expect(control.visible).toBe(true);

	await page.setViewportSize({ width: width + 1, height: 800 });
	await expect.poll(async () => (await pillState(page)).links).toEqual(['Servicios', 'Proyectos', 'Contacto']);
	state = await pillState(page);
	expect(state.pill.right).toBeLessThanOrEqual(width + 1);
});

test.describe('with normal motion', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	test('closing the menu keeps priority 2 out when it still does not fit', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run sets the width');
		// The links row collapses to max-width 0 while the menu is open and grows back after it closes.
		await page.setViewportSize({ width: 767, height: 800 });
		await page.goto('/site-header-pill/es');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.evaluate(() => document.fonts.ready);
		const nav = page.getByTestId('nav-pill');
		await nav.locator('[data-slot="wordmark-letters"]').evaluate((letters) => { letters.textContent = 'yesid design studio'; });
		await settle(page);
		const width = Math.ceil(await nav.evaluate((pill) => pill.getBoundingClientRect().width)) + 8 - 1;
		expect(width).toBeGreaterThanOrEqual(600);
		await page.setViewportSize({ width, height: 800 });
		await expect.poll(async () => (await pillState(page)).links).toEqual(['Contacto']);

		for (let round = 0; round < 2; round++) {
			await nav.getByRole('button', { name: 'Abrir el menú' }).click();
			await expect(page.getByRole('dialog', { name: 'Menú del sitio' })).toBeVisible();
			await page.keyboard.press('Escape');
			await expect(page.getByRole('dialog', { name: 'Menú del sitio' })).toBeHidden();
			// Wait until every transition in the pill has finished, then for the links to settle.
			await expect.poll(() => nav.evaluate((pill) => pill.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length), { timeout: 5_000 }).toBe(0);
			await expect.poll(async () => (await pillState(page)).links).toEqual(['Contacto']);
			const state = await pillState(page);
			expect(state.pill.left, `round ${round}`).toBeGreaterThanOrEqual(0);
			expect(state.pill.right, `round ${round}`).toBeLessThanOrEqual(width);
		}
	});
});
