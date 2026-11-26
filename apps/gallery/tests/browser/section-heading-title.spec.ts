import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

// SectionHeading size="title" on /reading-surfaces. Each @theme test runs once per theme.
const TITLES = ['title-dot', 'title-undotted', 'title-sub', 'title-flush', 'title-flush-sub', 'title-long-word'] as const;
// Each wrapper sets --section-heading-title-size to one of the README's example values.
const SIZED = [
	['title-size-compact', 'clamp(1.25rem, 8vi, var(--text-title))'],
	['title-size-heading', 'var(--text-heading)'],
] as const;

async function open(page: Page, width: number, route = '/reading-surfaces'): Promise<void> {
	await page.setViewportSize({ width, height: 900 });
	await page.goto(route);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

async function largeText(page: Page): Promise<void> {
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	await page.evaluate(() => document.fonts.ready);
}

/** The pixel font size a CSS value resolves to inside the element, at the current width and root size. */
async function cssSize(locator: Locator, value: string): Promise<string> {
	return locator.evaluate((element, fontSize) => {
		const probe = document.createElement('span');
		probe.style.fontSize = fontSize;
		element.append(probe);
		const size = getComputedStyle(probe).fontSize;
		probe.remove();
		return size;
	}, value);
}

/** The pixel font size a token resolves to at the current width and root size. */
async function tokenSize(locator: Locator, name: string): Promise<string> {
	return cssSize(locator, `var(${name})`);
}

async function type(locator: Locator) {
	return locator.evaluate((element) => {
		const style = getComputedStyle(element);
		return {
			family: style.fontFamily,
			size: style.fontSize,
			weight: style.fontWeight,
			spacing: style.letterSpacing,
			transform: style.textTransform,
			color: style.color,
		};
	});
}

async function expectTitleType(page: Page): Promise<void> {
	for (const fixture of TITLES) {
		const root = page.locator(`[data-fixture="${fixture}"] [data-slot="section-heading"]`);
		await expect(root).toHaveAttribute('data-size', 'title');
		const heading = await type(root.getByRole('heading', { level: 3 }));
		expect(heading.size, fixture).toBe(await tokenSize(root, '--text-title'));
		expect(heading.weight, fixture).toBe('700');
		expect(heading.spacing, fixture).toBe('normal');
		expect(await root.evaluate((element) => element.scrollWidth <= element.clientWidth), `${fixture} is not clipped`).toBe(true);
	}
}

/** The dot is drawn on the heading's last line box, right after the last word, on its baseline. */
async function expectDotOnLastLine(page: Page): Promise<number> {
	const dot = page.locator('[data-fixture="title-dot"] [data-slot="section-heading-dot"]');
	await expect(dot).toBeVisible();
	const geometry = await page.locator('[data-fixture="title-dot"] .section-heading-title').evaluate((title) => {
		const rect = ({ top, bottom, left, right, width, height }: DOMRect) => ({ top, bottom, left, right, width, height });
		// The glyph line pieces of every text node. Element boxes are left out: the title's last word is an
		// inline block, whose box spans the full line height rather than the glyphs.
		const boxes: DOMRect[] = [];
		const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			const text = document.createRange();
			text.selectNodeContents(node);
			boxes.push(...[...text.getClientRects()].filter((box) => box.width > 0));
		}
		const word = document.createRange();
		word.selectNodeContents(title.querySelector('.section-heading-tail')!.firstChild!);
		return {
			lines: new Set(boxes.map((box) => Math.round(box.top))).size,
			lastBottom: Math.max(...boxes.map((box) => box.bottom)),
			dot: rect(title.querySelector('[data-slot="section-heading-dot"]')!.getBoundingClientRect()),
			word: rect(word.getBoundingClientRect()),
			heading: rect(title.closest('h3')!.getBoundingClientRect()),
		};
	});
	const { dot: box, word, heading, lastBottom } = geometry;
	expect(box.width).toBeGreaterThan(0);
	expect(box.height).toBeGreaterThan(0);
	expect(Math.abs(box.bottom - lastBottom), 'the dot is on the last line box').toBeLessThanOrEqual(1);
	expect(Math.abs(box.top - word.top), 'the dot shares the last word line').toBeLessThanOrEqual(0.5);
	expect(Math.abs(box.bottom - word.bottom), 'the dot shares the last word baseline box').toBeLessThanOrEqual(0.5);
	expect(box.left).toBeGreaterThanOrEqual(word.right - 1);
	expect(box.right).toBeLessThanOrEqual(heading.right + 0.5);
	await expect(dot).toHaveCSS('font-size', await tokenSize(dot, '--text-title'));
	return geometry.lines;
}

