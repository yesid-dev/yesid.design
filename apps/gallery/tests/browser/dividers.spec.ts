import { expectAccessible } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';
import { DIVIDER_COPY, DIVIDER_LANGS } from '../../src/lib/gallery/dividers-fixture.js';

// D22: THE divider is the dimension line; every section but the last ends with it; the footer's
// top edge is the street edge, one dashed line of alternating yellow and white dashes.
const WIDTHS = [320, 390, 768, 1440, 1920];
const THEMES = ['dark', 'light'] as const;

async function open(page: Page, lang: string, theme: string, width = 1440) {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
	await page.goto(`/dividers/${lang}`);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

/** Resolves a CSS colour expression to the computed `rgb()` string in the page's current theme. */
const resolve = (page: Page, value: string) =>
	page.evaluate((expression) => {
		const probe = document.createElement('span');
		probe.style.color = expression;
		document.body.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	}, value);

/** What each section of the page draws at its bottom edge, read from its ::after. */
const sectionEnds = (page: Page) =>
	page.getByTestId('divider-sections').evaluate((root) =>
		[...root.children].map((section) => {
			const rect = section.getBoundingClientRect();
			const after = getComputedStyle(section, '::after');
			return {
				id: section.id,
				tag: section.tagName,
				content: after.content,
				position: after.position,
				height: after.height,
				bottom: after.bottom,
				width: parseFloat(after.width),
				sectionWidth: rect.width,
				sectionLeft: rect.left,
				border: `${after.borderLeftWidth} ${after.borderLeftStyle} ${after.borderLeftColor}`,
				background: after.backgroundImage,
				backgroundSize: after.backgroundSize,
				backgroundPosition: after.backgroundPosition,
				animation: after.animationName,
			};
		}),
	);

for (const theme of THEMES) {
	for (const lang of DIVIDER_LANGS) {
		test(`${lang}, ${theme}: every section but the last ends with one dimension line, none before the footer`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run covers both themes and every width');
			await open(page, lang, theme);
			const ink = await resolve(page, 'color-mix(in srgb, var(--primary) 70%, transparent)');
			const ends = await sectionEnds(page);
			const client = await page.evaluate(() => document.documentElement.clientWidth);
			expect(ends.map(({ id }) => id)).toEqual(DIVIDER_COPY[lang].sections.map(({ id }) => id));
			expect(ends.every(({ tag }) => tag === 'SECTION')).toBe(true);

			for (const end of ends.slice(0, -1)) {
				expect(end.content, end.id).toBe('""');
				expect(end.position, end.id).toBe('absolute');
				expect(end.bottom, end.id).toBe('0px');
				expect(end.height, end.id).toBe('9px');
				expect(end.width, `${end.id} runs edge to edge`).toBe(end.sectionWidth);
				expect(end.sectionWidth, `${end.id} is full-bleed`).toBe(client);
				expect(end.border, end.id).toBe(`1px solid ${ink}`);
				expect(end.background, end.id).toContain('repeating-linear-gradient');
				expect(end.backgroundSize, end.id).toBe('100% 1px, 100% 5px');
				expect(end.backgroundPosition, end.id).toBe('0px 4px, 79px 2px');
				expect(end.animation, `${end.id} is static`).toBe('none');
			}
			const last = ends.at(-1)!;
			expect(last.content, 'the last section draws no divider').toBe('none');

			// Nothing between the last section and the footer draws a divider.
			const between = await page.evaluate(() => {
				const footer = document.querySelector('[data-slot="footer"]')!;
				const last = document.querySelector('[data-testid="divider-sections"] > section:last-of-type')!;
				return [...document.querySelectorAll('.dimension-line, [data-slot="separator"]')].filter(
					(node) =>
						last.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING &&
						!last.contains(node) &&
						node.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
				).length;
			});
			expect(between).toBe(0);
			const gap = await page.evaluate(() => {
				const footer = document.querySelector('[data-slot="footer"]')!.getBoundingClientRect();
				const last = document.querySelector('[data-testid="divider-sections"] > section:last-of-type')!.getBoundingClientRect();
				return footer.top - last.bottom;
			});
			expect(gap, 'the footer follows the last section directly').toBeLessThan(1);

			// The manual Separator and the panel's rule are the same line.
			for (const id of ['manual-dimension', 'dimension-terminal']) {
				const line = page.getByTestId(id).locator('.dimension-line');
				await expect(line).toHaveCount(1);
				await expect(line).toHaveAttribute('aria-hidden', 'true');
				await expect(line).toHaveAttribute('role', 'none');
				await expect(line).toHaveCSS('height', '9px');
				await expect(line).toHaveCSS('border-left-color', ink);
			}
		});

		test(`${lang}, ${theme}: the footer's top edge is one dashed line of alternating yellow and white dashes`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run covers both themes');
			await open(page, lang, theme);
			const footer = page.getByRole('contentinfo');
			const edge = footer.locator('[data-slot="footer-street-edge"]');
			await expect(edge).toHaveCount(1);
			await expect(edge).toHaveAttribute('aria-hidden', 'true');
			await expect(edge).toHaveAttribute('role', 'none');
			expect(await footer.evaluate((node) => node.firstElementChild?.getAttribute('data-slot'))).toBe('footer-street-edge');
			const [yellow, white, footerBg] = await Promise.all([
				resolve(page, 'var(--hazard-a)'),
				resolve(page, 'var(--reflective)'),
				footer.evaluate((node) => getComputedStyle(node).backgroundColor),
			]);
			expect(yellow).toBe('rgb(255, 182, 39)');
			expect(white).toBe('rgb(245, 245, 240)');
			expect(footerBg).toBe(await resolve(page, 'var(--muted)'));
			const style = await edge.evaluate((node) => {
				const computed = getComputedStyle(node);
				const rect = node.getBoundingClientRect();
				return {
					height: computed.height,
					image: computed.backgroundImage,
					size: computed.backgroundSize,
					position: computed.backgroundPosition,
					animation: computed.animationName,
					left: rect.left,
					width: rect.width,
					top: rect.top - node.parentElement!.getBoundingClientRect().top,
				};
			});
			expect(style.height).toBe('4px');
			expect(style.top).toBe(0);
			expect(style.left).toBe(0);
			expect(style.width).toBe(await page.evaluate(() => document.documentElement.clientWidth));
			expect(style.animation).toBe('none');
			// One dashed line: 20px dashes, yellow then white, every 80px; the white dash is edged by a
			// hairline so it reads on the light footer.
			expect(style.image).toContain(`${white} 41px, ${white} 59px`);
			expect(style.image).toContain(`${yellow} 0px, ${yellow} 20px`);
			const hairline = await resolve(page, 'color-mix(in srgb, var(--foreground) 35%, transparent)');
			expect(hairline).not.toBe('rgba(0, 0, 0, 0)');
			expect(style.image).toContain(`${hairline} 40px, ${hairline} 60px`);
			expect(style.size).toBe('100% 2px, 100% 4px');
			expect(style.position).toBe('0px 1px, 0px 0px');
			// The hazard strip it replaces is gone.
			await expect(footer.locator('.footer-gradient-sep')).toHaveCount(0);
		});

		test(`${lang}, ${theme}: fits from 320 to 1920px and passes axe`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run resizes through every width');
			await open(page, lang, theme);
			for (const width of WIDTHS) {
				await page.setViewportSize({ width, height: 900 });
				const fit = await page.evaluate(() => ({
					scroll: document.documentElement.scrollWidth,
					client: document.documentElement.clientWidth,
				}));
				expect(fit.scroll, `${lang} ${theme} at ${width}px`).toBeLessThanOrEqual(fit.client);
				const ends = await sectionEnds(page);
				for (const end of ends.slice(0, -1)) {
					expect(end.width, `${end.id} at ${width}px`).toBe(fit.client);
				}
				expect(ends.at(-1)!.content).toBe('none');
			}
			await expectAccessible(page);
		});
	}
}
