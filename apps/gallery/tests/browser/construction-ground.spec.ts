import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, expectTapTargets } from '@yesid/config/playwright';

const groundFloor = (page: Page) => page.locator('[data-slot="construction-ground-floor"]');
const groundProps = (page: Page) => page.locator('[data-slot="construction-props"]');
const groundAnchor = (page: Page) => page.locator('[data-slot="construction-ground-anchor"]');
const footer = (page: Page) => page.getByTestId('footer');

const floorHeight = (page: Page) =>
	groundFloor(page).evaluate((el) => Math.round(el.getBoundingClientRect().height));

const footerTop = (page: Page) =>
	footer(page).evaluate((el) => el.getBoundingClientRect().top);

// A script scroll dispatches its scroll event before the next frame's callbacks, so once that
// frame arrives the reveal has read the new position. Without the wait a slow runner can read the
// previous step's height while data-state already says "revealing".
const placeMarker = (page: Page, viewportShare: number) =>
	groundAnchor(page).evaluate(async (el, share) => {
		window.scrollBy(0, el.getBoundingClientRect().top - window.innerHeight * share);
		await new Promise<void>((done) => requestAnimationFrame(() => done()));
	}, viewportShare);

async function openFixture(page: Page, lang: 'en' | 'fr') {
	if (page.url() !== 'about:blank') await page.goto('about:blank');
	await page.goto(`/construction-ground/${lang}`, { waitUntil: 'load' });
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
	});
}

async function wheelToFooter(page: Page) {
	await page.evaluate(() => {
		const shifts: { value: number; startTime: number; sources: string[] }[] = [];
		Object.assign(window, { __groundShifts: shifts });
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries() as (PerformanceEntry & {
				value: number;
				hadRecentInput: boolean;
				sources?: { node?: Node | null }[];
			})[]) {
				if (entry.hadRecentInput) continue;
				shifts.push({
					value: entry.value,
					startTime: entry.startTime,
					sources: (entry.sources ?? []).map(({ node }) =>
						node instanceof Element ? node.outerHTML.slice(0, 100) : String(node),
					),
				});
			}
		}).observe({ type: 'layout-shift', buffered: true });
	});

	for (let step = 0; step < 120; step += 1) {
		const atBottom = await page.evaluate(
			() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1,
		);
		if (atBottom) break;
		const before = await page.evaluate(() => window.scrollY);
		await page.mouse.wheel(0, 120);
		await page.waitForFunction((y) => window.scrollY !== y, before);
		await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => done())));
	}
	await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
	return page.evaluate(
		() => (window as unknown as { __groundShifts: { value: number; startTime: number; sources: string[] }[] }).__groundShifts,
	);
}

for (const width of [1440, 1024, 390] as const) {
	const height = width === 390 ? 844 : 900;
	const expectedHeight = width < 768 ? 100 : 240;

	for (const lang of ['en', 'fr'] as const) {
		for (const reducedMotion of ['no-preference', 'reduce'] as const) {
			test(`wheel scroll from top to footer has zero layout shifts (${width}px, ${lang}, ${reducedMotion})`, async ({ page }, info) => {
				test.skip(info.project.name !== 'desktop', 'Explicit viewport matrix runs once under desktop');
				await page.emulateMedia({ reducedMotion });
				await page.setViewportSize({ width, height });
				await openFixture(page, lang);

				if (reducedMotion === 'reduce') {
					expect(await floorHeight(page)).toBe(expectedHeight);
				} else {
					await expect(groundProps(page)).toHaveAttribute('data-state', 'hidden');
					expect(await floorHeight(page)).toBe(0);
				}

				const shifts = await wheelToFooter(page);
				const cls = shifts.reduce((sum, entry) => sum + entry.value, 0);
				await info.attach('layout-shift', {
					body: JSON.stringify({ width, lang, reducedMotion, count: shifts.length, cls, shifts }),
					contentType: 'application/json',
				});

				expect(shifts, `${width}px ${lang} ${reducedMotion}: ${JSON.stringify(shifts)}`).toEqual([]);
				await expect(groundProps(page)).toHaveAttribute('data-state', 'visible');
				expect(await floorHeight(page)).toBe(expectedHeight);
				await expect(page.getByTestId('ground-stationary-fixture')).toBeVisible();
				await expectNoHorizontalOverflow(page);
			});
		}
	}
}

test('the ground opens with the props while the footer stays below the viewport', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop', 'Desktop reveal geometry check');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.setViewportSize({ width: 1440, height: 900 });
	await openFixture(page, 'en');

	await expect(groundProps(page)).toHaveAttribute('data-state', 'hidden');
	expect(await floorHeight(page)).toBe(0);

	for (const share of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7]) {
		await placeMarker(page, share);
		expect(await footerTop(page), `footer below viewport at marker ${share}`).toBeGreaterThanOrEqual(900 + 120);
	}

	await placeMarker(page, 0.95 - 0.125);
	await expect(groundProps(page)).toHaveAttribute('data-state', 'revealing');
	const midHeight = await floorHeight(page);
	expect(midHeight).toBeGreaterThan(60);
	expect(midHeight).toBeLessThan(180);

	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await expect(groundProps(page)).toHaveAttribute('data-state', 'visible');
	expect(await floorHeight(page)).toBe(240);

	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(groundProps(page)).toHaveAttribute('data-state', 'hidden');
	expect(await floorHeight(page)).toBe(0);
});

