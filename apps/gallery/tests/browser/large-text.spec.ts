import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

import { optionsSegment } from '../../src/routes/error-page/options.js';

// Phone widths at 200% text (WCAG 1.4.4). Each case sets its own viewport, so one project runs it.
test.beforeEach(({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets every width and text size');
});

async function open(page: Page, path: string, width: number, text: '100%' | '200%'): Promise<void> {
	await page.setViewportSize({ width, height: 900 });
	await page.goto(path);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
	await page.locator('html').evaluate((node, size) => { node.style.fontSize = size; }, text);
}

/** Products render the error page and reading frame at the page edge; the Gallery adds its own 1.5rem. */
async function atPageEdge(page: Page): Promise<void> {
	await page.addStyleTag({ content: 'main { padding-inline: 0 !important; }' });
}

/** Words the browser split across lines: a whole word is one text range on one line. */
function splitWords(locator: Locator): Promise<string[]> {
	return locator.evaluateAll((elements) => elements.flatMap((element) => {
		const split: string[] = [];
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			for (const word of node.textContent!.matchAll(/\S+/g)) {
				const range = document.createRange();
				range.setStart(node, word.index);
				range.setEnd(node, word.index + word[0].length);
				if ([...range.getClientRects()].filter((rect) => rect.width > 0).length > 1) split.push(word[0]);
			}
		}
		return split;
	}));
}

const fontSize = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).fontSize);

test.describe('ErrorPage heading', () => {
	const path = `/error-page/${optionsSegment({ construction: true })}`;

	test('keeps "construction" whole at 390px and 200% text', async ({ page }) => {
		await open(page, path, 390, '200%');
		await atPageEdge(page);
		const heading = page.getByRole('heading', { level: 1, name: 'This station is under construction' });
		await expect(heading).toHaveCSS('font-size', '40px');
		expect(await splitWords(heading)).toEqual([]);
		await expectNoHorizontalOverflow(page);
	});

	test('keeps its size at the default text size from 320px', async ({ page }) => {
		for (const [width, size] of [[320, '24px'], [390, '24px'], [768, '36px']] as const) {
			await open(page, path, width, '100%');
			await expect(page.getByRole('heading', { level: 1 }), `${width}px`).toHaveCSS('font-size', size);
		}
	});
});

test.describe('ReadingFrame headings', () => {
	test('keep French words whole at 390px and 200% text', async ({ page }) => {
		await open(page, '/reading-frame/fr', 390, '200%');
		await atPageEdge(page);
		const title = page.getByRole('heading', { level: 1, name: 'Politique de confidentialité' });
		const sections = page.locator('[data-slot="reading-frame-body"] h2');
		await expect(title).toHaveCSS('font-size', '40px');
		await expect(sections.first()).toHaveCSS('font-size', '36px');
		expect(await splitWords(title)).toEqual([]);
		expect(await splitWords(sections)).toEqual([]);
		await expectNoHorizontalOverflow(page);
	});

	test('keep their sizes at the default text size from 320px', async ({ page }) => {
		for (const width of [320, 390]) {
			await open(page, '/reading-frame/fr', width, '100%');
			await expect(page.getByRole('heading', { level: 1 }), `${width}px`).toHaveCSS('font-size', '28px');
			expect(new Set(await page.locator('[data-slot="reading-frame-body"] h2').evaluateAll((nodes) =>
				nodes.map((node) => getComputedStyle(node).fontSize))), `${width}px`).toEqual(new Set(['20px']));
		}
	});
});

test.describe('CollapsibleSection article-summary header', () => {
	const fixtures = ['en', 'fr', 'es'].map((lang) => `[data-fixture="section-article-summary-${lang}"]`);

	async function header(card: Locator) {
		return card.evaluate((root) => {
			const box = (selector: string) => root.querySelector(selector)!.getBoundingClientRect();
			const card = root.querySelector<HTMLElement>('[data-slot="card"]')!;
			return {
				mark: box('.section-header__mark'),
				title: box('.section-title--article-summary'),
				subtitle: box('.section-subtitle__text'),
				inset: getComputedStyle(root.querySelector('.section-header')!).paddingLeft,
				overflow: card.scrollWidth - card.clientWidth,
			};
		});
	}

	test('stacks the mark above a full-width title at 390px and 200% text', async ({ page }) => {
		await open(page, '/reading-surfaces', 390, '200%');
		for (const selector of fixtures) {
			const card = page.locator(selector);
			const { mark, title, subtitle, inset, overflow } = await header(card);
			expect(mark.bottom, `${selector}: mark above the title`).toBeLessThanOrEqual(title.top);
			expect(title.width, `${selector}: title column`).toBeGreaterThanOrEqual(170);
			expect(subtitle.width, `${selector}: subtitle column`).toBeGreaterThanOrEqual(170);
			expect(subtitle.left, `${selector}: subtitle aligns with the title`).toBeCloseTo(title.left, 0);
			expect(inset, selector).toBe('16px');
			expect(overflow, `${selector}: no sideways scroll`).toBeLessThanOrEqual(0);
			expect(await splitWords(card.locator('.section-title--article-summary, .section-subtitle__text')), selector).toEqual([]);
		}
		await expectNoHorizontalOverflow(page);
	});

	test('keeps the mark beside the title at the default text size from 320px', async ({ page }) => {
		for (const width of [320, 390]) {
			await open(page, '/reading-surfaces', width, '100%');
			for (const selector of fixtures) {
				const { mark, title, subtitle, inset } = await header(page.locator(selector));
				const where = `${selector} at ${width}px`;
				expect(mark.right, `${where}: mark beside the title`).toBeLessThanOrEqual(title.left);
				expect(mark.top, `${where}: mark on the title's row`).toBeLessThan(title.bottom);
				expect(subtitle.left, `${where}: subtitle under the title`).toBeCloseTo(title.left, 0);
				expect(inset, where).toBe('16px');
			}
		}
	});
});

test.describe('SiteHeader with a product brand', () => {
	for (const path of ['/site-header?brand=product', '/app-frame/record-parts/en']) {
		test(`${path} is two rows at 390px and 200% text: the brand, then every control`, async ({ page }) => {
			await open(page, path, 390, '200%');
			const rows = await page.getByTestId('nav-pill').evaluate((pill) => {
				const box = (element: Element) => element.getBoundingClientRect();
				const brand = box(pill.querySelector('[data-slot="product-brand"]')!);
				const controls = [...pill.querySelectorAll<HTMLElement>('.nav-trailing :is(button, a, [role="switch"])')]
					.filter((control) => control.checkVisibility({ visibilityProperty: true }))
					.map(box);
				return {
					pill: box(pill),
					brand,
					count: controls.length,
					top: Math.min(...controls.map((control) => control.top)),
					lowestTop: Math.max(...controls.map((control) => control.top)),
					highestBottom: Math.min(...controls.map((control) => control.bottom)),
				};
			});
			expect(rows.count).toBeGreaterThanOrEqual(3);
			expect(rows.top, 'controls start below the brand').toBeGreaterThanOrEqual(rows.brand.bottom);
			expect(rows.lowestTop, 'every control on the second row').toBeLessThan(rows.highestBottom);
			expect(rows.pill.left).toBeGreaterThanOrEqual(0);
			expect(rows.pill.right).toBeLessThanOrEqual(390);
		});
	}
});
