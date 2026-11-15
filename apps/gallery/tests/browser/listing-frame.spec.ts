import { expect, test, type Locator, type Page } from '@playwright/test';


const DESKTOP_MIN_WIDTH = 1024;

test('blueprint strokes follow scrolling and remain fully drawn under reduced motion', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Blueprint scrubbing is desktop only');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/listing-frame');
	if (await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)) {
		await page.addStyleTag({ content: 'body { min-height: 300vh; }' });
	}
	const path = page.locator('[data-slot="listing-frame"] .blueprint-bg svg path').first();
	const fraction = () => path.evaluate((element) => {
		const [drawn, total] = (element as SVGPathElement).style.strokeDasharray.split(',').map(parseFloat);
		return drawn / total;
	});
	await expect.poll(fraction).toBeGreaterThan(0);
	const initial = await fraction();
	await page.mouse.wheel(0, 800);
	await expect.poll(fraction).toBeGreaterThan(initial);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.reload();
	await expect.poll(() => path.evaluate((element) => (element as SVGPathElement).style.strokeDasharray)).toBe('');
});

test('header drawings keep the frame ink and copy has solid page-colour protection in each theme', async ({ page }) => {
	await page.goto('/listing-frame');
	const art = page.locator('[data-slot="blueprint-listing-art"]');
	const inks = new Map<string, number>();
	// No stored theme: the system's light scheme must pick the light ink, as it picks the light palette.
	for (const theme of ['dark', 'light', 'system light'] as const) {
		if (theme === 'system light') await page.emulateMedia({ colorScheme: 'light' });
		const { ink, drawings, background, shadows } = await art.evaluate((slot, theme) => {
			if (theme === 'system light') delete document.documentElement.dataset.theme;
			else document.documentElement.dataset.theme = theme;
			// An app's own opacity on a detail drawing must not count.
			for (const detail of slot.querySelectorAll<SVGElement>('.edge-detail')) detail.style.opacity = '0.9';
			// What a drawing shows: its own opacity times its wrappers' inside the slot.
			const rendered = (drawing: Element) => {
				let opacity = 1;
				for (let node: Element | null = drawing; node && node !== slot; node = node.parentElement) {
					opacity *= Number(getComputedStyle(node).opacity);
				}
				return opacity;
			};
			const content = slot.parentElement!.querySelector('[data-slot="blueprint-listing-content"]')!;
			const probe = document.createElement('span');
			probe.style.color = 'var(--background)';
			content.append(probe);
			const background = getComputedStyle(probe).color;
			probe.remove();
			return {
				ink: Number(getComputedStyle(slot).getPropertyValue('--blueprint-ink')),
				drawings: [...slot.querySelectorAll('svg')].map(rendered),
				background,
				shadows: [...content.querySelectorAll('h1, p, dt, dd')].map((copy) => getComputedStyle(copy).textShadow),
			};
		}, theme);
		expect(ink, theme).toBeGreaterThan(0);
		expect(drawings.length, theme).toBeGreaterThan(1);
		for (const opacity of drawings) expect(opacity, theme).toBeCloseTo(ink, 3);
		expect(shadows.length, theme).toBeGreaterThan(0);
		for (const shadow of shadows) expect(shadow, theme).toContain(`${background} 0px 0px 0px`);
		inks.set(theme, ink);
	}
	expect(inks.get('system light')).toBe(inks.get('light'));
});

test('the lowest header copy rests on the band floor, with or without an aside', async ({ page }) => {
	for (const aside of ['1', '0']) {
		await page.goto(`/listing-frame?aside=${aside}`);
		await expect(page.getByLabel('Totaux du catalogue')).toHaveCount(aside === '1' ? 1 : 0);
		await page.evaluate(() => document.fonts.ready);
		const gap = await page.locator('[data-slot="blueprint-listing-content"]').evaluate((content) => {
			const header = content.closest('[data-slot="blueprint-listing-header"]')!;
			const copy = [content.firstElementChild!.lastElementChild!, ...[...content.children].slice(1)];
			const lowest = Math.max(...copy.map((element) => element.getBoundingClientRect().bottom));
			return header.getBoundingClientRect().bottom - parseFloat(getComputedStyle(content).paddingBottom) - lowest;
		});
		expect(Math.abs(gap), `aside=${aside}`).toBeLessThanOrEqual(1);
	}
});

function listing(page: Page) {
	return {
		search: page.getByRole('textbox', { name: 'Rechercher' }),
		toggle: page.locator('[data-slot="listing-filter-toggle"]'),
		firstButton: page.locator('[data-slot="listing-filter-panel"] button').first(),
		clear: page.locator('[data-slot="clear-filters"]'),
	};
}

async function expectTabTo(page: Page, target: Locator): Promise<void> {
	await page.keyboard.press('Tab');
	await expect(target).toBeFocused();
}

