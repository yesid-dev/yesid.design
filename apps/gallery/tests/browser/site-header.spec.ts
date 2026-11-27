import { expectAccessible } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';

import {
	HOME,
	LABELS,
	LANGUAGE_LABEL,
	LINKS,
	LOCALES,
	LONG_MENU_LABELS,
	MENU_GROUP_LABELS,
	MENU_ITEMS,
	SEARCH_LABEL,
	languageHref,
} from '../../src/lib/gallery/site-header-fixture.js';

// The header width each link priority needs before it shows (the package's contract).
const SHOWN_FROM = { 1: 375, 2: 600, 3: 1024 } as const;
const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const header = (page: Page) => page.getByRole('navigation', { name: LABELS.nav });
const toggle = (page: Page) =>
	header(page).getByRole('button', { name: new RegExp(`^(${literal(LABELS.openMenu)}|${literal(LABELS.closeMenu)})$`) });
const menu = (page: Page) => page.getByRole('dialog', { name: LABELS.menu });
const menuLinks = (page: Page) => page.getByRole('navigation', { name: LABELS.menu });
// French pages put a no-break space before the colon; Playwright reads it as a space.
const language = (page: Page) => page.getByRole('link', { name: new RegExp(`^${literal(LANGUAGE_LABEL)}\\s?:`) });

async function visitHeader(page: Page, url = HOME) {
	await page.goto(url);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
}

// Delay the explicit universal load rather than a module Kit may have preloaded.
async function delayFixtureLoad(page: Page) {
	let requested!: () => void;
	let release!: () => void;
	const loading = new Promise<void>((resolve) => { requested = resolve; });
	const gate = new Promise<void>((resolve) => { release = resolve; });
	await page.route('**/navigation-lifecycle-gate.json?*', async (route) => {
		requested();
		await gate;
		await route.fulfill({ contentType: 'application/json', body: '{}' });
	});
	return { loading, release };
}

const routerFixture = (params: Record<string, string>) => `/navigation-lifecycle-fixture?${new URLSearchParams(params)}`;

test('links and search show at the header widths their priority allows', async ({ page }) => {
	const width = page.viewportSize()!.width;
	await visitHeader(page);

	for (const link of LINKS) {
		const shown = header(page).getByRole('link', { name: link.label, exact: true });
		await expect(shown).toBeVisible({ visible: width >= SHOWN_FROM[link.priority ?? 1] });
		if (link.current) await expect(shown).toHaveAttribute('aria-current', 'page');
	}
	await expect(header(page).getByRole('searchbox', { name: SEARCH_LABEL })).toBeVisible({ visible: width >= 1024 });
	await expect(language(page)).toHaveAttribute('href', languageHref(LOCALES[1]));
});

// One nav text size at every width: links 16px, wordmark 18px, and the pill stays on screen.
test('nav text keeps one size at every width and the pill fits the screen', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run resizes through every width');
	for (const width of [320, 360, 374, 375, 390, 500, 768, 1024, 1440]) {
		await page.setViewportSize({ width, height: 800 });
		await visitHeader(page);
		const sizes = await header(page).evaluate((nav) => {
			const pill = nav.getBoundingClientRect();
			const shown = [...nav.querySelectorAll<HTMLElement>('.nav-pill-link')].filter((link) => link.offsetWidth > 0);
			const wordmark = nav.querySelector<HTMLElement>('.nav-wordmark')!;
			return {
				links: [...new Set(shown.map((link) => getComputedStyle(link).fontSize))],
				wordmark: getComputedStyle(wordmark).fontSize,
				left: pill.left,
				right: pill.right,
			};
		});
		if (width >= SHOWN_FROM[1]) expect(sizes.links, `links at ${width}px`).toEqual(['16px']);
		else expect(sizes.links, `no header links below ${SHOWN_FROM[1]}px`).toEqual([]);
		expect(sizes.wordmark, `wordmark at ${width}px`).toBe('18px');
		expect(sizes.left, `pill left edge at ${width}px`).toBeGreaterThanOrEqual(0);
		expect(sizes.right, `pill right edge at ${width}px`).toBeLessThanOrEqual(width);
	}
});

// Below 360px the links leave at default text sizes; the controls' divider then keeps the brand off
// the first control. While links show, the wordmark-to-links divider is the only one.
test('the brand keeps a divider before the first control at 320px, and every pill fits', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets the phone width');
	await page.setViewportSize({ width: 320, height: 800 });
	const variants = [
		{ path: HOME, links: false },
		{ path: `${HOME}?brand=product`, links: false },
		{ path: `${HOME}?compact`, links: true },
		{ path: '/site-header-mixed', links: false },
		{ path: '/product-brand/en', links: false },
		{ path: '/app-frame/record-parts/en', links: false },
	];
	for (const { path, links } of variants) {
		await visitHeader(page, path);
		const fit = await page.getByTestId('nav-pill').evaluate((pill) => {
			const box = (element: Element) => element.getBoundingClientRect();
			const shown = (element: Element) => element.checkVisibility({ visibilityProperty: true }) && box(element).width > 0;
			const brand = pill.firstElementChild!;
			const first = [...pill.querySelectorAll('a, button')].find((control) => !brand.contains(control) && shown(control))!;
			return {
				gap: box(first).left - box(brand).right,
				split: Number.parseFloat(getComputedStyle(pill).getPropertyValue('--nav-split-space')),
				controlsDivider: shown(pill.querySelector('.nav-trailing > .nav-divider')!),
				left: box(pill).left,
				right: box(pill).right,
			};
		});
		expect(fit.gap, `${path}: space after the brand`).toBeGreaterThanOrEqual(2 * fit.split + 2);
		expect(fit.controlsDivider, `${path}: controls divider`).toBe(!links);
		expect(fit.left, `${path}: pill left edge`).toBeGreaterThanOrEqual(0);
		expect(fit.right, `${path}: pill right edge`).toBeLessThanOrEqual(320);
	}
});

