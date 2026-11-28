import { expectAccessible } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';
import { HOME, LABELS, MENU_GROUP_LABELS, MENU_ITEMS } from '../../src/lib/gallery/site-header-fixture.js';

const language = (page: Page) => page.getByRole('link', { name: /^Language:/ });
const trigger = (page: Page) => page.getByRole('button', { name: LABELS.openMenu, exact: true });
const menu = (page: Page) => page.getByRole('navigation', { name: LABELS.menu });

async function expectMenuLinks(page: Page) {
	const links = menu(page).getByRole('link');
	await expect(links).toHaveText(MENU_ITEMS.map(({ label }) => label));
	expect(await links.evaluateAll((nodes) => nodes.map((link) => link.getAttribute('href')))).toEqual(MENU_ITEMS.map(({ href }) => href));
	await expect(links.first()).toHaveAttribute('aria-current', 'page');
	await expect(links.last()).toHaveAttribute('target', '_blank');
	await expect(links.last()).toHaveAttribute('rel', 'noopener noreferrer');
	return links;
}

async function tabTo(page: Page, target: ReturnType<Page['getByRole']>) {
	for (let i = 0; i < 40; i++) {
		await page.keyboard.press('Tab');
		if (await target.evaluate(node => node === document.activeElement)) return;
	}
	await expect(target).toBeFocused();
}

