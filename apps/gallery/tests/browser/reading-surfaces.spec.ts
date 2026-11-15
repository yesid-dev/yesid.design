import { expect, test, type Locator, type Page } from '@playwright/test';

const THEMES = ['dark', 'light'] as const;

async function open(page: Page, theme: string, route = '/reading-surfaces'): Promise<void> {
	await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
	await page.goto(route);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
	await page.evaluate(() => document.fonts.ready);
}

/** Resolves a token to the computed colour the browser would paint, inside the element's theme. */
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

async function frame(locator: Locator): Promise<{ border: string; shadow: string; transform: string }> {
	return locator.evaluate((element) => {
		const style = getComputedStyle(element);
		return { border: style.borderTopColor, shadow: style.boxShadow, transform: style.transform };
	});
}

async function settle(page: Page): Promise<void> {
	await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

for (const theme of THEMES) {
	test(`static cards do not react to hover in ${theme}`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await open(page, theme);
		for (const fixture of ['static-brand', 'static-neutral']) {
			const card = page.locator(`[data-fixture="${fixture}"]`);
			const rest = await frame(card);
			await card.hover();
			await page.waitForTimeout(400);
			expect(await frame(card), fixture).toEqual(rest);
		}
	});

	test(`a card that acts reacts to hover without a halo, in ${theme}`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await open(page, theme);
		const brand = page.locator('[data-fixture="interactive-brand"]');
		const brandRest = await frame(brand);
		await brand.hover();
		await page.waitForTimeout(400);
		const brandHover = await frame(brand);
		expect(brandHover.border).not.toBe(brandRest.border);
		// Hover is identical in light and dark: lift and edge, no shadow (owner answer A, 15 November 2026).
		expect(brandHover.shadow).toBe(brandRest.shadow);
		expect(brandHover.transform).not.toBe('none');

		const neutral = page.locator('[data-fixture="interactive-neutral"]');
		const neutralRest = await frame(neutral);
		expect(neutralRest.border).toBe(await token(neutral, '--border'));
		await neutral.hover();
		await page.waitForTimeout(400);
		const neutralHover = await frame(neutral);
		expect(neutralHover.border).not.toBe(neutralRest.border);
		expect(neutralHover.shadow).toBe(neutralRest.shadow);
	});

	test(`neutral edges, section weights, labels and field sizes in ${theme}`, async ({ page }) => {
		await open(page, theme);
		const neutral = page.locator('[data-fixture="static-neutral"]');
		expect((await frame(neutral)).border).toBe(await token(neutral, '--border'));
		const brand = page.locator('[data-fixture="static-brand"]');
		expect((await frame(brand)).border).not.toBe(await token(brand, '--border'));

		const width = (fixture: string) =>
			page.locator(`[data-fixture="${fixture}"] [data-slot="card"]`).evaluate((element) => getComputedStyle(element).borderTopWidth);
		expect(await width('section-default')).toBe('3px');
		expect(await width('section-regular')).toBe('2px');
		expect(await width('section-neutral-fr')).toBe('1px');

		for (const lang of ['en', 'fr', 'es']) {
			const field = page.locator(`[data-fixture="field-${lang}"] input`);
			expect(parseFloat(await field.evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
			const hint = page.locator(`[data-fixture="field-${lang}"] .hint`);
			expect(parseFloat(await hint.evaluate((element) => getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
		}

		const reading = page.locator('[data-fixture="label-reading"] .label-reading');
		const style = await reading.evaluate((element) => {
			const computed = getComputedStyle(element);
			return { family: computed.fontFamily, transform: computed.textTransform, spacing: computed.letterSpacing, size: parseFloat(computed.fontSize) };
		});
		expect(style.family).toMatch(/Inter/);
		expect(style.transform).toBe('none');
		expect(style.spacing).toBe('normal');
		expect(style.size).toBeGreaterThanOrEqual(14);
		await expect(reading).toHaveCSS('color', await token(reading, '--muted-foreground'));
		const station = page.locator('[data-fixture="label-station"] .label-station');
		await expect(station).toHaveCSS('text-transform', 'uppercase');
	});

	test(`a hovered section title turns orange, never yellow, in ${theme}`, async ({ page }) => {
		await open(page, theme);
		for (const fixture of ['section-default', 'section-neutral-es']) {
			const header = page.locator(`[data-fixture="${fixture}"] [data-section-trigger]`);
			const title = header.locator('.section-title');
			await header.hover();
			await page.waitForTimeout(400);
			await expect(title).toHaveCSS('color', await token(title, '--primary'));
			expect(await title.evaluate((element) => getComputedStyle(element).color)).not.toBe(await token(title, '--accent-text'));
		}
		const neutral = page.locator('[data-fixture="section-neutral-es"] [data-slot="card"]');
		const brandSection = page.locator('[data-fixture="section-default"] [data-slot="card"]');
		const shadowOf = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).boxShadow);
		const brandRest = await shadowOf(brandSection);
		await page.locator('[data-fixture="section-default"] [data-section-trigger]').hover();
		await page.waitForTimeout(400);
		expect(await shadowOf(brandSection)).toBe(brandRest);
		const neutralRest = await shadowOf(neutral);
		await page.locator('[data-fixture="section-neutral-es"] [data-section-trigger]').hover();
		await page.waitForTimeout(400);
		expect(await shadowOf(neutral)).toBe(neutralRest);
	});

	test(`the TOC counter is optional in ${theme}`, async ({ page }) => {
		await open(page, theme);
		await expect(page.locator('[data-fixture="toc-default"] .toc-counter-text')).toHaveText(/SEC\s+1 \/ 3/);
		await expect(page.locator('[data-fixture="toc-no-counter"] .toc-counter-text')).toHaveCount(0);
		await expect(page.locator('[data-fixture="toc-no-counter"] .toc-item')).toHaveCount(3);
	});

	for (const width of [320, 390, 768, 1024, 1440]) {
		test(`reading surfaces fit ${width}px in ${theme} with reduced motion`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await open(page, theme);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
			for (const lang of ['fr', 'es']) {
				await expect(page.locator(`[data-fixture="section-neutral-${lang}"] .section-title`)).toBeVisible();
				const card = page.locator(`[data-fixture="section-neutral-${lang}"] [data-slot="card"]`);
				const box = (await card.boundingBox())!;
				expect(box.x + box.width).toBeLessThanOrEqual(width);
			}
			const interactive = page.locator('[data-fixture="interactive-brand"]');
			await interactive.hover();
			await settle(page);
			expect((await frame(interactive)).transform).toBe('none');
		});
	}
}