// One divider space at every width, for the kit's `|` and for a product brand's own `|` inside
// the pill (owner live QA, 16 November 2026). Both sides of every divider take the same value.
test('every navbar divider keeps the same space on both sides, with a kit or product brand', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run resizes through both widths');
	const cases = [
		{ brand: false, long: false },
		{ brand: true, long: false },
		{ brand: false, long: true },
		{ brand: true, long: true },
	];
	for (const width of [390, 1440]) {
		for (const variant of cases) {
			const query = new URLSearchParams();
			if (variant.brand) query.set('brand', 'product');
			if (variant.long) query.set('nav', 'long');
			await page.setViewportSize({ width, height: 900 });
			await visitHeader(page, `${HOME}${query.toString() ? `?${query}` : ''}`);
			const where = `${width}px, ${variant.brand ? 'product' : 'kit'} brand, ${variant.long ? 'long' : 'short'} nav`;
			const spacing = await page.getByTestId('nav-pill').evaluate((nav) => {
				const shown = (node: Element) => node.checkVisibility({ visibilityProperty: true });
				const box = (node: Element) => node.getBoundingClientRect();
				const brand = nav.querySelector<HTMLElement>('[data-slot="product-brand"]');
				const brandDivider = nav.querySelector<HTMLElement>('.product-brand-divider');
				return {
					split: Number.parseFloat(getComputedStyle(nav).getPropertyValue('--nav-split-space')),
					dividers: [...nav.querySelectorAll<HTMLElement>('.nav-divider')].filter(shown).map((divider) => {
						const style = getComputedStyle(divider);
						return { left: Number.parseFloat(style.marginLeft), right: Number.parseFloat(style.marginRight) };
					}),
					brand: brand && brandDivider && shown(brandDivider)
						? {
								gap: Number.parseFloat(getComputedStyle(brand).columnGap),
								targets: [brand.querySelector('[data-slot="wordmark"]')!, brand.querySelector('[data-slot="product-brand-name"]')!]
									.map((target) => Math.min(box(target).width, box(target).height)),
							}
						: null,
					overflow: document.documentElement.scrollWidth > innerWidth,
					controls: [nav.querySelector('[role="switch"]')!, nav.querySelector('[data-testid="language-toggle"]')!]
						.filter((control): control is HTMLElement => control !== null)
						.map((control) => Math.min(box(control).width, box(control).height)),
				};
			});

			expect(spacing.split, where).toBe(width > 479 ? 20 : 4);
			expect(spacing.dividers.length, `${where}: at least one divider`).toBeGreaterThan(0);
			for (const divider of spacing.dividers) {
				expect(divider.left, `${where}: left side`).toBe(spacing.split);
				expect(divider.right, `${where}: right side`).toBe(spacing.split);
			}
			if (variant.brand) {
				expect(spacing.brand, where).not.toBeNull();
				expect(spacing.brand!.gap, `${where}: the product brand's | uses the same space`).toBe(spacing.split);
				for (const target of spacing.brand!.targets) expect(target, `${where}: 44px brand target`).toBeGreaterThanOrEqual(44);
			}
			for (const control of spacing.controls) expect(control, `${where}: 44px control target`).toBeGreaterThanOrEqual(44);
			expect(spacing.overflow, `${where}: the pill never overflows the page`).toBe(false);
		}
	}
});

// Labels differ by product and language, so links move to the menu whenever they don't fit.
test('header links move to the menu when their labels do not fit, and come back when they do', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets a phone width');
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.setViewportSize({ width: 390, height: 800 });
	await visitHeader(page);
	const link = header(page).getByRole('link', { name: LINKS[0].label, exact: true });
	await expect(link).toBeVisible();
	const pillFits = () => header(page).evaluate((nav) => {
		const box = nav.getBoundingClientRect();
		return box.left >= 0 && box.right <= innerWidth;
	});

	await link.evaluate((node) => { node.textContent = 'A header link label far too long for any phone'; });
	await expect(header(page).getByRole('link', { name: /far too long/ })).toBeHidden();
	expect(await pillFits()).toBe(true);

	await header(page).locator('.nav-pill-link').first().evaluate((node, label) => { node.textContent = label; }, LINKS[0].label);
	await expect(link).toBeVisible();
	expect(await pillFits()).toBe(true);
	expect(errors).toEqual([]);
});

test('the skip link is the first tab stop and moves focus into the main content', async ({ page }) => {
	await visitHeader(page);
	const skip = page.getByRole('link', { name: LABELS.skipToContent });
	await expect(skip).not.toBeInViewport();
	await page.keyboard.press('Tab');
	await expect(skip).toBeFocused();
	await expect(skip).toBeInViewport();
	await page.keyboard.press('Enter');
	await page.keyboard.press('Tab');
	await expect(page.getByRole('main').locator(':focus')).toHaveCount(1);
});