for (const width of [320, 390, 599]) {
	test(`compact controls without JavaScript at ${width}px`, async ({ browser, baseURL }) => {
		const context = await browser.newContext({ javaScriptEnabled: false, hasTouch: true, viewport: { width, height: 844 } });
		const page = await context.newPage();
		try {
			await page.goto(`${baseURL}/site-header-compact`);
			await expect(menu(page)).toBeHidden();
			await trigger(page).focus();
			await page.keyboard.press('Enter');
			await expect(menu(page).getByRole('heading')).toHaveText([...MENU_GROUP_LABELS.en[2]]);
			for (const heading of MENU_GROUP_LABELS.en[2]) {
				await expect(menu(page).getByRole('list', { name: heading })).toHaveCount(1);
			}
			const links = await expectMenuLinks(page);
			for (const link of await links.all()) {
				await page.keyboard.press('Tab');
				await expect(link).toBeFocused();
			}
			await expect(language(page)).toBeVisible();
			await page.keyboard.press('Escape');
			await expect(menu(page)).toBeHidden();
			await expect(trigger(page)).toBeFocused();
			await page.keyboard.press('Enter');
			await expect(language(page)).toHaveCount(1);
			await expect(page.locator('.fallback-menu').getByTestId('language-toggle')).toBeVisible();
			await expect(page.getByTestId('nav-pill').getByTestId('language-toggle')).toBeHidden();
			await expect(page.getByRole('switch', { name: LABELS.theme })).toHaveCount(1);
			await tabTo(page, page.getByRole('switch', { name: LABELS.theme }));
			await tabTo(page, language(page));
			const href = await language(page).getAttribute('href');
			await language(page).tap();
			await expect(page).toHaveURL(new URL(href!, baseURL!).href);
		} finally { await context.close(); }
	});

	test(`compact controls with hydration held at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 });
		let release!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		await page.route('**/*.js', async route => { await gate; await route.continue(); });
		try {
			await page.goto('/site-header-compact', { waitUntil: 'commit' });
			await expect(trigger(page)).toBeVisible();
			await page.evaluate(async () => {
				await document.fonts.ready;
				(window as any).headerCLS = 0;
				new PerformanceObserver(list => {
					for (const entry of list.getEntries() as any[]) {
						if (entry.sources?.some((s: any) => s.node?.closest?.('[data-slot="site-header"]')))
							(window as any).headerCLS += entry.value;
					}
				}).observe({ type: 'layout-shift' });
			});
			const before = await page.getByTestId('nav-pill').boundingBox();
			await trigger(page).click();
			await expect(language(page)).toBeVisible();
			await tabTo(page, page.getByRole('switch', { name: LABELS.theme }));
			await tabTo(page, language(page));
			await page.keyboard.press('Escape');
			release();
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			await page.evaluate(() => new Promise<void>(resolve => {
				requestAnimationFrame(() => requestAnimationFrame(() => { setTimeout(resolve, 50); }));
			}));
			expect(await page.getByTestId('nav-pill').boundingBox()).toEqual(before);
			await expect(page.getByTestId('nav-pill')).toHaveJSProperty('offsetHeight', Math.round(before!.height));
			await expect.poll(() => page.evaluate(() => (window as any).headerCLS)).toBeLessThan(0.01);
			console.log(`header CLS ${width}: ${await page.evaluate(() => (window as any).headerCLS)}`);
			await trigger(page).click();
			await expect(page.getByRole('dialog')).toBeVisible();
			await expect(language(page)).toHaveCount(1);
			await expect(page.getByTestId('language-toggle')).toHaveCount(1);
			await expect(language(page)).toBeVisible();
		} finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
	});

	test(`language tap navigates while hydration is held at ${width}px`, async ({ browser, baseURL }) => {
		const context = await browser.newContext({ hasTouch: true, viewport: { width, height: 844 } });
		let release!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		await context.route('**/*.js', async route => { await gate; await route.continue(); });
		const page = await context.newPage();
		try {
			await page.goto(`${baseURL}/site-header-compact`, { waitUntil: 'commit' });
			await trigger(page).tap();
			await expect(language(page)).toBeVisible();
			const href = await language(page).getAttribute('href');
			await language(page).tap();
			await expect(page).toHaveURL(new URL(href!, baseURL!).href);
		} finally {
			release();
			await context.unrouteAll({ behavior: 'wait' });
			await context.close();
		}
	});
}

test('the regular header opens its list and light-dismisses without JavaScript', async ({ browser, baseURL }) => {
	const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
	const page = await context.newPage();
	try {
		await page.goto(`${baseURL}${HOME}`);
		await expect(menu(page)).toBeHidden();
		await trigger(page).focus();
		await page.keyboard.press('Enter');
		const links = await expectMenuLinks(page);
		await expect(menu(page).getByRole('list')).toHaveCount(1);
		for (const link of await links.all()) {
			await page.keyboard.press('Tab');
			await expect(link).toBeFocused();
		}
		await page.keyboard.press('Escape');
		await expect(menu(page)).toBeHidden();
		await expect(trigger(page)).toBeFocused();
		await trigger(page).click();
		await expect(menu(page)).toBeVisible();
		await page.mouse.click(4, 100);
		await expect(menu(page)).toBeHidden();
	} finally { await context.close(); }
});

for (const { route, width } of [{ route: '/site-header-compact', width: 390 }, { route: HOME, width: 768 }]) {
	test(`an early tap at ${width}px hands the open list and focused link to the dialog`, async ({ browser, baseURL }) => {
		const context = await browser.newContext({ hasTouch: true, reducedMotion: 'reduce', viewport: { width, height: 844 } });
		let release!: () => void;
		const gate = new Promise<void>((resolve) => { release = resolve; });
		await context.route('**/_app/immutable/**/*.js', async (route) => { await gate; await route.continue(); });
		const page = await context.newPage();
		try {
			await page.goto(`${baseURL}${route}`, { waitUntil: 'commit' });
			await expect(page.locator('html')).not.toHaveAttribute('data-gallery-ready', 'true');
			await trigger(page).tap();
			await expect(menu(page)).toBeVisible();
			const links = await expectMenuLinks(page);
			await expectAccessible(page, { include: '.fallback-menu' });
			await links.nth(1).focus();
			release();
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			const dialog = page.getByRole('dialog', { name: LABELS.menu });
			await expect(dialog).toBeVisible();
			await expect(page.locator('.fallback-menu')).toHaveCount(0);
			await expect(dialog.getByRole('link', { name: /^Listing/ })).toBeFocused();
			await page.keyboard.press('Escape');
			await expect(dialog).toBeHidden();
			await expect(trigger(page)).toBeFocused();
		} finally {
			release();
			await context.unrouteAll({ behavior: 'wait' });
			await context.close();
		}
	});
}

for (const width of [320, 360, 390]) {
	for (const label of ['Contact', 'Écrivez-moi', 'Escríbeme aquí']) {
		test(`compact priority-one action ${label} fits at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 844 });
			await page.goto('/site-header-compact');
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			const links = page.getByTestId('nav-pill').locator('.nav-links');
			await links.locator('[data-priority="1"] a').evaluateAll((nodes, label) => {
				for (const node of nodes) node.textContent = label;
			}, label);
			await page.evaluate(() => document.fonts.ready);
			const action = links.getByRole('link', { name: label, exact: true });
			await expect(action).toBeVisible();
			await expect(links.locator('[data-priority="2"] a')).toBeHidden();
			await expect(links.locator('[data-priority="3"] a')).toBeHidden();
			const boxes = await page.getByTestId('nav-pill').evaluate(nav => {
				const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, width: r.width, height: r.height }; };
				const link = nav.querySelector('.nav-links [data-priority="1"] a')!;
				const range = document.createRange(); range.selectNodeContents(link);
				return { pill: rect(nav), word: rect(nav.querySelector('.nav-wordmark')!), link: rect(link), menu: rect(nav.querySelector('.menu-toggle')!), lines: range.getClientRects().length };
			});
			expect(boxes.pill.x).toBeGreaterThanOrEqual(0);
			expect(boxes.pill.right).toBeLessThanOrEqual(width);
			expect(boxes.link.x).toBeGreaterThanOrEqual(boxes.word.right);
			expect(boxes.link.right).toBeLessThanOrEqual(boxes.menu.x);
			expect(boxes.lines).toBe(1);
		}
		);
	}
}