/** Space between the heading and the element after it, beyond that element's own top margin. */
async function spaceAfter(page: Page, fixture: string): Promise<{ root: number; last: number }> {
	return page.locator(`[data-fixture="${fixture}"] [data-slot="section-heading"]`).evaluate((root) => {
		const next = root.nextElementSibling!;
		const top = next.getBoundingClientRect().top - parseFloat(getComputedStyle(next).marginTop);
		return {
			root: top - root.getBoundingClientRect().bottom,
			last: top - root.lastElementChild!.getBoundingClientRect().bottom,
		};
	});
}

/** The line pieces of the title's last word and where the dot sits against them. */
async function lastWord(page: Page, fixture: string) {
	return page.locator(`[data-fixture="${fixture}"] .section-heading-title`).evaluate((title) => {
		const range = document.createRange();
		range.selectNodeContents(title.querySelector('.section-heading-tail')!.firstChild!);
		const pieces = [...range.getClientRects()].filter((box) => box.width > 0);
		const end = pieces.reduce((last, box) => (box.top > last.top ? box : last));
		const dot = title.querySelector('[data-slot="section-heading-dot"]')!.getBoundingClientRect();
		const heading = title.closest('h3')!;
		return {
			lines: new Set(pieces.map((box) => Math.round(box.top))).size,
			right: Math.max(...pieces.map((box) => box.right)),
			end: { top: end.top, bottom: end.bottom, right: end.right },
			dot: { top: dot.top, bottom: dot.bottom, left: dot.left, right: dot.right },
			headingRight: heading.getBoundingClientRect().right,
			overflow: heading.scrollWidth - heading.clientWidth,
		};
	});
}

