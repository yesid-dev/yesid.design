import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

// SectionHeading size="title" on /reading-surfaces. Each @theme test runs once per theme.
const TITLES = ['title-dot', 'title-undotted', 'title-sub'] as const;

async function open(page: Page, width: number): Promise<void> {
	await page.setViewportSize({ width, height: 900 });
	await page.goto('/reading-surfaces');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

/** The pixel font size a token resolves to at the current width and root size. */
async function tokenSize(locator: Locator, name: string): Promise<string> {
	return locator.evaluate((element, variable) => {
		const probe = document.createElement('span');
		probe.style.fontSize = `var(${variable})`;
		element.append(probe);
		const size = getComputedStyle(probe).fontSize;
		probe.remove();
		return size;
	}, name);
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
		const text = document.createRange();
		text.selectNodeContents(title);
		const boxes = [...text.getClientRects()].filter((box) => box.width > 0);
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
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await page.evaluate(() => document.fonts.ready);
		await expectNoHorizontalOverflow(page);
		await expectTitleType(page);
		expect(await expectDotOnLastLine(page), 'the long title wraps').toBeGreaterThan(1);
	});
});
