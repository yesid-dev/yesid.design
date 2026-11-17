import { expect, test, type Browser } from '@playwright/test';
import { column, isInk, strokes } from './pixels.js';

// D22 regressions for PageSections, read from painted pixels at device scale 1 and 2:
// - a full-bleed positioned child cannot paint over the boundary;
// - a Masthead that is a whole section gives one stroke, not two;
// - the wrapped final section draws nothing before the footer.
const THEMES = ['dark', 'light'] as const;

async function open(browser: Browser, baseURL: string, theme: string, deviceScaleFactor: number) {
	const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, deviceScaleFactor, reducedMotion: 'reduce' });
	await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
	const page = await context.newPage();
	await page.goto('/page-sections');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
	return { context, page };
}

for (const theme of THEMES) {
	for (const scale of [1, 2]) {
		test(`${theme} at ${scale}x: drawn ink sits on touching section backgrounds`, async ({ browser, baseURL }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run per theme and scale');
			const { context, page } = await open(browser, baseURL!, theme, scale);
			try {
				await page.goto('/page-sections?divider=hand-drawn');
				await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
				const boundary = page.locator('[data-slot="page-section-boundary"]').first();
				await expect(boundary).toHaveAttribute('data-variant', 'hand-drawn');
				const edge = await boundary.evaluate(node => {
					const before = node.previousElementSibling!.getBoundingClientRect();
					const after = node.nextElementSibling!.getBoundingClientRect();
					return { y: before.bottom, gap: after.top - before.bottom };
				});
				expect(Math.abs(edge.gap), 'no blank strip between the painted sections').toBeLessThanOrEqual(0.5);
				const width = page.viewportSize()!.width;
				const at = (fraction: number) => column(page, width * fraction, edge.y - 4, edge.y + 4);
				const strength = (pixels: [number, number, number][]) =>
					pixels.reduce((sum, [red, , blue]) => sum + Math.max(0, red - blue), 0);
				const pixels = await at(0.11);
				expect(pixels.some(isInk), 'orange ink remains visible above the opaque child at the seam').toBe(true);
				expect(strokes(pixels), 'one drawn stroke at the actual edge').toBe(1);
				for (const tip of [0.018, 0.237]) {
					expect(strength(await at(tip)), 'the pen stroke is lighter at each end').toBeLessThan(strength(pixels));
				}
				const quiet = await at(0.26);
				expect(quiet.some(isInk), 'the pen lifts between painted segments').toBe(false);
				for (const tip of [0.035, 0.965]) {
					const end = await at(tip);
					expect(end.some(isInk), 'the ink reaches both edges of the page').toBe(true);
				}
			} finally { await context.close(); }
		});

		test(`${theme} at ${scale}x: painted sections, Masthead sections and the wrapped last section`, async ({ browser, baseURL }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run per theme and scale');
			const { context, page } = await open(browser, baseURL!, theme, scale);
			try {
				const sections = page.getByTestId('fixture-sections');
				const boundaries = sections.locator('[data-slot="page-section-boundary"]');
				await expect(boundaries).toHaveCount(2);
				// Masthead tapes inside page sections are edge rules the section hides.
				await expect(sections.locator('[data-edge-rule]')).toHaveCount(2);
				for (const rule of await sections.locator('[data-edge-rule]').all()) await expect(rule).toBeHidden();

				const box = async (selector: string) => (await page.locator(selector).boundingBox())!;
				const scrollTo = async (y: number) => {
					await page.evaluate((top) => window.scrollTo(0, top), Math.max(0, y - 200));
					return page.evaluate(() => window.scrollY);
				};

				// 1. The painted child ends where the boundary row begins: the stroke is the ink, not white.
				await scrollTo(0);
				const paint = await box('[data-testid="painted-child"]');
				const first = (await boundaries.nth(0).boundingBox())!;
				expect(first.y, 'the boundary is its own row below the painted child').toBeGreaterThanOrEqual(paint.y + paint.height - 0.5);
				const hairline = await column(page, 40, first.y + 4, first.y + 5);
				expect(hairline.length).toBe(scale);
				for (const pixel of hairline) expect(isInk(pixel), `stroke pixel ${pixel} at ${scale}x`).toBe(true);
				const white = await column(page, 40, paint.y + paint.height - 2, paint.y + paint.height - 1);
				expect(white[0], 'the child still paints its own white').toEqual([255, 255, 255]);

				// 2. A Masthead that is a whole section: exactly one stroke between it and the next section.
				const second = (await boundaries.nth(1).boundingBox())!;
				await scrollTo(second.y);
				const mastheadHeading = (await page.locator('#masthead h2').boundingBox())!;
				const finalHeading = (await page.locator('#final h2').boundingBox())!;
				const x = mastheadHeading.x + 10;
				const between = await column(page, x, mastheadHeading.y + mastheadHeading.height + 2, finalHeading.y - 2);
				expect(strokes(between), `one stroke between the Masthead section and the next at ${scale}x`).toBe(1);

				// 3. The wrapped final section: nothing drawn between its heading and the footer.
				const footer = (await page.getByRole('contentinfo').boundingBox())!;
				await scrollTo(footer.y);
				const finalNow = (await page.locator('#final h2').boundingBox())!;
				const footerNow = (await page.getByRole('contentinfo').boundingBox())!;
				const beforeFooter = await column(page, finalNow.x + 10, finalNow.y + finalNow.height + 2, footerNow.y - 1);
				expect(strokes(beforeFooter), `no stroke before the footer at ${scale}x`).toBe(0);
				// The footer's own street edge starts at its top edge.
				const edge = await column(page, 10, footerNow.y, footerNow.y + 4);
				expect(edge.some(isInk), 'the street edge is painted').toBe(true);
			} finally {
				await context.close();
			}
		});
	}
}