test('focus into footer, End, and PageDown each open the ground before the footer enters view', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop', 'Keyboard and focus opening check');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.setViewportSize({ width: 1440, height: 900 });

	// 1. Focus moving into the footer opens the ground synchronously and keeps the link in view.
	await openFixture(page, 'en');
	await expect(groundProps(page)).toHaveAttribute('data-state', 'hidden');
	expect(await floorHeight(page)).toBe(0);
	const footerLink = footer(page).getByRole('link').first();
	await footerLink.focus();
	await expect(footerLink).toBeFocused();
	await expect(groundFloor(page)).toHaveAttribute('data-opened', 'true');
	expect(await floorHeight(page)).toBe(240);
	await expect(footerLink).toBeInViewport({ ratio: 1 });

	// 1b. Shift+Tab from the top lands in the footer with the ground open and link in view.
	await openFixture(page, 'en');
	await expect(groundProps(page)).toHaveAttribute('data-state', 'hidden');
	await page.keyboard.press('Shift+Tab');
	const focused = page.locator(':focus');
	await expect(focused).toHaveCount(1);
	expect(await focused.evaluate((el) => !!el.closest('[data-testid="footer"]'))).toBe(true);
	await expect(groundFloor(page)).toHaveAttribute('data-opened', 'true');
	expect(await floorHeight(page)).toBe(240);
	await expect(focused).toBeInViewport({ ratio: 1 });

	// 2. End key opens the ground before jumping to the bottom.
	await openFixture(page, 'en');
	await expect(groundProps(page)).toHaveAttribute('data-state', 'hidden');
	await page.keyboard.press('End');
	await expect(groundFloor(page)).toHaveAttribute('data-opened', 'true');
	expect(await floorHeight(page)).toBe(240);
	await expect
		.poll(() =>
			page.evaluate(() => document.documentElement.scrollHeight - window.scrollY - window.innerHeight),
		)
		.toBeLessThanOrEqual(1);

	// 3. PageDown when within two screens opens the ground before the footer enters view.
	await openFixture(page, 'en');
	await page.evaluate(() => {
		const el = document.querySelector('[data-slot="construction-ground-floor"]')!;
		const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 1.5);
		window.scrollTo(0, targetY);
	});
	await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => done())));
	expect(await footerTop(page)).toBeGreaterThan(900);
	await expect(groundFloor(page)).not.toHaveAttribute('data-opened', 'true');

	await page.keyboard.press('PageDown');
	await expect(groundFloor(page)).toHaveAttribute('data-opened', 'true');
	expect(await floorHeight(page)).toBe(240);
});

test('reduced motion holds full height in place and never slides', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop', 'Reduced motion check');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1440, height: 900 });
	await openFixture(page, 'en');

	expect(await floorHeight(page)).toBe(240);
	const initialFooterY = await footer(page).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
	await placeMarker(page, 0.95 - 0.125);
	await expect(groundProps(page)).toHaveAttribute('data-state', 'visible');
	expect(await floorHeight(page)).toBe(240);
	const stageTransform = await page
		.locator('[data-slot="construction-ground-stage"]')
		.evaluate((el) => getComputedStyle(el).transform);
	expect(stageTransform).toBe('none');
	const afterFooterY = await footer(page).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
	expect(afterFooterY).toBe(initialFooterY);
});

test('no-JS renders full height with props visible', async ({ browser, baseURL }, info) => {
	test.skip(info.project.name === 'tablet', 'No-JS check at 390 and 1440');
	const isPhone = info.project.name === 'phone';
	const context = await browser.newContext({
		baseURL,
		javaScriptEnabled: false,
		viewport: isPhone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
	});
	try {
		const page = await context.newPage();
		await page.goto('/construction-ground/en');
		await expect(groundProps(page)).toHaveAttribute('data-state', 'static');
		expect(await floorHeight(page)).toBe(isPhone ? 100 : 240);
		for (const art of await groundProps(page).locator('[data-construction-prop] > svg').all()) {
			await expect(art).toBeVisible();
		}
		await expect(page.getByTestId('ground-stationary-fixture').locator('svg')).toBeVisible();
	} finally {
		await context.close();
	}
});

test.describe('construction-ground accessibility in light and dark themes', { tag: '@theme' }, () => {
	for (const lang of ['en', 'fr'] as const) {
		for (const width of [390, 1440] as const) {
			test(`/construction-ground/${lang} is axe clean at ${width}px`, async ({ page }, info) => {
				await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
				await openFixture(page, lang);
				await expect(page.locator('html')).toHaveAttribute('data-theme', info.project.name);
				await expectAccessible(page);
				await expectNoHorizontalOverflow(page);
				await expectTapTargets(page);
			});
		}
	}
});
