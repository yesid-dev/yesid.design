import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

function headerBoxes(page: Page) {
	return page.evaluate(() => {
		const header = document.querySelector('[data-slot="site-header"]')!;
		const box = (selector: string) => {
			const rect = header.querySelector(selector)!.getBoundingClientRect();
			const round = (value: number) => Math.round(value * 10) / 10;
			return { x: round(rect.x), right: round(rect.right), y: round(rect.y), height: round(rect.height) };
		};
		return {
			pill: box('[data-testid="nav-pill"]'),
			search: box('input[type="search"]'),
			picker: box('[data-slot="network-picker"]'),
			theme: box('[data-testid="theme-toggle"]'),
			language: box('[data-testid="language-toggle"]'),
		};
	});
}

test.describe('Network header first paint', { tag: '@theme' }, () => {
	for (const lang of ['en', 'fr']) {
		for (const refresh of ['refresh', 'quiet']) {
			for (const width of [390, 1024, 1206, 1280, 1440]) {
				test(`${lang} at ${width}px with ${refresh} keeps the header still through hydration`, async ({ page }) => {
					await page.setViewportSize({ width, height: 900 });
					const inline = width >= 1024;
					let resume!: () => void;
					const held = new Promise<void>((resolve) => { resume = resolve; });
					await page.route('**/_app/immutable/**/*.js', async (route) => {
						await held;
						await route.fallback();
					});
					try {
						await page.goto(`/app-frame/network-paint/${lang}/${refresh}`, { waitUntil: 'domcontentloaded' });
						const network = page.locator('[data-slot="site-header-network"]');
						const pill = page.getByTestId('nav-pill');
						await expect(network).toBeVisible();
						await expect(pill).not.toHaveClass(/\bnav-hydrated\b/);
						await expect(pill.getByRole('button', { name: /Refresh data|Actualiser les données/ })).toHaveCount(refresh === 'refresh' ? 1 : 0);
						await page.evaluate(() => document.fonts.ready);
						const firstPaint = await headerBoxes(page);
						const original = await network.elementHandle();

						resume();
						await expect(pill).toHaveClass(/\bnav-hydrated\b/);
						await expect.poll(() => network.evaluate((element) => {
							const menu = element.closest('nav')!.querySelector('[data-testid="nav-menu-toggle"]')!;
							return !!(element.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING);
						})).toBe(inline);
						expect(await network.evaluate((element, before) => element === before, original)).toBe(true);
						await page.evaluate(() => document.fonts.ready);
						expect(await headerBoxes(page)).toEqual(firstPaint);
						if (inline) {
							expect(firstPaint.picker.x).toBeGreaterThanOrEqual(firstPaint.search.right);
							expect(firstPaint.theme.x).toBeGreaterThanOrEqual(firstPaint.picker.right);
							await pill.getByRole('searchbox').focus();
						} else {
							expect(firstPaint.picker.y).toBeGreaterThanOrEqual(firstPaint.pill.y + firstPaint.pill.height - 0.1);
							await pill.getByTestId('nav-menu-toggle').focus();
						}
						await page.keyboard.press('Tab');
						await expect(network.getByRole('combobox')).toBeFocused();
						await expectNoHorizontalOverflow(page);
					} finally {
						resume();
					}
				});
			}
		}
	}
});

test.describe('Network header menu height', { tag: '@theme' }, () => {
	for (const lang of ['en', 'fr']) {
		test(`${lang}: folding search and network leaves the pill height unchanged`, async ({ page }) => {
			await page.goto(`/app-frame/network-paint/${lang}/refresh`);
			const pill = page.getByTestId('nav-pill');
			const menu = pill.getByTestId('nav-menu-toggle');
			const network = pill.getByRole('combobox');
			const search = pill.getByRole('searchbox');
			await expect(pill).toHaveClass(/\bnav-hydrated\b/);
			await page.evaluate(() => document.fonts.ready);

			for (const width of [390, 1024, 1100, 1279, 1440]) {
				await page.setViewportSize({ width, height: 900 });
				await expect(network).toBeVisible();
				if (width >= 1024) await expect(search).toBeVisible();
				else await expect(search).toBeHidden();
				const closedHeight = (await pill.boundingBox())!.height;

				await menu.press('Enter');
				await expect(page.getByRole('dialog')).toBeVisible();
				expect((await pill.boundingBox())!.height, `open pill at ${width}px`).toBe(closedHeight);
				await expect(pill.locator('.nav-search')).toHaveAttribute('inert', '');
				await expect(pill.locator('[data-slot="site-header-network"]')).toHaveAttribute('inert', '');

				await page.keyboard.press('Escape');
				await expect(menu).toBeFocused();
				await expect(network).toBeVisible();
				expect((await pill.boundingBox())!.height).toBe(closedHeight);
			}
		});
	}
});

