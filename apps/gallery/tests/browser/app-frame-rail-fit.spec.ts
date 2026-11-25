import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

const path = '/app-frame/controls-rail';
const workspace = (page: Page) => ({
	main: page.getByRole('main', { name: 'Service workspace' }),
	controls: page.getByRole('complementary', { name: 'Controls', exact: true }),
	evidence: page.getByRole('complementary', { name: 'Evidence', exact: true }),
	openControls: page.getByRole('button', { name: /Open controls/ }),
	openEvidence: page.getByRole('button', { name: /Open evidence/ }),
	period: page.getByRole('combobox', { name: 'Record period' }),
	closeControls: page.getByRole('button', { name: 'Close controls', exact: true }),
});

async function expectClosedLayout(page: Page, paired: boolean) {
	const view = workspace(page);
	await expect(view.controls).toHaveCount(paired ? 1 : 0);
	await expect(view.evidence).toHaveCount(paired ? 1 : 0);
	await expect(view.period).toHaveCount(paired ? 1 : 0);
	await expect(view.openControls).toHaveCount(paired ? 0 : 1);
	await expect(view.openEvidence).toHaveCount(paired ? 0 : 1);
	await expect(view.closeControls).toHaveCount(0);
	if (paired) {
		const controls = (await view.controls.boundingBox())!;
		const main = (await view.main.boundingBox())!;
		const evidence = (await view.evidence.boundingBox())!;
		expect(controls.x + controls.width).toBeLessThan(main.x);
		expect(main.x + main.width).toBeLessThan(evidence.x);
	}
	const main = (await view.main.boundingBox())!;
	return { x: main.x, width: main.width };
}