test('the menu opens with every item, traps focus and closes with Escape', async ({ page }) => {
	await visitHeader(page);
	await toggle(page).click();

	await expect(menu(page)).toBeVisible();
	await expect(toggle(page)).toBeFocused();
	await expect(toggle(page)).toHaveAccessibleName(LABELS.closeMenu);
	for (const item of MENU_ITEMS) {
		const link = menuLinks(page).getByRole('link', { name: item.ariaLabel ?? new RegExp(`^${literal(item.label)}`) });
		await expect(link).toBeVisible();
		if (item.external) await expect(link).toHaveAttribute('target', '_blank');
	}

	await page.keyboard.press('Shift+Tab');
	await expect(menu(page).locator(':focus')).toHaveCount(1);
	await page.keyboard.press('Escape');
	await expect(menu(page)).toBeHidden();
	await expect(toggle(page)).toBeFocused();
	await expect(toggle(page)).toHaveAccessibleName(LABELS.openMenu);
});

test('menu items carry icons and only the current item\'s icon is lit', async ({ page }) => {
	await visitHeader(page);
	await toggle(page).click();
	for (const item of MENU_ITEMS) {
		const icon = menuLinks(page).getByRole('link', { name: item.ariaLabel ?? new RegExp(`^${literal(item.label)}`) }).locator('svg');
		await expect(icon).toBeVisible();
		if (item.current) await expect(icon).not.toHaveCSS('fill', 'none');
		else await expect(icon).toHaveCSS('fill', 'none');
	}
});

test('a classless text link is underlined and readable in both themes; header links are not', async ({ page }) => {
	await visitHeader(page);
	const link = page.getByRole('paragraph').getByRole('link');
	await expect(link).toBeVisible();
	for (const colorScheme of ['dark', 'light'] as const) {
		const result = await page.evaluate(({ link, colorScheme }) => {
			document.documentElement.dataset.theme = colorScheme;
			const context = document.createElement('canvas').getContext('2d')!;
			const rgba = (color: string) => {
				context.clearRect(0, 0, 1, 1);
				context.fillStyle = color;
				context.fillRect(0, 0, 1, 1);
				return Array.from(context.getImageData(0, 0, 1, 1).data);
			};
			const luminance = (rgb: number[]) => rgb.slice(0, 3).reduce((sum, value, i) => {
				const c = value / 255;
				return sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i]!;
			}, 0);
			let ancestor = link!.parentElement;
			while (ancestor && rgba(getComputedStyle(ancestor).backgroundColor)[3] === 0) ancestor = ancestor.parentElement;
			if (!ancestor) throw new Error('No non-transparent link background');
			const style = getComputedStyle(link!);
			const foreground = luminance(rgba(style.color));
			const background = luminance(rgba(getComputedStyle(ancestor).backgroundColor));
			return { decoration: style.textDecorationLine, contrast: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05) };
		}, { link: await link.elementHandle(), colorScheme });
		expect(result.decoration).toContain('underline');
		expect(result.contrast).toBeGreaterThanOrEqual(4.5);
		await expect(header(page).getByRole('link', { name: LINKS[0]!.label, exact: true })).toHaveCSS('text-decoration-line', 'none');
	}
});

test('a language switch from the open menu keeps it open', async ({ page }) => {
	await visitHeader(page);
	await toggle(page).click();
	await language(page).click();

	await expect(page).toHaveURL(new RegExp(`lang=${LOCALES[1]}$`));
	await expect(menu(page)).toBeVisible();
	await expect(language(page)).toBeFocused();
	await expect(language(page)).toHaveAttribute('href', languageHref(LOCALES[0]));
	await page.keyboard.press('Escape');
	await expect(menu(page)).toBeHidden();
	await expect(toggle(page)).toBeFocused();
});

test('a state-preserving language switch from the closed header resets page focus', async ({ page }) => {
	await visitHeader(page);
	await language(page).click();
	await expect(page).toHaveURL(new RegExp(`lang=${LOCALES[1]}$`));
	await expect(menu(page)).toBeHidden();
	await expect(page.locator('body')).toBeFocused();
});