test.describe('Compact network page scroll', { tag: '@theme' }, () => {
	for (const fallback of [false, true]) {
		test(`the network row leaves the viewport while the pill stays fixed (${fallback ? 'scroll listener' : 'scroll timeline'})`, async ({ page }) => {
			if (fallback) {
				await page.addInitScript(() => {
					const supports = CSS.supports.bind(CSS);
					CSS.supports = (...args: [string] | [string, string]) =>
						!args[0].includes('animation-timeline') && (args.length === 1 ? supports(args[0]) : supports(...args));
				});
			}
			await page.setViewportSize({ width: 390, height: 900 });
			await page.goto(`/app-frame/network-paint/${fallback ? 'fr' : 'en'}/quiet`);
			await page.getByRole('main').evaluate((node) => { node.style.minBlockSize = '240dvh'; });
			if (fallback) await page.addStyleTag({ content: '.nav-network { animation: none !important; }' });
			const pill = page.getByTestId('nav-pill');
			const network = pill.getByRole('combobox');
			const menu = pill.getByTestId('nav-menu-toggle');
			await expect(pill).toHaveClass(/\bnav-hydrated\b/);
			await page.evaluate(() => document.fonts.ready);
			await network.selectOption('ott');
			const original = await network.elementHandle();
			const pillBox = (await pill.boundingBox())!;
			const networkBox = (await network.boundingBox())!;
			const scrollTo = (top: number) => page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), top);

			await scrollTo(24);
			await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(24);
			await expect.poll(async () => (await network.boundingBox())!.y).toBeCloseTo(networkBox.y - 24, 0);
			await scrollTo(900);
			await expect.poll(async () => {
				const box = (await network.boundingBox())!;
				return box.y + box.height;
			}).toBeLessThan(0);
			expect(await pill.boundingBox()).toEqual(pillBox);
			expect(await page.evaluate((y) => !!document.elementFromPoint(innerWidth / 2, y)?.closest('main'), pillBox.y + pillBox.height + 20)).toBe(true);

			await menu.evaluate((node) => node.focus({ preventScroll: true }));
			expect(await page.evaluate(() => window.scrollY)).toBe(900);
			await page.keyboard.press('Tab');
			await expect(network).toBeFocused();
			await expect.poll(async () => (await network.boundingBox())!.y).toBeCloseTo(networkBox.y, 0);
			await expect(network).toHaveValue('ott');
			expect(await network.evaluate((node, original) => node === original, original)).toBe(true);
			await page.keyboard.press('Shift+Tab');
			await expect(menu).toBeFocused();
			await scrollTo(900);
			await expect.poll(async () => (await network.boundingBox())!.y).toBeLessThan(0);

			await scrollTo(0);
			await expect.poll(async () => (await network.boundingBox())!.y).toBeCloseTo(networkBox.y, 0);
			await page.setViewportSize({ width: 1280, height: 900 });
			await expect(pill.getByRole('searchbox')).toBeVisible();
			// Search is visible before ResizeObserver can move the picker back into the pill.
			await expect.poll(() => network.evaluate((control) => {
				const box = control.getBoundingClientRect();
				const pillBox = control.closest('nav')!.getBoundingClientRect();
				return box.top >= pillBox.top && box.bottom <= pillBox.bottom;
			})).toBe(true);
			const inline = (await network.boundingBox())!;
			await scrollTo(900);
			await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(900);
			await expect.poll(async () => (await network.boundingBox())!.y).toBeCloseTo(inline.y, 0);
		});
	}
});