test.describe('AppFrame rail layout follows root text size', { tag: '@theme' }, () => {
	const scenarios = [
		{ width: 800, scale: 100, paired: false },
		{ width: 1024, scale: 100, paired: true },
		{ width: 1206, scale: 100, paired: true },
		{ width: 1280, scale: 100, paired: true },
		{ width: 1440, scale: 100, paired: true, controlsWidth: 272 },
		{ width: 1024, scale: 200, paired: false },
		{ width: 1280, scale: 200, paired: false },
		{ width: 1440, scale: 200, paired: false },
		{ width: 1920, scale: 200, paired: false },
		{ width: 2048, scale: 200, paired: true, controlsWidth: 544 },
	];

	for (const { width, scale, paired, controlsWidth } of scenarios) {
		test(`${width}px at ${scale}% settles into ${paired ? 'paired' : 'compact'} rails`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			let resume!: () => void;
			const held = new Promise<void>((resolve) => { resume = resolve; });
			await page.route('**/_app/immutable/**/*.js', async (route) => {
				await held;
				await route.fallback();
			});
			try {
				await page.goto(path, { waitUntil: 'domcontentloaded' });
				await page.addStyleTag({ content: `html { font-size: ${scale}%; }` });
				await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);
				const firstPaintPaired = await page.evaluate(() => matchMedia('(min-width: 64rem)').matches);
				const before = await expectClosedLayout(page, firstPaintPaired);

				resume();
				await page.locator('html[data-gallery-ready]').waitFor();
				const after = await expectClosedLayout(page, paired);
				if (paired === firstPaintPaired) expect(after).toEqual(before);
				else expect(after.width).toBeGreaterThan(before.width);
				if (controlsWidth !== undefined) {
					const rail = (await workspace(page).controls.boundingBox())!;
					const frame = (await page.locator('[data-slot="app-frame"]').boundingBox())!;
					const available = frame.x + frame.width - rail.x;
					expect(rail.width).toBeCloseTo(Math.min(controlsWidth, available * 0.27), 0);
				}
				await expectNoHorizontalOverflow(page);
			} finally {
				resume();
			}
		});
	}

	test('paired controls start at the page gutter and stay below the chrome', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		let resume!: () => void;
		const held = new Promise<void>((resolve) => { resume = resolve; });
		await page.route('**/_app/immutable/**/*.js', async (route) => {
			await held;
			await route.fallback();
		});
		try {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			await page.evaluate(() => document.fonts.ready);
			const rail = workspace(page).controls;
			const frame = page.locator('[data-slot="app-frame"]');
			const chrome = page.locator('[data-slot="app-frame-chrome"]');
			const gutter = await page.locator('#report').evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineEnd));
			const assertGaps = async () => {
				const outer = (await frame.boundingBox())!;
				const bar = (await chrome.boundingBox())!;
				const bounds = (await rail.boundingBox())!;
				expect(bounds.x - outer.x).toBeCloseTo(gutter, 1);
				expect(bounds.y - bar.y - bar.height).toBeCloseTo(16, 1);
				return bounds;
			};
			await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);
			const before = await assertGaps();
			resume();
			await page.locator('html[data-gallery-ready]').waitFor();
			expect(await assertGaps()).toEqual(before);
			await expectAccessible(page);

			await page.addStyleTag({ content: '#report { min-block-size: 240dvh; } .filter { min-block-size: 160dvh; }' });
			await page.evaluate(() => window.scrollTo(0, 300));
			await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
			const stuck = await assertGaps();
			expect(stuck.y + stuck.height).toBeCloseTo(884, 0);
			await rail.hover();
			await page.mouse.wheel(0, 160);
			await expect.poll(() => rail.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
			await expectNoHorizontalOverflow(page);
		} finally {
			resume();
		}
	});

	test('a controls rail taller than the report keeps the section gutter above the hazard edge', async ({ page }) => {
		for (const width of [1024, 1440]) {
			await page.setViewportSize({ width, height: 600 });
			await page.goto(`${path}?short-report`);
			const view = workspace(page);
			const card = view.controls.getByRole('group', { name: 'Service period' });
			const footer = page.locator('[data-slot="app-frame"] [data-slot="footer"]');
			await expect(card).toBeVisible();
			await expect(footer).toBeAttached();
			const cardBounds = (await card.boundingBox())!;
			const report = page.locator('#report');
			expect(cardBounds.height).toBeGreaterThan((await report.boundingBox())!.height);
			const footerBounds = (await footer.boundingBox())!;
			const gutter = await report.evaluate((element) => parseFloat(getComputedStyle(element).paddingBlockEnd));
			expect(footerBounds.y - cardBounds.y - cardBounds.height).toBeCloseTo(gutter, 0);
		}
	});

	test('a larger browser default starts compact before hydration', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		const cdp = await page.context().newCDPSession(page);
		await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32 } });
		await page.route('**/_app/immutable/**/*.js', (route) => route.abort());
		await page.goto(path);
		await expect(page.locator('html')).toHaveCSS('font-size', '32px');
		await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);
		await expectClosedLayout(page, false);
	});

	test('a page-width frame stays paired through hydration', async ({ page }) => {
		await page.setViewportSize({ width: 1030, height: 900 });
		let resume!: () => void;
		const held = new Promise<void>((resolve) => { resume = resolve; });
		await page.route('**/_app/immutable/**/*.js', async (route) => {
			await held;
			await route.fallback();
		});
		try {
			await page.goto(path, { waitUntil: 'domcontentloaded' });
			await page.addStyleTag({ content: `
				html { overflow-y: scroll; }
				html::-webkit-scrollbar { width: 15px; }
				#report { min-block-size: 200vh; }
			` });
			const frame = page.locator('[data-slot="app-frame"]');
			const widths = await frame.evaluate((element) => ({
				viewport: window.innerWidth,
				page: document.documentElement.clientWidth,
				frame: element.getBoundingClientRect().width,
			}));
			expect(widths.viewport).toBeGreaterThanOrEqual(1024);
			expect(widths.page).toBeLessThan(1024);
			expect(widths.frame).toBe(widths.page);
			await expect(frame).not.toHaveAttribute('data-rail-layout');
			const before = await expectClosedLayout(page, true);

			resume();
			await page.locator('html[data-gallery-ready]').waitFor();
			await expect(frame).toHaveAttribute('data-rail-layout', 'paired');
			expect(await expectClosedLayout(page, true)).toEqual(before);

			await page.setViewportSize({ width: 1023, height: 900 });
			await expect(frame).toHaveAttribute('data-rail-layout', 'compact');
			await expectClosedLayout(page, false);
		} finally {
			resume();
		}
	});

	test('an AppFrame narrower than the viewport keeps its compact controls', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path);
		await page.addStyleTag({ content: '[data-slot="app-frame"] { inline-size: 1000px; margin-inline: auto; }' });
		await expectClosedLayout(page, false);
	});

	test('compact pills stay viewport-fixed as the document scrolls', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path);
		await page.addStyleTag({ content: `
			html { font-size: 200%; }
			#report { min-block-size: 500vh; }
			[data-legacy-size-container] { contain: layout; }
		` });
		await page.locator('html[data-gallery-ready]').waitFor();
		const view = workspace(page);
		await expectClosedLayout(page, false);
		// Emulate the old containing-block behavior on any real size-container ancestor.
		const sizeContainers = await view.openControls.evaluate((pill) => {
			let count = 0;
			for (let ancestor = pill.parentElement; ancestor; ancestor = ancestor.parentElement) {
				const type = getComputedStyle(ancestor).containerType.split(' ');
				if (type.includes('size') || type.includes('inline-size')) {
					ancestor.setAttribute('data-legacy-size-container', '');
					count++;
				}
			}
			return count;
		});
		const before = (await view.openControls.boundingBox())!;
		expect(before.y + before.height).toBeCloseTo(880, 0);
		await page.evaluate(() => window.scrollTo(0, 900));
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800);
		expect(await view.openControls.boundingBox()).toEqual(before);
		expect(sizeContainers).toBe(0);
	});

	test('both compact sheets work by keyboard and keep one set of controls', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path);
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await page.locator('html[data-gallery-ready]').waitFor();
		const view = workspace(page);
		await expectClosedLayout(page, false);
		await expect(page.locator('html')).toHaveCSS('scroll-padding-block-end', '200px');

		await view.openControls.focus();
		await page.keyboard.press('Enter');
		const controlsSheet = page.getByRole('dialog', { name: 'Controls', exact: true });
		await expect(controlsSheet.getByRole('combobox', { name: 'Record period' })).toBeVisible();
		await expect(view.period).toHaveCount(1);
		await expectAccessible(page);
		await view.period.focus();
		await page.keyboard.press('Escape');
		await expect(controlsSheet).toBeHidden();
		await expect(view.openControls).toBeFocused();
		await expect(view.period).toHaveCount(0);

		await view.openEvidence.focus();
		await page.keyboard.press('Enter');
		const evidenceSheet = page.getByRole('dialog', { name: 'Evidence', exact: true });
		const reportLink = evidenceSheet.getByRole('link', { name: 'Go to report' });
		await expect(reportLink).toBeVisible();
		await reportLink.focus();
		await page.keyboard.press('Escape');
		await expect(evidenceSheet).toBeHidden();
		await expect(view.openEvidence).toBeFocused();
	});

	test('reducing text while a sheet is open restores focus to the paired rail', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path);
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await page.locator('html[data-gallery-ready]').waitFor();
		const view = workspace(page);
		await view.openControls.focus();
		await page.keyboard.press('Enter');
		const sheet = page.getByRole('dialog', { name: 'Controls', exact: true });
		await expect(view.period).toBeVisible();
		await view.period.focus();
		await page.addStyleTag({ content: 'html { font-size: 100%; }' });
		await expect(sheet).toBeHidden();
		await expect(view.controls.getByRole('combobox', { name: 'Record period' })).toBeFocused();
		await expectClosedLayout(page, true);
	});
});