test('filter panel is usable at this width', async ({ page, browser, baseURL }) => {
	const viewport = page.viewportSize()!;
	await page.goto('/listing-frame');
	const { search, toggle, firstButton, clear } = listing(page);

	if (viewport.width >= DESKTOP_MIN_WIDTH) {
		await expect(firstButton).toBeVisible();
		await search.focus();
		await expectTabTo(page, firstButton);

		const context = await browser.newContext({
			baseURL,
			javaScriptEnabled: false,
			reducedMotion: 'reduce',
			viewport,
		});
		const plain = await context.newPage();
		await plain.goto('/listing-frame');
		const plainListing = listing(plain);
		await expect(plainListing.firstButton).toBeVisible();
		await plainListing.search.focus();
		await expectTabTo(plain, plainListing.firstButton);
		await context.close();
		return;
	}

	await expect(firstButton).toBeHidden();
	await search.focus();
	await expectTabTo(page, toggle);
	await expectTabTo(page, clear);

	// Server controls exist before hydration wires their handlers. Wait for the real action.
	await expect(async () => {
		if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
	}).toPass();
	await expect(firstButton).toBeVisible();
	await expectTabTo(page, firstButton);

	// With motion on, the panel leaves the tab order once its close transition ends.
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await toggle.click();
	await expect(firstButton).toBeHidden();
	await toggle.focus();
	await expectTabTo(page, clear);

	// Reload restores the declared closed state; desktop CSS still keeps filters reachable.
	await toggle.click();
	await page.reload();
	await expect(listing(page).toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(listing(page).firstButton).toBeHidden();
	await page.setViewportSize({ width: 1280, height: 900 });
	await expect(listing(page).firstButton).toBeVisible();
});

test('edge title fits the viewport', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'The edge title is desktop only');
	const viewport = page.viewportSize()!;
	await page.goto('/listing-frame');
	await page.evaluate(() => document.fonts.ready);

	const box = await page.locator('[data-slot="listing-edge-title"] .edge-title').boundingBox();
	expect(box!.height).toBeLessThanOrEqual(viewport.height);
});

const ring = (locator: Locator) =>
	locator.evaluate((element) => {
		const style = getComputedStyle(element);
		const probe = document.createElement('span');
		probe.style.color = 'var(--primary)';
		document.body.append(probe);
		const primary = getComputedStyle(probe).color;
		probe.remove();
		return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor, shadow: style.boxShadow, primary };
	});

test('the search field shows the standard 2px focus ring, with no glow', async ({ page }) => {
	await page.goto('/listing-frame');
	const { search } = listing(page);
	await search.focus();
	await expect(search).toBeFocused();
	// The field's colour transition also eases the ring's colour in.
	await expect.poll(async () => { const focus = await ring(search); return focus.color === focus.primary; }).toBe(true);
	const focus = await ring(search);
	expect(focus.style).toBe('solid');
	expect(focus.width).toBe('2px');
	expect(focus.shadow).toBe('none');
});

test('one line parts the header from the list: no dashed rule above the search', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'The desktop filter column drew the dashed rule');
	await page.goto('/listing-frame');
	await expect(page.locator('[data-slot="listing-filter-search"]')).toHaveCSS('border-top-width', '0px');
});

test('with rule="dimension" one line parts the header from the list, in both presentations', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'The desktop filter column drew a second rule');
	for (const presentation of ['expressive', 'reading']) {
		await page.goto(`/listing-frame?rule=dimension&presentation=${presentation}`);
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		const frame = page.locator('[data-slot="listing-frame"]');
		await expect(frame).toHaveAttribute('data-rule', 'dimension');
		const rules = frame.locator('[data-slot="separator"], .listing-line');
		await expect(rules, presentation).toHaveCount(1);
		await expect(rules.first()).toHaveAttribute('data-testid', 'listing-page-separator');
		const search = page.locator('[data-slot="listing-filter-search"]');
		await expect(search.locator('[data-slot="separator"]'), presentation).toHaveCount(0);
		await expect(search).toHaveCSS('border-top-width', '0px');
	}
});

test('the phone Filters button keeps its focus ring', async ({ page }) => {
	test.skip(page.viewportSize()!.width >= DESKTOP_MIN_WIDTH, 'The Filters button shows below 1024px');
	await page.goto('/listing-frame');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	const { search, toggle } = listing(page);
	await search.focus();
	await expectTabTo(page, toggle);
	await expect.poll(async () => { const focus = await ring(toggle); return focus.color === focus.primary; }).toBe(true);
	const focus = await ring(toggle);
	expect(focus.style).toBe('solid');
	expect(focus.width).toBe('2px');
});

test('the result count is announced politely when the search or a filter changes it', async ({ page }) => {
	await page.goto('/listing-frame');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	const status = page.locator('[data-slot="listing-result-status"]');
	await expect(status).toHaveAttribute('role', 'status');
	await expect(status).toHaveText('3 résultats');
	const { search, toggle } = listing(page);
	await search.fill('audit');
	await expect(status).toHaveText('1 résultat');
	await search.fill('');
	await expect(status).toHaveText('3 résultats');
	if (page.viewportSize()!.width < DESKTOP_MIN_WIDTH) await toggle.click();
	await page.locator('[data-slot="listing-filter-panel"]').getByRole('radio', { name: 'Recherches' }).click();
	await expect(status).toHaveText('2 résultats');
	// Present before any filter, so a reader hears every change, not only the first one.
	await expect(page.getByRole('status').filter({ hasText: '2 résultats' })).toHaveCount(1);
});