test.describe('SectionHeading title size', { tag: '@theme' }, () => {
	for (const width of [1440, 390]) {
		test(`uses the title type, a reading subheading and the dot at ${width} px`, async ({ page }) => {
			await open(page, width);
			await expectTitleType(page);

			const sub = await type(page.locator('[data-fixture="title-sub"] [data-slot="section-heading-sub"]'));
			const reading = await type(page.locator('[data-fixture="label-reading"] .label-reading'));
			expect(sub.transform).toBe('none');
			expect(sub.family).toMatch(/Inter/);
			expect(sub.family).not.toMatch(/JetBrains/);
			expect(sub).toEqual(reading);

			await expect(page.locator('[data-fixture="title-undotted"] [data-slot="section-heading-dot"]')).toHaveCount(0);
			await expectDotOnLastLine(page);
		});
	}

	test('fits 390 px at 200% text with the dot on the last line', async ({ page }) => {
		await open(page, 390);
		await largeText(page);
		await expectNoHorizontalOverflow(page);
		await expectTitleType(page);
		expect(await expectDotOnLastLine(page), 'the long title wraps').toBeGreaterThan(1);
	});

	test('flush leaves no space after the heading or its subheading', async ({ page }) => {
		await open(page, 390);
		for (const fixture of ['title-flush', 'title-flush-sub']) {
			await expect(page.locator(`[data-fixture="${fixture}"] [data-slot="section-heading"]`)).toHaveAttribute('data-flush', '');
			const space = await spaceAfter(page, fixture);
			expect(Math.abs(space.root), `${fixture}: after the heading box`).toBeLessThanOrEqual(0.5);
			expect(Math.abs(space.last), `${fixture}: after the heading's last line`).toBeLessThanOrEqual(0.5);
		}
		const flushSub = page.locator('[data-fixture="title-flush-sub"]');
		await expect(flushSub.getByRole('heading', { level: 3 })).toHaveCSS('margin-bottom', '0px');
		await expect(flushSub.locator('[data-slot="section-heading-sub"]')).toHaveCSS('margin-bottom', '0px');

		const kept = page.locator('[data-fixture="title-sub"]');
		await expect(kept.locator('[data-slot="section-heading"]')).not.toHaveAttribute('data-flush');
		await expect(kept.getByRole('heading', { level: 3 })).toHaveCSS('margin-bottom', '6px');
		await expect(kept.locator('[data-slot="section-heading-sub"]')).toHaveCSS('margin-bottom', '36px');
	});

	test('a wrapper sets the title size through --section-heading-title-size', async ({ page }) => {
		await open(page, 390);
		await largeText(page);
		for (const [fixture, value] of SIZED) {
			const root = page.locator(`[data-fixture="${fixture}"] [data-slot="section-heading"]`);
			const size = await cssSize(root, value);
			expect(size, `${fixture}: the example differs from the default here`).not.toBe(await tokenSize(root, '--text-title'));
			await expect(root.getByRole('heading', { level: 3 }), fixture).toHaveCSS('font-size', size);
			await expect(root.locator('[data-slot="section-heading-dot"]'), fixture).toHaveCSS('font-size', size);
		}
		await expectTitleType(page);
	});

	test('a long last word wraps at 390 px and 200% text with the dot on its last line', async ({ page }) => {
		await open(page, 390);
		await largeText(page);
		await expectNoHorizontalOverflow(page);
		const word = await lastWord(page, 'title-long-word');
		expect(word.overflow, 'the heading does not overflow').toBeLessThanOrEqual(0);
		expect(word.lines, 'the last word breaks across lines').toBeGreaterThan(1);
		expect(word.right, 'every piece of the word stays inside the heading').toBeLessThanOrEqual(word.headingRight + 0.5);
		expect(Math.abs(word.dot.top - word.end.top), "the dot shares the word's last line").toBeLessThanOrEqual(0.5);
		expect(Math.abs(word.dot.bottom - word.end.bottom), "the dot shares the word's last line box").toBeLessThanOrEqual(0.5);
		expect(word.dot.left, 'the dot follows the end of the word').toBeGreaterThanOrEqual(word.end.right - 1);
		expect(word.dot.right).toBeLessThanOrEqual(word.headingRight + 0.5);
		expect((await lastWord(page, 'title-dot')).lines, 'a last word that fits a line stays whole').toBe(1);

		await open(page, 1440);
		expect((await lastWord(page, 'title-long-word')).lines, 'the long word stays whole where it fits').toBe(1);
	});

	test('display headings are unchanged', async ({ page }) => {
		await open(page, 1440, '/');
		const root = page.locator('[data-gallery-family="brand:SectionHeading"] [data-slot="section-heading"]');
		await expect(root).not.toHaveAttribute('data-size');
		await expect(root).not.toHaveAttribute('data-flush');
		const heading = root.getByRole('heading', { level: 3 });
		const display = await tokenSize(root, '--text-display');
		await expect(heading).toHaveCSS('font-size', display);
		await expect(heading).toHaveCSS('margin-bottom', '6px');
		await expect(root.locator('[data-slot="section-heading-sub"]')).toHaveCSS('margin-bottom', '36px');
		const tail = root.locator('.section-heading-tail');
		await expect(tail).toHaveCSS('display', 'inline');
		await expect(tail).toHaveCSS('white-space', 'nowrap');
		// The display heading sets neither wrapping property; both stay what the page gives it.
		const inherited = await root.evaluate((element) => {
			const style = getComputedStyle(element);
			return { overflowWrap: style.overflowWrap, wordBreak: style.wordBreak };
		});
		await expect(heading).toHaveCSS('overflow-wrap', inherited.overflowWrap);
		await expect(tail).toHaveCSS('word-break', inherited.wordBreak);
		await root.evaluate((element) => element.style.setProperty('--section-heading-title-size', '10px'));
		await expect(heading, 'the title size property does not reach a display heading').toHaveCSS('font-size', display);
	});
});