test.describe('Kit 3 hook-only navigation', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });
	const fallbackHome = `${HOME}?initial=true`;

	test('a direct language link keeps the menu open and focuses its updated link', async ({ page }) => {
		await visitHeader(page, fallbackHome);
		await toggle(page).click();
		await language(page).click();
		await expect(page).toHaveURL(new RegExp(`lang=${LOCALES[1]}$`));
		await expect(menu(page)).toBeVisible();
		await expect(language(page)).toBeFocused();
		await expect(language(page)).toHaveAttribute('href', languageHref(LOCALES[0]));
	});

	test('an eventless language redirect closes the menu without locale focus or stale intent', async ({ page }) => {
		await visitHeader(page, fallbackHome);
		await toggle(page).click();
		await language(page).evaluate((node, href) => node.setAttribute('href', href), routerFixture({ redirect: 'locale' }));
		await language(page).click();
		await expect(page).toHaveURL((url) => url.searchParams.get('landed') === 'locale');
		await expect(menu(page)).toBeHidden();
		await expect(language(page)).not.toBeFocused();
		await toggle(page).click();
		const ordinary = header(page).getByRole('link').first();
		await ordinary.evaluate((node, href) => node.setAttribute('href', href), routerFixture({ redirect: 'ordinary' }));
		await ordinary.click();
		await expect(page).toHaveURL((url) => url.searchParams.get('landed') === 'ordinary');
		await expect(menu(page)).toBeHidden();
		await expect(language(page)).not.toBeFocused();
	});

	test('an eventless redirect from a closed state-preserving language link resets page focus', async ({ page }) => {
		await visitHeader(page, fallbackHome);
		await language(page).evaluate((node, href) => node.setAttribute('href', href), routerFixture({ redirect: 'locale' }));
		await language(page).click();
		await expect(page).toHaveURL((url) => url.searchParams.get('landed') === 'locale');
		await expect(menu(page)).toBeHidden();
		await expect(page.locator('body')).toBeFocused();
	});

	test('an ordinary navigation closes the menu and completes', async ({ page }) => {
		await visitHeader(page, fallbackHome);
		await toggle(page).click();
		await header(page).getByRole('link').first().click();
		await expect(page).toHaveURL((url) => url.pathname === HOME && url.search === '');
		await expect(menu(page)).toBeHidden();
	});

	for (const initial of ['locale', 'ordinary'] as const) {
		test(`a redirect superseding a slow ${initial} navigation closes a reopened menu`, async ({ page }) => {
			await visitHeader(page, fallbackHome);
			const delay = await delayFixtureLoad(page);
			try {
				await toggle(page).click();
				const ordinary = header(page).getByRole('link').first();
				const first = initial === 'locale' ? language(page) : ordinary;
				await first.evaluate((node, href) => node.setAttribute('href', href), routerFixture({ delay: initial }));
				await first.click({ noWaitAfter: true });
				await delay.loading;
				if (initial === 'ordinary') {
					await expect(menu(page)).toBeHidden();
					await toggle(page).click();
				}
				await expect(menu(page)).toBeVisible();
				const second = initial === 'locale' ? ordinary : language(page);
				const destination = initial === 'locale' ? 'ordinary' : 'locale';
				await second.evaluate((node, href) => node.setAttribute('href', href), routerFixture({ redirect: destination }));
				await second.click();
				await expect(page).toHaveURL((url) => url.searchParams.get('landed') === destination);
				await expect(menu(page)).toBeHidden();
				await expect(language(page)).not.toBeFocused();
			} finally {
				delay.release();
				await page.unrouteAll({ behavior: 'wait' });
			}
		});
	}
});

