import { expectAccessible } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';
import { DIVIDER_COPY, DIVIDER_LANGS } from '../../src/lib/gallery/dividers-fixture.js';
import { column, strokes } from './pixels.js';

// D22: THE divider is the dimension line; PageSections ends every section but the last with it
// (the last one sits in a product wrapper); the footer's top edge is the street edge, one dashed
// line of alternating yellow and white dashes.
const WIDTHS = [320, 390, 768, 1440, 1920];
const THEMES = ['dark', 'light'] as const;

async function open(page: Page, lang: string, theme: string, width = 1440, query = '') {
	await page.setViewportSize({ width, height: 900 });
	await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
	await page.goto(`/dividers/${lang}${query}`);
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

/** The page sections in order, each with the boundary row that follows it, if any. */
const layout = (page: Page) =>
	page.getByTestId('divider-sections').evaluate((root) => {
		const sections = [...root.querySelectorAll<HTMLElement>('[data-slot="page-section"]')];
		const lines = [...root.querySelectorAll<HTMLElement>('[data-slot="page-section-boundary"]')];
		const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
		return {
			client: document.documentElement.clientWidth,
			sections: sections.map((section, index) => {
				const next = sections[index + 1];
				const after = lines.filter((line) => follows(section, line) && (!next || follows(line, next)));
				const rect = section.getBoundingClientRect();
				return {
					id: section.id,
					bottom: rect.bottom,
					lines: after.map((line) => {
						const box = line.getBoundingClientRect();
						const style = getComputedStyle(line);
						return {
							top: box.top,
							left: box.left,
							width: box.width,
							height: style.height,
							border: `${style.borderLeftWidth} ${style.borderLeftStyle} ${style.borderLeftColor}`,
							background: style.backgroundImage,
							size: style.backgroundSize,
							position: style.backgroundPosition,
							animation: style.animationName,
							ariaHidden: line.getAttribute('aria-hidden'),
							role: line.getAttribute('role'),
							nextTop: next?.getBoundingClientRect().top,
						};
					}),
				};
			}),
		};
	});

for (const theme of THEMES) {
	for (const lang of DIVIDER_LANGS) {
		test(`${lang}, ${theme}: every section but the last ends with one dimension line, none before the footer`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run covers both themes and every width');
			await open(page, lang, theme);
			const ink = await resolve(page, 'color-mix(in srgb, var(--primary) 70%, transparent)');
			const { client, sections } = await layout(page);
			expect(sections.map(({ id }) => id)).toEqual(DIVIDER_COPY[lang].sections.map(({ id }) => id));
			// The last section sits in a wrapper and is still the last page section.
			await expect(page.getByTestId('last-wrapper').locator('[data-slot="page-section"]')).toHaveCount(1);

			for (const section of sections.slice(0, -1)) {
				expect(section.lines, section.id).toHaveLength(1);
				const [line] = section.lines;
				expect(line!.top, `${section.id}: the line starts where the section ends`).toBeCloseTo(section.bottom, 0);
				expect(line!.nextTop! - (line!.top + 9), `${section.id}: the next section starts after the line`).toBeGreaterThanOrEqual(-0.5);
				expect(line!.left, section.id).toBe(0);
				expect(line!.width, `${section.id} runs edge to edge`).toBe(client);
				expect(line!.height, section.id).toBe('9px');
				expect(line!.border, section.id).toBe(`1px solid ${ink}`);
				expect(line!.background, section.id).toContain('repeating-linear-gradient');
				expect(line!.size, section.id).toBe('100% 1px, 100% 5px');
				expect(line!.position, section.id).toBe('0px 4px, 79px 2px');
				expect(line!.animation, `${section.id} is static`).toBe('none');
				expect([line!.ariaHidden, line!.role], section.id).toEqual(['true', 'none']);
			}
			expect(sections.at(-1)!.lines, 'the last section draws no divider').toHaveLength(0);

			// Painted: nothing between the last section's text and the footer.
			const footer = page.getByRole('contentinfo');
			await footer.scrollIntoViewIfNeeded();
			const lastText = (await page.locator(`#${sections.at(-1)!.id} p`).last().boundingBox())!;
			const footerBox = (await footer.boundingBox())!;
			const rows = await column(page, lastText.x + 10, lastText.y + lastText.height + 2, footerBox.y - 1);
			expect(strokes(rows), 'no stroke before the footer').toBe(0);

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
			const [yellow, white, footerBg, hairline] = await Promise.all([
				resolve(page, 'var(--hazard-a)'),
				resolve(page, 'var(--reflective)'),
				footer.evaluate((node) => getComputedStyle(node).backgroundColor),
				resolve(page, 'color-mix(in srgb, var(--foreground) 35%, transparent)'),
			]);
			expect(yellow).toBe('rgb(255, 182, 39)');
			expect(white).toBe('rgb(245, 245, 240)');
			expect(footerBg).toBe(await resolve(page, 'var(--muted)'));
			expect(hairline).not.toBe('rgba(0, 0, 0, 0)');
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
			expect(style.image).toContain(`${hairline} 40px, ${hairline} 60px`);
			expect(style.size).toBe('100% 2px, 100% 4px');
			expect(style.position).toBe('0px 1px, 0px 0px');
			await expect(footer.locator('.footer-gradient-sep')).toHaveCount(0);
		});

		test(`${lang}, ${theme}: fits from 320 to 1920px and passes axe`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name !== 'desktop', 'One run resizes through every width');
			await open(page, lang, theme);
			for (const width of WIDTHS) {
				await page.setViewportSize({ width, height: 900 });
				const { client, sections } = await layout(page);
				const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
				expect(scroll, `${lang} ${theme} at ${width}px`).toBeLessThanOrEqual(client);
				for (const section of sections.slice(0, -1)) {
					expect(section.lines, `${section.id} at ${width}px`).toHaveLength(1);
					expect(section.lines[0]!.width, `${section.id} at ${width}px`).toBe(client);
				}
				expect(sections.at(-1)!.lines).toHaveLength(0);
			}
			await expectAccessible(page);
		});
	}
}

