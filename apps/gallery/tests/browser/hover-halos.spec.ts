import { expect, test, type Locator, type Page } from '@playwright/test';

import { HOME, LABELS } from '../../src/lib/gallery/site-header-fixture.js';

// Owner ruling, 15 November 2026: "The only thing that I want to remove on hover was the halo."
// Hover may lift, recolour, firm a border or change an underline. It never adds light around the
// element: a halo is an outer box-shadow, text-shadow or drop-shadow whose colour is brand or accent
// coloured, or lighter than the surface it falls on. Owner answer A (15 November 2026): hover is
// identical in light and dark, so a card or section heading gets its lift and edge and no outer
// shadow at all in either theme. Focus rings stay.

type Paint = { boxShadow: string; textShadow: string; filter: string; surface: string; ink: string };

/** Computed shadows, plus the opaque surface they fall on: the parent's for an element's box, its own for its text. */
async function paint(locator: Locator): Promise<Paint> {
	return locator.evaluate((element) => {
		const opaque = (start: Element | null) => {
			for (let node = start; node; node = node.parentElement) {
				const background = getComputedStyle(node).backgroundColor;
				if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') return background;
			}
			return getComputedStyle(document.documentElement).backgroundColor;
		};
		const style = getComputedStyle(element);
		return {
			boxShadow: style.boxShadow,
			textShadow: style.textShadow,
			filter: style.filter,
			surface: opaque(element.parentElement),
			ink: opaque(element),
		};
	});
}

/** Splits a computed list on the commas between layers, not those inside colour functions. */
function layers(list: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < list.length; i += 1) {
		if (list[i] === '(') depth += 1;
		else if (list[i] === ')') depth -= 1;
		else if (list[i] === ',' && depth === 0) {
			out.push(list.slice(start, i).trim());
			start = i + 1;
		}
	}
	out.push(list.slice(start).trim());
	return out.filter(Boolean);
}

type Rgb = { r: number; g: number; b: number; a: number };
const COLOUR = /\b(?:rgba?|color)\([^)]*\)/;

/** Parses the computed `rgb()`, `rgba()` and `color(srgb ...)` forms into 0-1 channels. */
function rgb(text: string): Rgb | null {
	const srgb = text.match(/color\(srgb ([^)]+)\)/);
	if (srgb) {
		const [channels, alpha] = srgb[1]!.split('/');
		const [r, g, b] = channels!.trim().split(/\s+/).map(Number);
		return { r: r!, g: g!, b: b!, a: alpha === undefined ? 1 : Number(alpha) };
	}
	const legacy = text.match(/rgba?\(([^)]+)\)/);
	if (legacy) {
		const [r, g, b, a] = legacy[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
		return { r: r! / 255, g: g! / 255, b: b! / 255, a: a ?? 1 };
	}
	return null;
}

const luminance = ({ r, g, b }: Rgb) =>
	[r, g, b]
		.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
		.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0);

/** A glow: brand or accent coloured (clearly chromatic), or lighter than the surface. Unknown colours count. */
function glows(colour: string, surface: string): boolean {
	const light = rgb(colour);
	const ground = rgb(surface);
	if (!light || !ground) return true;
	if (light.a === 0) return false;
	const chroma = Math.max(light.r, light.g, light.b) - Math.min(light.r, light.g, light.b);
	return chroma > 0.2 || luminance(light) > luminance(ground);
}

/** Outer box-shadow layers that paint anything (blur or spread). */
function outer(boxShadow: string): string[] {
	if (boxShadow === 'none') return [];
	return layers(boxShadow).filter((layer) => {
		if (/\binset\b/.test(layer)) return false;
		const lengths = layer.replace(COLOUR, '').match(/-?[\d.]+px/g) ?? [];
		return parseFloat(lengths[2] ?? '0') > 0 || parseFloat(lengths[3] ?? '0') > 0;
	});
}

/** The halo layers in a paint. */
function halos({ boxShadow, textShadow, filter, surface, ink }: Paint): string[] {
	const found: string[] = [];
	for (const layer of outer(boxShadow)) {
		if (glows(layer.match(COLOUR)?.[0] ?? '', surface)) found.push(`box-shadow ${layer}`);
	}
	if (textShadow !== 'none') {
		for (const layer of layers(textShadow)) {
			if (glows(layer.match(COLOUR)?.[0] ?? '', ink)) found.push(`text-shadow ${layer}`);
		}
	}
	for (const drop of filter.match(/drop-shadow\((?:[^()]|\([^)]*\))*\)/g) ?? []) {
		if (glows(drop.match(COLOUR)?.[0] ?? '', surface)) found.push(`filter ${drop}`);
	}
	return found;
}

async function token(locator: Locator, name: string): Promise<string> {
	return locator.evaluate((element, variable) => {
		const probe = document.createElement('span');
		probe.style.color = `var(${variable})`;
		element.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	}, name);
}