test.describe('with motion on', () => {
	test.use({ contextOptions: { reducedMotion: 'no-preference' } });

	// Reuses the independent review's review-146.spec.ts reproduction.
	for (const variant of [
		{ name: 'preventDefault', stopped: false, reload: false },
		{ name: 'preventDefault+stopPropagation', stopped: true, reload: false },
		{ name: 'cancelled reload link', stopped: true, reload: true },
	]) {
		test(`an app-cancelled trusted locale click cannot poison an ordinary redirect: ${variant.name}`, async ({ page }) => {
			await visitHeader(page);
			const delay = await delayFixtureLoad(page);
			try {
				await toggle(page).click();
				const ordinary = header(page).getByRole('link').first();
				await ordinary.evaluate((node, href) => node.setAttribute('href', href), routerFixture({ delay: 'ordinary', redirect: 'ordinary' }));
				await ordinary.click({ noWaitAfter: true });
				await delay.loading;
				await expect(menu(page)).toBeHidden();
				await toggle(page).click();
				await expect(menu(page)).toBeVisible();
				await language(page).evaluate((node, { stopped, reload }) => {
					if (reload) node.setAttribute('data-sveltekit-reload', 'true');
					node.addEventListener('click', (event) => {
						event.preventDefault();
						if (stopped) event.stopPropagation();
					}, { once: true });
				}, variant);
				await page.evaluate(() => {
					window.addEventListener('click', (event) => { document.documentElement.dataset.nativeClickTrusted = String(event.isTrusted); }, { once: true, capture: true });
				});
				await language(page).click();
				await expect(page.locator('html')).toHaveAttribute('data-native-click-trusted', 'true');
				delay.release();
				await expect(page).toHaveURL((url) => url.pathname === HOME && url.searchParams.get('landed') === 'ordinary');
				await expect(menu(page)).toBeHidden();
				await expect(language(page)).not.toBeFocused();
			} finally {
				delay.release();
				await page.unrouteAll({ behavior: 'wait' });
			}
		});
	}

	test('keyboard Enter on an eventless locale redirect closes the menu', async ({ page }) => {
		await visitHeader(page);
		await toggle(page).click();
		await language(page).evaluate((node, href) => {
			node.setAttribute('href', href);
			node.focus();
		}, routerFixture({ redirect: 'locale' }));
		await page.evaluate(() => {
			window.addEventListener('click', (event) => { document.documentElement.dataset.nativeClickTrusted = String(event.isTrusted); }, { once: true, capture: true });
		});
		await page.keyboard.press('Enter');
		await expect(page.locator('html')).toHaveAttribute('data-native-click-trusted', 'true');
		await expect(page).toHaveURL((url) => url.searchParams.get('landed') === 'locale');
		await expect(menu(page)).toBeHidden();
		await expect(page.locator('body')).toBeFocused();
	});

	test('a trusted eventless locale redirect closes the menu and resets focus', async ({ page }) => {
		await visitHeader(page);
		await toggle(page).click();
		await language(page).evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ redirect: 'locale' }));
		await page.evaluate(() => {
			window.addEventListener('click', (event) => { document.documentElement.dataset.nativeClickTrusted = String(event.isTrusted); }, { once: true });
		});
		await language(page).click();
		await expect(page.locator('html')).toHaveAttribute('data-native-click-trusted', 'true');
		await expect(page).toHaveURL((url) => url.pathname === HOME && url.searchParams.get('lang') === LOCALES[1] && url.searchParams.get('landed') === 'locale');
		await expect(menu(page)).toBeHidden();
		await expect(page.locator('body')).toBeFocused();
		await expect(language(page)).toHaveAttribute('href', languageHref(LOCALES[0]));
	});

	test('an eventless locale redirect after a slow ordinary load closes a reopened menu', async ({ page }) => {
		await visitHeader(page);
		const delay = await delayFixtureLoad(page);
		try {
			await toggle(page).click();
			const ordinary = header(page).getByRole('link').first();
			await ordinary.evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ delay: 'ordinary' }));
			await ordinary.click({ noWaitAfter: true });
			await delay.loading;
			await expect(menu(page)).toBeHidden();
			await toggle(page).click();
			await expect(menu(page)).toBeVisible();
			await language(page).evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ redirect: 'locale' }));
			await page.evaluate(() => {
				window.addEventListener('click', (event) => { document.documentElement.dataset.nativeClickTrusted = String(event.isTrusted); }, { once: true });
			});
			await language(page).click();
			await expect(page.locator('html')).toHaveAttribute('data-native-click-trusted', 'true');
			await expect(page).toHaveURL((url) => url.pathname === HOME && url.searchParams.get('lang') === LOCALES[1] && url.searchParams.get('landed') === 'locale');
			await expect(menu(page)).toBeHidden();
			await expect(page.locator('body')).toBeFocused();
			await expect(language(page)).toHaveAttribute('href', languageHref(LOCALES[0]));
		} finally {
			delay.release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});

	test('an ordinary redirect superseding a slow locale switch closes the menu', async ({ page }) => {
		await visitHeader(page);
		const delay = await delayFixtureLoad(page);
		try {
			await language(page).evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ delay: 'locale' }));
			await toggle(page).click();
			await language(page).click({ noWaitAfter: true });
			await delay.loading;
			await expect(menu(page)).toBeVisible();
			// The wordmark is an ordinary link without a menu-item close handler.
			const ordinary = header(page).getByRole('link').first();
			await ordinary.evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ redirect: 'ordinary' }));
			await ordinary.click({ noWaitAfter: true });
			await expect(page).toHaveURL((url) => url.pathname === HOME && url.searchParams.get('landed') === 'ordinary');
			await expect(menu(page)).toBeHidden();
			await expect(language(page)).not.toBeFocused();
		} finally {
			delay.release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});

	test('a redirected locale switch superseding a slow ordinary navigation resets focus', async ({ page }) => {
		await visitHeader(page);
		const delay = await delayFixtureLoad(page);
		try {
			await toggle(page).click();
			const ordinary = header(page).getByRole('link').first();
			await ordinary.evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ delay: 'ordinary' }));
			await ordinary.click({ noWaitAfter: true });
			await delay.loading;
			await expect(menu(page)).toBeHidden();
			await language(page).evaluate((node, href) => { node.setAttribute('href', href); }, routerFixture({ redirect: 'locale' }));
			await language(page).click({ noWaitAfter: true });
			await expect(page).toHaveURL((url) => url.pathname === HOME && url.searchParams.get('lang') === LOCALES[1] && url.searchParams.get('landed') === 'locale');
			await expect(page.locator('body')).toBeFocused();
		} finally {
			delay.release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});

	test('a slow navigation re-closes a menu reopened after its first close completes', async ({ page }) => {
		await visitHeader(page);
		const delay = await delayFixtureLoad(page);
		try {
			await toggle(page).click();
			const target = MENU_ITEMS.find((item) => !item.external && !item.current)!;
			const link = menuLinks(page).getByRole('link', { name: new RegExp(`^${literal(target.label)}`) });
			await link.evaluate((node, href) => {
				node.setAttribute('href', href);
				node.setAttribute('data-sveltekit-preload-data', 'false');
			}, routerFixture({ delay: 'ordinary' }));
			await link.click({ noWaitAfter: true });
			await delay.loading;
			await expect(menu(page)).toBeHidden();
			await toggle(page).click();
			await expect(menu(page)).toBeVisible();
			delay.release();
			await expect(page).toHaveURL((url) => url.pathname === '/navigation-lifecycle-fixture');
			await expect(menu(page)).toBeHidden();
		} finally {
			delay.release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});

	test('a locale click superseding a slow navigation resets focus without another beforeNavigate', async ({ page }) => {
		await visitHeader(page);
		const delay = await delayFixtureLoad(page);
		try {
			await toggle(page).click();
			const target = MENU_ITEMS.find((item) => !item.external && !item.current)!;
			const link = menuLinks(page).getByRole('link', { name: new RegExp(`^${literal(target.label)}`) });
			await link.evaluate((node, href) => {
				node.setAttribute('href', href);
				node.setAttribute('data-sveltekit-preload-data', 'false');
			}, routerFixture({ delay: 'ordinary' }));
			await link.click({ noWaitAfter: true });
			await delay.loading;
			await expect(menu(page)).toBeHidden();
			await language(page).click();
			await expect(page).toHaveURL(new RegExp(`lang=${LOCALES[1]}$`));
			await expect(page.locator('body')).toBeFocused();
		} finally {
			delay.release();
			await page.unrouteAll({ behavior: 'wait' });
		}
	});

	test('a menu link closes the menu and navigates', async ({ page }) => {
		const target = MENU_ITEMS.find((item) => !item.external && !item.current)!;
		await visitHeader(page);
		await toggle(page).click();
		await menuLinks(page).getByRole('link', { name: new RegExp(`^${literal(target.label)}`) }).click();

		await expect(page).toHaveURL((url) => url.pathname === target.href);
		await expect(menu(page)).toBeHidden();
	});

	test('Back with the menu open closes it, returns to the previous entry and releases the scroll lock', async ({ page }) => {
		await visitHeader(page);
		const overflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
		await language(page).click();
		await expect(page).toHaveURL(new RegExp(`lang=${LOCALES[1]}$`));
		await toggle(page).click();
		await expect(menu(page)).toBeVisible();
		await page.goBack();

		await expect(page).toHaveURL((url) => url.pathname === HOME && !url.search);
		await expect(menu(page)).toBeHidden();
		await expect(page.locator('body')).toHaveCSS('overflow', overflow);
	});

	test('reopening while the menu closes keeps the same menu open, and the pill stays clickable above it', async ({ page }) => {
		await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
		await visitHeader(page);
		await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
		await toggle(page).click();
		await page.clock.runFor(100);
		const list = await menuLinks(page).elementHandle();
		await toggle(page).click();
		await toggle(page).click();
		await page.clock.runFor(1000);

		await expect(menu(page)).toBeVisible();
		await expect(toggle(page)).toHaveAttribute('aria-expanded', 'true');
		expect(await list!.evaluate((node) => node.isConnected)).toBe(true);
	});
});

