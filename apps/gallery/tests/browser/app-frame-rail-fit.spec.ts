import { expect, test, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

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
					expect((await workspace(page).controls.boundingBox())!.width).toBeCloseTo(controlsWidth, 0);
				}
				await expectNoHorizontalOverflow(page);
			} finally {
				resume();
			}
		});
	}

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