async function ready(page: Page, route: string): Promise<void> {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto(route);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

/** Lets hover transitions finish (the longest is --duration-normal). */
const settle = (page: Page) => page.waitForTimeout(450);

async function hover(page: Page, target: Locator): Promise<void> {
	await target.scrollIntoViewIfNeeded();
	await target.hover();
	await settle(page);
}

test.describe('hover adds no halo', { tag: '@theme' }, () => {
	test('call-to-action buttons lift and recolour on hover and keyboard focus, without a glow', async ({ page }) => {
		await ready(page, '/button-focus');
		const surface = page.locator('[data-focus-surface="page"]');
		for (const name of ['page default', 'page default link', 'page conversion', 'page conversion link']) {
			const control = surface.getByRole(name.endsWith('link') ? 'link' : 'button', { name, exact: true });
			await page.mouse.move(0, 0);
			await settle(page);
			const rest = await control.evaluate((element) => {
				const style = getComputedStyle(element);
				return { background: style.backgroundColor, translate: style.translate };
			});
			await hover(page, control);
			const lifted = await control.evaluate((element) => {
				const style = getComputedStyle(element);
				return { background: style.backgroundColor, translate: style.translate };
			});
			expect(lifted.background, `${name} recolours on hover`).not.toBe(rest.background);
			expect(lifted.translate, `${name} lifts 1px on hover`).toMatch(/-1px/);
			expect(halos(await paint(control)), `${name} has no hover halo`).toEqual([]);

			// Keyboard focus while hovered keeps the 2px focus ring and still adds no glow.
			await control.focus();
			await page.keyboard.press('Shift+Tab');
			await page.keyboard.press('Tab');
			await settle(page);
			await expect(control).toBeFocused();
			await expect(control).toHaveCSS('outline-width', '2px');
			expect(halos(await paint(control)), `${name} has no focus-visible hover halo`).toEqual([]);
			await control.blur();
		}
	});

	test('interactive cards and section headings firm and lift on hover, without a glow', async ({ page }) => {
		await ready(page, '/reading-surfaces');
		const theme = await page.locator('html').getAttribute('data-theme');
		expect(['light', 'dark']).toContain(theme);
		for (const fixture of ['interactive-brand', 'interactive-neutral']) {
			const card = page.locator(`[data-fixture="${fixture}"]`);
			const rest = await card.evaluate((element) => getComputedStyle(element).borderTopColor);
			await hover(page, card);
			const hovered = await card.evaluate((element) => {
				const style = getComputedStyle(element);
				return { border: style.borderTopColor, transform: style.transform };
			});
			expect(hovered.border, `${fixture} firms its border`).not.toBe(rest);
			expect(hovered.transform, `${fixture} lifts`).not.toBe('none');
			const hoveredPaint = await paint(card);
			expect(halos(hoveredPaint), `${fixture} has no hover halo`).toEqual([]);
			expect(outer(hoveredPaint.boxShadow), `${fixture} casts no outer hover shadow in ${theme}`).toEqual([]);
			await page.mouse.move(0, 0);
		}
		for (const fixture of ['section-default', 'section-neutral-es']) {
			const section = page.locator(`[data-fixture="${fixture}"] [data-slot="card"]`);
			const rest = await section.evaluate((element) => getComputedStyle(element).borderTopColor);
			await hover(page, page.locator(`[data-fixture="${fixture}"] [data-section-trigger]`));
			expect(await section.evaluate((element) => getComputedStyle(element).borderTopColor), `${fixture} firms its border`).not.toBe(rest);
			const hoveredPaint = await paint(section);
			expect(halos(hoveredPaint), `${fixture} has no hover halo`).toEqual([]);
			expect(outer(hoveredPaint.boxShadow), `${fixture} casts no outer hover shadow in ${theme}`).toEqual([]);
			await page.mouse.move(0, 0);
		}
	});

	test('header nav links and menu items turn orange on hover, without a text glow', async ({ page }) => {
		await ready(page, HOME);
		const link = page.locator('.nav-pill-link:not(.nav-link-active):visible').first();
		await expect(link).toBeVisible();
		await hover(page, link);
		await expect(link).toHaveCSS('color', await token(link, '--primary'));
		expect(halos(await paint(link)), 'a hovered nav link has no halo').toEqual([]);

		await page.mouse.move(0, 0);
		await page.getByRole('button', { name: LABELS.openMenu }).click();
		const menu = page.getByRole('dialog', { name: LABELS.menu });
		await expect(menu).toBeVisible();
		await settle(page);
		for (const item of await menu.locator('.menu-item:not(.menu-item-active)').all()) {
			await hover(page, item);
			const label = item.locator('.menu-label');
			await expect(label).toHaveCSS('color', await token(label, '--primary'));
			expect(halos(await paint(label)), 'a hovered menu label has no halo').toEqual([]);
			const icon = item.locator('.menu-icon');
			if (await icon.count()) expect(halos(await paint(icon)), 'a hovered menu icon has no halo').toEqual([]);
		}
	});
	test('cards and section headings make the same hover changes in light and dark', async ({ context }) => {
		type Probe = { target: string; hover: string; title?: string };
		const probes: Probe[] = [
			{ target: '[data-fixture="interactive-brand"]', hover: '[data-fixture="interactive-brand"]' },
			{ target: '[data-fixture="interactive-neutral"]', hover: '[data-fixture="interactive-neutral"]' },
			{ target: '[data-fixture="section-default"] [data-slot="card"]', hover: '[data-fixture="section-default"] [data-section-trigger]', title: '[data-fixture="section-default"] .section-title' },
			{ target: '[data-fixture="section-neutral-es"] [data-slot="card"]', hover: '[data-fixture="section-neutral-es"] [data-section-trigger]', title: '[data-fixture="section-neutral-es"] .section-title' },
		];
		const snapshot = (page: Page, probe: Probe) =>
			page.evaluate(({ target, title }) => {
				const card = getComputedStyle(document.querySelector(target)!);
				return {
					border: card.borderTopColor,
					transform: card.transform,
					boxShadow: card.boxShadow,
					title: title ? getComputedStyle(document.querySelector(title)!).color : '',
				};
			}, probe);
		const changes: Record<string, string[][]> = {};
		for (const theme of ['light', 'dark']) {
			const page = await context.newPage();
			await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
			await ready(page, '/reading-surfaces');
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			changes[theme] = [];
			for (const probe of probes) {
				await page.mouse.move(0, 0);
				await settle(page);
				const rest = await snapshot(page, probe);
				await hover(page, page.locator(probe.hover));
				const hovered = await snapshot(page, probe);
				const changed = (Object.keys(rest) as (keyof typeof rest)[]).filter((key) => rest[key] !== hovered[key]);
				expect(changed, `${probe.target} never changes its shadow on hover in ${theme}`).not.toContain('boxShadow');
				changes[theme]!.push(changed);
			}
			await page.close();
		}
		expect(changes.light, 'light and dark make the same hover changes').toEqual(changes.dark);
		expect(changes.light).toEqual([['border', 'transform'], ['border', 'transform'], ['border', 'title'], ['border', 'title']]);
	});
	test('keyboard focus gives cards and section headings the hover lift and edge, beside the focus ring', async ({ page }) => {
		await ready(page, '/reading-surfaces');
		const focusByKeyboard = async (target: Locator) => {
			await target.scrollIntoViewIfNeeded();
			await target.evaluate((element) => {
				const start = document.createElement('span');
				start.tabIndex = -1;
				element.before(start);
				start.focus({ preventScroll: true });
				start.remove();
			});
			await page.keyboard.press('Tab');
			await expect(target).toBeFocused();
			await settle(page);
		};
		const look = (locator: Locator) =>
			locator.evaluate((element) => {
				const style = getComputedStyle(element);
				return { border: style.borderTopColor, transform: style.transform, boxShadow: style.boxShadow };
			});
		await page.mouse.move(0, 0);
		for (const fixture of ['interactive-brand', 'interactive-neutral']) {
			const card = page.locator(`[data-fixture="${fixture}"]`);
			const link = card.locator('xpath=..');
			const rest = await look(card);
			await hover(page, card);
			const hovered = await look(card);
			await page.mouse.move(0, 0);
			await settle(page);
			await focusByKeyboard(link);
			const focused = await look(card);
			expect(focused, `${fixture} keyboard focus matches hover`).toEqual(hovered);
			expect(focused.border).not.toBe(rest.border);
			expect(focused.transform).not.toBe('none');
			expect(focused.boxShadow, `${fixture} casts no focus shadow`).toBe(rest.boxShadow);
			await expect(link).toHaveCSS('outline-width', '2px');
			await link.blur();
		}
		for (const fixture of ['section-default', 'section-neutral-es']) {
			const section = page.locator(`[data-fixture="${fixture}"] [data-slot="card"]`);
			const trigger = page.locator(`[data-fixture="${fixture}"] [data-section-trigger]`).first();
			const rest = await look(section);
			await focusByKeyboard(trigger);
			const focused = await look(section);
			expect(focused.border, `${fixture} keyboard focus firms the edge`).not.toBe(rest.border);
			expect(focused.boxShadow, `${fixture} casts no focus shadow`).toBe(rest.boxShadow);
			await expect(trigger).toHaveCSS('outline-width', '2px');
			await trigger.blur();
		}

		// A product-owned link passed as children: no component hash, still lifts its card (DEV-15).
		const inside = page.locator('[data-fixture="interactive-inside"]');
		const insideLink = page.getByTestId('inside-card-link');
		const insideRest = await look(inside);
		await focusByKeyboard(insideLink);
		const insideFocused = await look(inside);
		expect(insideFocused.border, 'a consumer link firms its card edge').not.toBe(insideRest.border);
		expect(insideFocused.transform, 'a consumer link lifts its card').not.toBe('none');
		expect(insideFocused.boxShadow, 'a consumer link casts no card shadow').toBe(insideRest.boxShadow);
		await expect(insideLink).toHaveCSS('outline-width', '2px');
		await insideLink.blur();

		// Reduced motion drops the lift and keeps the edge.
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const card = page.locator('[data-fixture="interactive-brand"]');
		const rest = await look(card);
		await focusByKeyboard(card.locator('xpath=..'));
		const focused = await look(card);
		expect(focused.transform).toBe('none');
		expect(focused.border).not.toBe(rest.border);
	});
});
