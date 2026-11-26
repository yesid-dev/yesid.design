import { expectAccessible } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PRODUCT_COPY, PRODUCT_LANGS } from '../../src/lib/gallery/product-header-fixture.js';

const WIDTHS = [320, 390, 600, 1440, 1920];

async function open(page: Page, lang: string) {
	await page.goto(`/product-brand/${lang}`);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

for (const lang of PRODUCT_LANGS) {
	const copy = PRODUCT_COPY[lang];

	test(`${lang}: the header reads "yesid. | Login" beside the unchanged toggles from 320 to 1920px @theme`, async ({ page }) => {
		await open(page, lang);
		const banner = page.getByRole('banner');
		const brand = banner.getByTestId('header-brand');
		const house = brand.getByRole('link', { name: copy.houseLabel });
		const product = brand.getByRole('link', { name: 'Login', exact: true });
		await expect(house).toHaveAttribute('target', '_blank');
		await expect(product).toHaveAttribute('aria-current', 'page');
		await expect(brand.locator('.product-brand-divider')).toHaveAttribute('aria-hidden', 'true');
		await expect(banner.getByRole('button', { name: copy.labels.openMenu })).toHaveCount(0);
		for (const width of WIDTHS) {
			await page.setViewportSize({ width, height: 900 });
			const where = `${lang} at ${width}px`;
			const pill = (await page.getByTestId('nav-pill').boundingBox())!;
			expect(pill.x, where).toBeGreaterThanOrEqual(0);
			expect(pill.x + pill.width, where).toBeLessThanOrEqual(width);
			const parts = await Promise.all([house, brand.locator('.product-brand-divider'), product].map((part) => part.boundingBox()));
			expect(parts[0]!.x + parts[0]!.width, `divider after the house mark, ${where}`).toBeLessThanOrEqual(parts[1]!.x);
			expect(parts[1]!.x + parts[1]!.width, `product after the divider, ${where}`).toBeLessThanOrEqual(parts[2]!.x);
			expect(parts[0]!.height, where).toBeGreaterThanOrEqual(44);
			expect(parts[2]!.height, where).toBeGreaterThanOrEqual(44);
			await expect(banner.getByRole('switch', { name: copy.labels.theme })).toBeVisible();
			await expect(banner.getByTestId('language-toggle')).toBeVisible();
			await expect(banner.getByRole('link', { name: new RegExp(`^${copy.language}\\s?:`) })).toBeVisible();
		}
		await expectAccessible(page);
	});

	test(`${lang}: a long product name wraps between words inside the pill and the footer`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run resizes through the phone widths');
		await open(page, lang);
		await page.getByTestId('header-brand').getByRole('link', { name: 'Login' }).evaluate((node, name) => { node.textContent = name; }, copy.longProduct);
		await page.getByTestId('footer-brand').getByRole('link', { name: 'Transit' }).evaluate((node, name) => { node.textContent = name; }, copy.longProduct);
		for (const width of [320, 390]) {
			await page.setViewportSize({ width, height: 900 });
			const result = await page.evaluate(() => {
				const rect = (el: Element) => el.getBoundingClientRect();
				return ['header-brand', 'footer-brand', 'long-brand'].map((id) => {
					const root = document.querySelector(`[data-testid="${id}"]`)!;
					const name = root.querySelector('.product-brand-name')!;
					return { id, right: rect(root).right, nameRight: rect(name).right, overflow: name.scrollWidth - name.clientWidth };
				}).concat([{ id: 'page', right: document.documentElement.scrollWidth, nameRight: 0, overflow: 0 }]);
			});
			for (const entry of result) {
				expect(entry.right, `${entry.id} at ${width}px`).toBeLessThanOrEqual(width);
				expect(entry.nameRight, `${entry.id} name at ${width}px`).toBeLessThanOrEqual(width);
				expect(entry.overflow, `${entry.id} name overflow at ${width}px`).toBeLessThanOrEqual(0);
			}
			const pill = (await page.getByTestId('nav-pill').boundingBox())!;
			expect(pill.x).toBeGreaterThanOrEqual(0);
			expect(pill.x + pill.width).toBeLessThanOrEqual(width);
			await expect(page.getByRole('banner').getByTestId('language-toggle')).toBeVisible();
		}
	});
}

