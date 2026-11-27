import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

test.describe('Rail pill reflow', { tag: '@theme' }, () => {
	test.use({ viewport: { width: 390, height: 900 } });

	test('keeps the pill label as text grows', async ({ page }) => {
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

async function openBeforeHydration(page: Page) {
	const startImport = /import\(["'][^"']*\/entry\/start\.[^"']+\.js["']\)/;
	await page.route('**/rail-answer-fit', async (route) => {
		const response = await route.fetch();
		const html = await response.text();
		expect(html).toMatch(startImport);
		// Let fonts load without leaving intercepted module requests pending in WebKit.
		const gate = 'new Promise(resolve => addEventListener("gallery-test-hydrate", resolve, { once: true }))';
		const body = html
			.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, '')
			.replace(startImport, `${gate}.then(() => $&)`);
		await route.fulfill({ response, body });
	}, { times: 1 });
	await page.goto('/rail-answer-fit', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);
}

async function geometry(page: Page, css: string) {
	const style = css ? await page.addStyleTag({ content: css }) : undefined;
	try {
		await page.evaluate(async () => { await document.fonts.ready; });
		return await page.locator('.answer-value .metric-value').evaluateAll((elements) => ({
			height: document.documentElement.scrollHeight,
			width: document.documentElement.scrollWidth,
			figures: elements.map((element) => {
				const range = document.createRange();
				range.selectNodeContents(element);
				const figure = range.getBoundingClientRect();
				const column = element.closest('.answer-value')!.getBoundingClientRect();
				const style = getComputedStyle(element);
				return {
					width: figure.width,
					available: column.width,
					lines: new Set(Array.from(range.getClientRects(), ({ top, bottom }) => `${top}:${bottom}`)).size,
					effectiveFontSize: Number.parseFloat(style.fontSize) * Number(style.zoom),
				};
			}),
		}));
	} finally {
		await style?.evaluate((element) => { element.parentNode?.removeChild(element); });
	}
}

for (const [width, textSize] of [[390, 100], [320, 100], [390, 200], [320, 200]]) {
	test.describe(() => {
		test.use({ viewport: { width, height: 900 } });

		test(`figures fit before and after hydration at ${width}px and ${textSize}% text`, async ({ page }, testInfo) => {
			await openBeforeHydration(page);
			await page.locator('html').evaluate((html, scale) => { html.style.fontSize = `${scale}%`; }, textSize);
			const before = new Map<string, Awaited<ReturnType<typeof geometry>>>();
			for (const [name, css] of Object.entries(spacing)) {
				const rendered = await geometry(page, css);
				expect(rendered.width, name).toBe(width);
				expect(rendered.figures, name).toHaveLength(12);
				for (const [index, { width, available, lines }] of rendered.figures.entries()) {
					expect(lines, `${name}, figure ${index + 1}`).toBe(1);
					expect(width, `${name}, figure ${index + 1}`).toBeLessThanOrEqual(available + 0.5);
				}
				before.set(name, rendered);
			}
			await page.evaluate(() => window.dispatchEvent(new Event('gallery-test-hydrate')));
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
	});
}

test.describe(() => {
	test.use({ viewport: { width: 390, height: 900 } });

	test('uses the original wrapping when CSS property registration is unavailable', async ({ page }) => {
		await page.goto('/rail-answer-fit');
		await page.locator('html').evaluate((html) => { html.style.fontSize = '200%'; });
		const removed = await page.evaluate(() => {
			let removed = 0;
			function strip(container: CSSStyleSheet | CSSGroupingRule) {
				for (let index = container.cssRules.length - 1; index >= 0; index--) {
					const rule = container.cssRules[index];
					if (rule instanceof CSSPropertyRule && rule.name.startsWith('--yesid-answer-')) {
						container.deleteRule(index);
						removed++;
					} else if (rule instanceof CSSGroupingRule) {
						strip(rule);
					}
				}
			}
			for (const sheet of document.styleSheets) strip(sheet);
			return removed;
		});
		expect(removed).toBeGreaterThan(0);
		for (const box of await page.locator('.answer-value, .answer-fit').all()) {
			await expect(box).toHaveCSS('overflow-x', 'visible');
			await expect(box).toHaveCSS('white-space', 'normal');
		}
		const fallback = await geometry(page, '');
		expect(fallback.figures[3].effectiveFontSize).toBe(80);
		expect(fallback.figures[3].lines).toBeGreaterThan(1);
		expect(fallback.figures[9].effectiveFontSize).toBe(80);
		expect(fallback.figures[9].lines).toBeGreaterThan(1);
		const axe = await new AxeBuilder({ page }).include('#answers').withRules(['scrollable-region-focusable']).analyze();
		expect(axe.violations).toEqual([]);
		await expectNoHorizontalOverflow(page);
	});
});