// Owner live QA, 16 November 2026: the drawn page divider, the hazard footer edge and the one solid
// yellow terminal line, rendered together in both themes.
for (const theme of THEMES) {
	test(`${theme}: hand-drawn dividers, hazard footer edge and yellow terminal line`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers both themes');
		await open(page, 'en', theme, 1440, '?divider=hand-drawn&edge=hazard');
		const ink = await resolve(page, 'var(--primary)');
		const yellow = await resolve(page, 'var(--accent)');
		const { client, sections } = await layout(page);
		for (const section of sections.slice(0, -1)) {
			expect(section.lines, section.id).toHaveLength(1);
			const [line] = section.lines;
			expect(line!.left, section.id).toBe(0);
			expect(line!.width, `${section.id} runs edge to edge`).toBe(client);
			expect(line!.height, `${section.id} adds no blank row between backgrounds`).toBe('0px');
			expect(line!.animation, `${section.id} is static`).toBe('none');
			expect([line!.ariaHidden, line!.role], section.id).toEqual(['true', 'none']);
		}
		const boundaries = page.locator('[data-slot="page-section-boundary"]');
		await expect(boundaries).toHaveCount(3);
		const paths = await boundaries.locator('svg path').evaluateAll(nodes => nodes.map(node => node.getAttribute('d')!));
		expect(paths.map(path => (path.match(/M/g) ?? []).length)).toEqual([4, 5, 4]);
		expect(paths[0]).toBe(paths[2]);
		expect(paths[0]).not.toBe(paths[1]);
		for (const boundary of await boundaries.all()) {
			await expect(boundary).toHaveClass(/hand-drawn-line/);
			await expect(boundary).toHaveAttribute('data-variant', 'hand-drawn');
			const path = boundary.locator('svg path');
			await expect(path).toHaveCount(1);
			await expect(path).toHaveAttribute('vector-effect', 'non-scaling-stroke');
			await expect(path).toHaveAttribute('stroke', 'currentColor');
			await expect(path).toHaveCSS('stroke', ink);
			await expect(path).toHaveCSS('stroke-width', '1.25px');
			const seam = await boundary.evaluate(node => {
				const sections = [...node.closest('[data-slot="page-sections"]')!.querySelectorAll('[data-slot="page-section"]')];
				const previous = sections.filter(section => Boolean(section.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)).at(-1)!;
				const before = previous.getBoundingClientRect();
				const after = node.nextElementSibling!.getBoundingClientRect();
				const path = node.querySelector('path')!;
				const ink = path.getBBox();
				const center = new DOMPoint(ink.x + ink.width / 2, ink.y + ink.height / 2).matrixTransform(path.getScreenCTM()!);
				return { gap: after.top - before.bottom, inkToEdge: center.y - before.bottom };
			});
			expect(Math.abs(seam.gap), 'section backgrounds meet with no padded strip').toBeLessThanOrEqual(0.5);
			expect(seam.inkToEdge, 'the drawn ink sits just above the actual section edge').toBeGreaterThanOrEqual(-2);
			expect(seam.inkToEdge).toBeLessThanOrEqual(0);
		}

		const footer = page.getByRole('contentinfo');
		const edge = footer.locator('[data-slot="footer-hazard-edge"]');
		await expect(edge).toHaveCount(1);
		await expect(footer.locator('[data-slot="footer-street-edge"]')).toHaveCount(0);
		expect(await footer.evaluate((node) => node.firstElementChild?.getAttribute('data-slot'))).toBe('footer-hazard-edge');
		await expect(edge).toHaveAttribute('aria-hidden', 'true');
		await expect(edge).toHaveCSS('height', '3px');
		expect(await edge.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain('repeating-linear-gradient');

		const terminal = page.getByTestId('line-terminal');
		await expect(terminal).toHaveClass(/terminal-rule-line/);
		await expect(terminal.locator('.terminal-rule, [data-slot="separator"]')).toHaveCount(0);
		await expect(terminal.locator('.terminal-titlebar')).toHaveCSS('border-bottom-color', yellow);
		await expect(terminal.locator('.terminal-titlebar')).toHaveCSS('border-bottom-width', '1px');
		await expect(terminal.locator('.terminal-footer')).toHaveCSS('border-top-color', yellow);
		await expect(page.getByTestId('dimension-terminal').locator('.dimension-line')).toHaveCount(1);

		// A line panel may contain other panels. Its opt-in must not recolour their own rules.
		const control = page.getByTestId('default-terminal-control');
		const controlHeader = await control.locator(':scope > .terminal-titlebar').evaluate(node => getComputedStyle(node).borderBottomColor);
		const controlFooter = await control.locator(':scope > .terminal-footer').evaluate(node => getComputedStyle(node).borderTopColor);
		expect(controlHeader).not.toBe(yellow);
		expect(controlFooter).not.toBe(yellow);
		const outer = page.getByTestId('nested-line-terminal');
		await expect(outer.locator(':scope > .terminal-titlebar')).toHaveCSS('border-bottom-color', yellow);
		await expect(outer.locator(':scope > .terminal-footer')).toHaveCSS('border-top-color', yellow);
		for (const id of ['nested-default-terminal', 'nested-dimension-terminal']) {
			const inner = page.getByTestId(id);
			await expect(inner.locator(':scope > .terminal-titlebar')).toHaveCSS('border-bottom-color', controlHeader);
			await expect(inner.locator(':scope > .terminal-footer')).toHaveCSS('border-top-color', controlFooter);
		}
		const defaultTape = await control.locator(':scope > .terminal-rule').evaluate(node => getComputedStyle(node).backgroundImage);
		expect(defaultTape).toContain('repeating-linear-gradient');
		await expect(page.getByTestId('nested-default-terminal').locator(':scope > .terminal-rule')).toHaveCSS('background-image', defaultTape);
		await expect(page.getByTestId('nested-dimension-terminal').locator(':scope > .terminal-rule')).toHaveClass(/dimension-line/);
		await expect(page.getByTestId('nested-default-code').locator('.terminal-titlebar')).toHaveCSS('border-bottom-color', controlHeader);
	});
}