test('a two-letter product name keeps a 44 by 44px target in the header and footer', async ({ page }) => {
	await open(page, 'en');
	for (const [id, name] of [['header-brand', 'Login'], ['footer-brand', 'Transit']] as const) {
		const link = page.getByTestId(id).getByRole('link', { name, exact: true });
		await link.evaluate((node) => { node.textContent = 'AI'; });
		const box = (await page.getByTestId(id).getByRole('link', { name: 'AI', exact: true }).boundingBox())!;
		expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
		expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
	}
});

test('keyboard order is house, product, theme, language, with a visible focus ring on each link', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'phone', 'Keyboard order on tablet and desktop');
	await open(page, 'fr');
	const copy = PRODUCT_COPY.fr;
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: copy.labels.skipToContent })).toBeFocused();
	const brand = page.getByTestId('header-brand');
	const order = [
		brand.getByRole('link', { name: copy.houseLabel }),
		brand.getByRole('link', { name: 'Login', exact: true }),
		page.getByRole('banner').getByRole('switch', { name: copy.labels.theme }),
		page.getByRole('banner').getByTestId('language-toggle'),
	];
	for (const [i, target] of order.entries()) {
		await page.keyboard.press('Tab');
		await expect(target).toBeFocused();
		if (i < 2) {
			await expect(target).toHaveCSS('outline-style', 'solid');
			await expect(target).toHaveCSS('outline-width', '2px');
		}
	}
});

test('the product name turns the clickable orange on hover and keeps the foreground at rest', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'Hover needs a fine pointer');
	await open(page, 'en');
	const product = page.getByTestId('header-brand').getByRole('link', { name: 'Login', exact: true });
	const token = (name: string) => page.evaluate((property) => {
		const probe = document.createElement('span');
		probe.style.color = `var(${property})`;
		document.body.append(probe);
		const color = getComputedStyle(probe).color;
		probe.remove();
		return color;
	}, name);
	await expect(product).toHaveCSS('color', await token('--foreground'));
	await expect(product).toHaveCSS('text-decoration-line', 'none');
	await product.hover();
	await expect(product).toHaveCSS('color', await token('--primary'));
});

test('independent sizes retain full links and compact container layout at 200% text @theme', async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await open(page, 'en');
	const space = page.getByTestId('compact-brand-space');
	const brand = page.getByTestId('footer-brand');
	const house = brand.getByRole('link', { name: PRODUCT_COPY.en.houseLabel });
	const product = brand.getByRole('link', { name: 'Transit', exact: true });
	const divider = brand.locator('[aria-hidden="true"]');
	const header = page.getByTestId('header-brand');
	await expect(header.getByRole('link', { name: PRODUCT_COPY.en.houseLabel })).toHaveCSS('font-size', '18px');
	await expect(header.getByRole('link', { name: 'Login', exact: true })).toHaveCSS('font-size', '18px');

	for (const scale of [1, 2]) {
		await page.evaluate((scale) => { document.documentElement.style.fontSize = `${16 * scale}px`; }, scale);
		await expect(house).toHaveCSS('font-size', `${18 * scale}px`);
		await expect(product).toHaveCSS('font-size', `${24 * scale}px`);
		const bounds = (await space.boundingBox())!;
		expect(bounds.width, 'the brand wrapper fills its real footer column').toBeGreaterThanOrEqual(224);
		const first = (await house.boundingBox())!;
		const second = (await product.boundingBox())!;
		for (const [name, box] of [['house', first], ['product', second]] as const) {
			expect(box.width, `${name} target at ${scale * 100}%`).toBeGreaterThanOrEqual(44);
			expect(box.height, `${name} target at ${scale * 100}%`).toBeGreaterThanOrEqual(44);
			expect(box.x).toBeGreaterThanOrEqual(bounds.x);
			expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 0.5);
			await expect(name === 'house' ? house : product).toHaveJSProperty('scrollWidth', Math.round(box.width));
		}
		if (scale === 1) {
			await expect(divider).toBeVisible();
			expect(first.x + first.width).toBeLessThan(second.x);
		} else {
			await expect(divider).toBeHidden();
			expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
			expect(second.x).toBeCloseTo(first.x, 1);
		}
		await house.focus();
		await expect(house).toHaveCSS('outline-width', '2px');
		await page.keyboard.press('Tab');
		await expect(product).toBeFocused();
		await expect(product).toHaveCSS('outline-width', '2px');
	}
	await testInfo.attach('compact-brand-200-percent', { body: await brand.screenshot(), contentType: 'image/png' });
	await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
	await expectAccessible(page);
});
