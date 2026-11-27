import { expect, test, type Page } from '@playwright/test';

// Cover every Gallery route, including indirect callers through page frames.
const routes = [
	'/', '/error-page', '/station-tabs', '/site-header', '/site-header-compact',
	'/detail-frame', '/data-page', '/button-focus', '/sections', '/sections/late',
	'/sections/next', '/sections/single', '/navigation-lifecycle-fixture',
	'/density', '/listing-frame', '/masthead', '/error-page/small-after.no-label.no-tape.en',
	'/product-brand', '/site-header-pill/es', '/loading-states',
];

function unexpected(page: Page, afterRest: boolean) {
	return page.evaluate((settled) => {
		return document.getAnimations().flatMap((animation) => {
			const effect = animation.effect;
			const target = effect instanceof KeyframeEffect ? effect.target : null;
			// Skeleton is the only loading animation supplied by this package.
			// Both its identity and the caller's current busy state are required.
			if (target instanceof Element &&
				target.matches('[data-slot="skeleton"]') &&
				(target.hasAttribute('data-skeleton-busy') || target.closest('[aria-busy="true"]'))) return [];
			const infinite = effect?.getTiming().iterations === Infinity;
			const statusLamp = target instanceof Element &&
				target.matches('[data-slot="status-dot"], .led-pulse');
			if (!infinite && !statusLamp && (!settled || animation.playState !== 'running')) return [];
			return [{
				name: animation instanceof CSSAnimation ? animation.animationName : animation.id,
				target: target instanceof Element ? target.outerHTML.slice(0, 200) : null,
				state: animation.playState,
			}];
		});
	}, afterRest);
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
	test.describe(reducedMotion, () => {
		test.use({ contextOptions: { reducedMotion } });
		// Every route loads in its own page of one context, so all of them share one six-second rest.
		test('decoration settles on every Gallery route', async ({ context }) => {
			const pages = await Promise.all(routes.map(async (route) => {
				const page = await context.newPage();
				const response = await page.goto(route);
				expect(response?.ok(), `${route} must load successfully`).toBe(true);
				await page.evaluate(() => document.fonts.ready);
				await expect(page.locator('body'), route).toBeVisible();
				expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), route)
					.toBe(reducedMotion === 'reduce');
				expect.soft(await unexpected(page, false), `${route}: no infinite decoration or pulsing lamps after load`)
					.toEqual([]);
				return { route, page };
			}));
			await pages[0]!.page.waitForTimeout(6000);
			for (const { route, page } of pages) {
				expect.soft(await unexpected(page, true), `${route}: no decoration running after six seconds`).toEqual([]);
			}

			const home = pages.find(({ route }) => route === '/')!.page;
			const loading = home.locator('[data-gallery-state="loading"][aria-busy="true"]');
			const animations = await loading.evaluate((region) => region.getAnimations({ subtree: true }).length);
			if (reducedMotion === 'reduce') expect(animations).toBe(0);
			else expect(animations).toBeGreaterThan(0);
			await loading.evaluate((region) => region.setAttribute('aria-busy', 'false'));
			await expect.poll(() => home.locator('[data-gallery-state="loading"]')
				.evaluate((region) => region.getAnimations({ subtree: true }).length)).toBe(0);
		});
	});
}