test.describe('in a short viewport', () => {
	test.use({ viewport: { width: 390, height: 320 } });

	test('the wheel scrolls the menu while the page stays put', async ({ page }) => {
		await visitHeader(page);
		const pageScroll = await page.evaluate(() => window.scrollY);
		await toggle(page).click();
		const list = menuLinks(page);
		await list.hover();
		await page.mouse.wheel(0, 400);

		await expect.poll(() => list.evaluate((nav) => nav.parentElement!.scrollTop)).toBeGreaterThan(0);
		expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
	});
});

for (const width of [390, 599, 600, 1024, 1440]) {
	test(`grouped compact shell at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await visitHeader(page, `${HOME}?compact`);
		await header(page).getByRole('button', { name: SEARCH_LABEL, exact: true }).click();
		await expect(page.getByRole('searchbox', { name: 'Search destinations' })).toBeFocused();
		await expect(page.getByRole('contentinfo').locator('[data-slot="status-dot"], .footer-status-border')).toHaveCount(0);
		await expect(header(page).getByRole('switch', { name: LABELS.theme })).toHaveCount(width < 600 ? 0 : 1);
		await toggle(page).click();
		await expect(menu(page).getByRole('heading', { name: LABELS.menu, level: 2 })).toHaveCount(1);
		await expect(menuLinks(page).getByRole('heading', { level: 3 })).toHaveText(['Explore routes', 'More destinations']);
		await expect(page.getByRole('switch', { name: LABELS.theme })).toHaveCount(1);
		await expect(language(page)).toHaveCount(1);
		await expect(language(page)).toHaveAttribute('data-sveltekit-reset', 'false');
		await expect(header(page).getByRole('switch')).toHaveCount(width < 600 ? 0 : 1);
		if (width < 600) {
			const controls = menu(page).locator('.menu-controls');
			await expect(controls.getByText(LABELS.theme, { exact: true })).toHaveAttribute('aria-hidden', 'true');
			await expect(controls.getByText('Language: English / Français', { exact: true })).toHaveAttribute('aria-hidden', 'true');
			await expect(controls.getByRole('switch')).toHaveAccessibleName(LABELS.theme);
			await expect(language(page)).toHaveAccessibleName('Language: English / Français: Français (EN FR)');
			const accessible = await controls.ariaSnapshot();
			expect(accessible.split(LABELS.theme)).toHaveLength(2);
			expect(accessible.split('Language: English / Français')).toHaveLength(2);
			await expect(menu(page).getByText(LABELS.theme, { exact: true })).toBeVisible();
			await expect(menu(page).getByText('Language: English / Français', { exact: true })).toBeVisible();
		}
		await expectAccessible(page);
		await expect(page.locator('.menu-overlay')).toHaveCSS('transition-duration', '0s');
		await toggle(page).focus();
		for (const item of MENU_ITEMS) {
			await page.keyboard.press('Tab');
			await expect(menuLinks(page).getByRole('link', { name: item.ariaLabel ?? new RegExp(`^${literal(item.label)}`) })).toBeFocused();
		}
		await language(page).click();
		await expect(menu(page)).toBeVisible();
		await expect(language(page)).toBeFocused();
		// On the French page the same link now leads back to English.
		await expect(language(page)).toHaveAccessibleName(/: English \(EN FR\)$/);
		await page.keyboard.press('Escape');
		await expect(menu(page)).toBeHidden();
		await expect(toggle(page)).toBeFocused();
	});
}

test('grouped menus use one organized column per group on desktop and one column on phones', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets every width, group count and language');
	const cases = [
		{ count: 2 as const, locale: 'en', width: 390, columns: 1 },
		{ count: 4 as const, locale: 'fr', width: 390, columns: 1 },
		{ count: 2 as const, locale: 'en', width: 1440, columns: 2 },
		{ count: 4 as const, locale: 'fr', width: 1440, columns: 4 },
	];
	for (const { count, locale, width, columns } of cases) {
		const where = `${count} groups, ${locale}, ${width}px`;
		await page.setViewportSize({ width, height: 900 });
		await visitHeader(page, `${HOME}?groups=${count}&lang=${locale}`);
		const largeText = width < 600;
		if (largeText) await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
		try {
			await toggle(page).click();
			await expect(menu(page)).toBeVisible();
			const nav = menuLinks(page);
			const labels = MENU_GROUP_LABELS[locale as 'en' | 'fr'][count];
			await expect(nav.getByRole('heading', { level: 3 })).toHaveText([...labels]);

			const layout = await nav.evaluate((node) => {
				const groups = [...node.querySelectorAll<HTMLElement>('[data-slot="menu-group"]')];
				const box = (group: HTMLElement) => group.getBoundingClientRect();
				return {
					lefts: [...new Set(groups.map((group) => Math.round(box(group).left)))].sort((a, b) => a - b),
					tops: groups.map((group) => Math.round(box(group).top)),
					pairs: groups.map((group) => {
						const heading = group.querySelector('h3')!;
						const list = group.querySelector('ul')!;
						return {
							heading: heading.textContent,
							labelledby: list.getAttribute('aria-labelledby'),
							id: heading.id,
							next: heading.nextElementSibling === list,
							links: [...list.querySelectorAll('a')].map((link) => link.getAttribute('href')),
						};
					}),
					hrefs: [...node.querySelectorAll<HTMLAnchorElement>('.menu-item')].map((link) => link.getAttribute('href')),
					overflow: document.documentElement.scrollWidth > innerWidth,
				};
			});

			expect(layout.lefts, `${where}: organized columns`).toHaveLength(columns);
			expect(new Set(layout.tops).size, `${where}: groups share the row or stack`).toBe(width < 768 ? count : 1);
			for (const [index, pair] of layout.pairs.entries()) {
				expect(pair.heading, `${where}: heading ${index}`).toBe(labels[index]);
				expect(pair.next, `${where}: heading ${index} labels its list`).toBe(true);
				expect(pair.labelledby, `${where}: list ${index}`).toBe(pair.id);
				expect(pair.links.length, `${where}: group ${index} keeps its items`).toBeGreaterThan(0);
			}
			expect(layout.hrefs, `${where}: reading order across groups`).toEqual(MENU_ITEMS.map((item) => item.href));
			expect(layout.overflow, `${where}: no horizontal overflow`).toBe(false);
			for (const label of labels) await expect(nav.getByRole('list', { name: label })).toHaveCount(1);
			await expect(page.getByRole('switch', { name: LABELS.theme })).toHaveCount(1);
			await expect(language(page)).toHaveCount(1);

			await toggle(page).focus();
			for (const item of MENU_ITEMS) {
				await page.keyboard.press('Tab');
				await expect(nav.getByRole('link', { name: item.ariaLabel ?? new RegExp(`^${literal(item.label)}`) })).toBeFocused();
			}
			await page.keyboard.press('Escape');
			await expect(menu(page)).toBeHidden();
			await expect(toggle(page)).toBeFocused();
		} finally {
			if (largeText) await page.evaluate(() => { document.documentElement.style.removeProperty('font-size'); });
		}
	}
});

for (const theme of ['dark', 'light'] as const) {
	test(`four grouped columns keep their layout and accessibility in the ${theme} theme`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers both themes');
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`${HOME}?groups=4&lang=fr`);
		await page.evaluate((value) => localStorage.setItem('theme', value), theme);
		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await toggle(page).click();
		const nav = menuLinks(page);
		const tops = await nav.evaluate((node) =>
			[...node.querySelectorAll<HTMLElement>('[data-slot="menu-group"]')].map((group) => Math.round(group.getBoundingClientRect().top)),
		);
		expect(new Set(tops).size, `${theme}: one row of columns`).toBe(1);
		await expect(nav.getByRole('heading', { level: 3 })).toHaveText([...MENU_GROUP_LABELS.fr[4]]);
		await expectAccessible(page);
	});
}

for (const locale of LOCALES) {
	test(`${locale}: grouped columns center with equal gaps and keep long destination labels on one line`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run covers every desktop width');
		await page.setViewportSize({ width: 1024, height: 900 });
		await visitHeader(page, `${HOME}?groups=4&long-menu&lang=${locale}`);
		await toggle(page).click();
		const nav = menuLinks(page);
		await expect(nav.locator('.menu-label')).toHaveText([...LONG_MENU_LABELS[locale]]);
		await page.evaluate(() => document.fonts.ready);
		let gap: number | undefined;
		let wideColumns: number[] = [];
		for (const width of [1024, 1280, 1440, 1920]) {
			await page.setViewportSize({ width, height: 900 });
			const { rows, lines, viewport } = await nav.evaluate((node) => {
				const columns = [...node.querySelectorAll('[data-slot="menu-group"]')].map((group) => {
					const { top, left, right, width } = group.getBoundingClientRect();
					return { top, left, right, width };
				});
				const tops = new Set(columns.map((column) => column.top));
				return {
					rows: [...tops].map((top) => columns.filter((column) => column.top === top)),
					lines: [...node.querySelectorAll('.menu-label')].map((label) => {
						const range = document.createRange();
						range.selectNodeContents(label);
						return range.getClientRects().length;
					}),
					viewport: document.documentElement.clientWidth,
				};
			});
			if (width >= 1280) expect(rows, `groups share one row at ${width}px`).toHaveLength(1);
			for (const row of rows) {
				const left = row[0]!.left;
				const right = viewport - row.at(-1)!.right;
				expect(Math.abs(left - right), `outer space at ${width}px`).toBeLessThanOrEqual(1);
				if (width >= 1280) expect(left, `outer inset at ${width}px`).toBeGreaterThan(24);
				for (const [index, column] of row.slice(1).entries()) {
					const actualGap = column.left - row[index]!.right;
					gap ??= actualGap;
					expect(actualGap, `column gap at ${width}px`).toBeGreaterThan(0);
					expect(Math.abs(actualGap - gap), `equal gaps at ${width}px`).toBeLessThanOrEqual(1);
				}
			}
			expect(lines, `label lines at ${width}px`).toEqual([1, 1, 1, 1]);
			if (width === 1440) wideColumns = rows[0]!.map((column) => column.width);
			if (width === 1920) expect(rows[0]!.map((column) => column.width)).toEqual(wideColumns);
		}
	});
}

test('grouped labels wrap when enlarged text exceeds the desktop menu width', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets the viewport width and text scale');
	await page.setViewportSize({ width: 768, height: 900 });
	await visitHeader(page, `${HOME}?groups=4&long-menu`);
	await toggle(page).click();
	await page.evaluate(() => document.fonts.ready);
	await page.locator('html').evaluate((node) => { node.style.fontSize = '300%'; });
	const nav = menuLinks(page);
	const range = await nav.getByText(LONG_MENU_LABELS.en[1], { exact: true }).evaluate((node) => {
		const text = document.createRange();
		text.selectNodeContents(node);
		return [...text.getClientRects()].map(({ left, right }) => ({ left, right }));
	});
	expect(range.length).toBeGreaterThan(1);
	for (const { left, right } of range) {
		expect(left).toBeGreaterThanOrEqual(0);
		expect(right).toBeLessThanOrEqual(768);
	}
	const { scrollWidth, clientWidth } = await nav.evaluate((node) => ({
		scrollWidth: node.scrollWidth,
		clientWidth: node.clientWidth,
	}));
	expect(scrollWidth).toBe(clientWidth);
	await page.keyboard.press('Escape');
	await expect(toggle(page)).toBeFocused();
});

test('compact placement follows the header container and adapts while open', async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 });
	await visitHeader(page, `${HOME}?compact`);
	await toggle(page).click();
	for (const width of [599, 600, 390, 1024]) {
		await page.locator('[data-slot="site-header"]').evaluate((node, width) => node.style.setProperty('--site-header-inset-end', `${1024 - width}px`), width);
		await expect(header(page).getByRole('switch')).toHaveCount(width < 600 ? 0 : 1);
		await expect(page.getByRole('switch', { name: LABELS.theme })).toHaveCount(1);
		await expect(language(page)).toHaveCount(1);
	}
});

test('group entrance delays follow reading order while metro lines stop at group boundaries', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await visitHeader(page, `${HOME}?compact`);
	await toggle(page).click();
	const items = menuLinks(page).getByRole('link');
	for (const [index, delay] of ['0s', '0.04s', '0.08s', '0.12s'].entries()) {
		await expect(items.nth(index)).toHaveCSS('transition-delay', `${delay}, ${delay}, 0s`);
	}
	for (const group of await menuLinks(page).getByRole('list').all()) {
		await expect(group.getByRole('link').last().locator('.menu-line')).toHaveCount(0);
	}
});

for (const width of [390, 1440]) {
    test(`scrambled three-language header follows the brand order at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await visitHeader(page, `${HOME}?scrambled&compact`);
        if (width < 600) await toggle(page).click();
        // Each page names the link by the language it leads to, in that language, with no live region.
        // The French page puts a no-break space before the colon.
        for (const [destination, next, colon] of [['Français', 'fr', ': '], ['Español', 'es', '\u00a0: '], ['English', 'en', ': ']]) {
            const control = language(page);
            const href = `${languageHref(next)}&scrambled&compact`;
            const name = width < 600
                ? `Language: English / Français / Español${colon}${destination} (EN FR ES)`
                : `Language${colon}${destination} (EN FR ES)`;
            await expect(control.locator('svg text')).toHaveText(['EN', 'FR', 'ES']);
            await expect(control).toHaveAttribute('href', href);
            await expect(control).toHaveAttribute('hreflang', next);
            await expect(control).toHaveAccessibleName(name);
            // The snapshot reads the no-break space as a space; language-toggle.spec.ts checks it in Chromium's own tree.
            expect(await control.ariaSnapshot()).toBe(`- 'link "${name.replace(/\s/g, ' ')}"':\n  - /url: ${href}`);
            await expect(control.locator(`[lang="${next}"]`)).toHaveText(destination);
            await expect(control.locator('[aria-live], [role="status"], [role="alert"]')).toHaveCount(0);
            await control.click();
            await expect(page).toHaveURL(url => url.searchParams.get('lang') === next);
        }
    });
}
