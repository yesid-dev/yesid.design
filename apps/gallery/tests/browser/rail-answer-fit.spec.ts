import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

test.describe('Rail pill reflow', { tag: '@theme' }, () => {
	test('keeps the pill label as text grows', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/rail-answer-fit');
		await page.locator('html[data-gallery-ready]').waitFor();
		await page.evaluate(() => document.fonts.ready);

		const pill = page.getByRole('button', { name: 'Controls 7 days selected · Open controls' });
		const label = pill.locator('.surface-rail-pill-label');
		const summary = pill.getByText('7 days selected', { exact: true });
		for (const [width, textSize] of [[390, 100], [390, 200], [320, 200], [390, 100]]) {
			await page.setViewportSize({ width, height: 900 });
			await page.locator('html').evaluate((html, scale) => { html.style.fontSize = `${scale}%`; }, textSize);
			const name = `${width}px at ${textSize}% text`;

			await expect(pill).toBeVisible();
			const labelClips = await label.evaluate((el) => el.scrollWidth > el.clientWidth);
			expect(labelClips, name).toBe(false);
			if (width === 320) {
				await expect(summary, name).toBeHidden();
			} else {
				await expect(summary, name).toBeVisible();
				const summaryClips = await summary.evaluate((el) => el.scrollWidth > el.clientWidth);
				expect(summaryClips, name).toBe(textSize === 200);
			}

			await expectNoHorizontalOverflow(page);
		}
	});
});

const spacing = {
	default: '',
	inherited: 'html { letter-spacing: 0.12em; }',
	'WCAG text spacing': '* { letter-spacing: 0.12em !important; word-spacing: 0.16em !important; line-height: 1.5 !important; }',
};

async function geometry(page: Page, css: string) {
	const style = css ? await page.addStyleTag({ content: css }) : undefined;
	try {
		await page.evaluate(() => document.fonts.ready);
		return await page.locator('.answer-value .metric-value').evaluateAll((elements) => ({
			height: document.documentElement.scrollHeight,
			figures: elements.map((element) => {
				const range = document.createRange();
				range.selectNodeContents(element);
				const figure = range.getBoundingClientRect();
				const column = element.closest('.answer-value')!.getBoundingClientRect();
				const style = getComputedStyle(element);
				return {
					width: figure.width,
					available: column.width,
					lines: range.getClientRects().length,
					effectiveFontSize: Number.parseFloat(style.fontSize) * Number(style.zoom),
				};
			}),
		}));
	} finally {
		await style?.evaluate((element) => { element.parentNode?.removeChild(element); });
	}
}

for (const [width, textSize] of [[390, 100], [320, 100], [390, 200], [320, 200]]) {
	test(`figures fit before and after hydration at ${width}px and ${textSize}% text`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width, height: 900 });
		const scripts = Promise.withResolvers<void>();
		await page.route('**/_app/**/*.js', async (request) => {
			await scripts.promise;
			await request.continue();
		});
		const before = new Map<string, Awaited<ReturnType<typeof geometry>>>();
		try {
			await page.goto('/rail-answer-fit', { waitUntil: 'domcontentloaded' });
			await page.addStyleTag({ content: `html { font-size: ${textSize}%; }` });
			await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);
			for (const [name, css] of Object.entries(spacing)) {
				const rendered = await geometry(page, css);
				expect(rendered.figures, name).toHaveLength(12);
				for (const [index, { width, available, lines }] of rendered.figures.entries()) {
					expect(lines, `${name}, figure ${index + 1}`).toBe(1);
					expect(width, `${name}, figure ${index + 1}`).toBeLessThanOrEqual(available + 0.5);
				}
				before.set(name, rendered);
			}
			await expectNoHorizontalOverflow(page);
		} finally {
			scripts.resolve();
		}
		await page.locator('html[data-gallery-ready]').waitFor();
		for (const [name, css] of Object.entries(spacing)) {
			const hydrated = await geometry(page, css);
			expect(hydrated, name).toEqual(before.get(name));
		}
		const normalSpacing = before.get('default')!;
		if (textSize === 100) {
			expect(normalSpacing.figures[0].effectiveFontSize).toBe(20);
			expect(normalSpacing.figures[3].effectiveFontSize).toBe(40);
		} else if (width === 390) {
			expect(normalSpacing.figures[0].effectiveFontSize).toBe(40);
		}
		await testInfo.attach('Figure geometry before and after hydration', {
			body: JSON.stringify(Object.fromEntries(before), null, 2),
			contentType: 'application/json',
		});
		await expectNoHorizontalOverflow(page);
	});
}
