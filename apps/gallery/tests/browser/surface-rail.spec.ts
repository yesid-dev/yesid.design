import { expect, test, type Page } from '@playwright/test';

// Headless Chromium hides scrollbars by default.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

for (const nested of [false, true]) {
	test(`the Controls pill follows the ${nested ? 'nested' : 'document'} scroll content centre`, async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'desktop', 'One run at a compact width');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/app-frame/controls-rail');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		if (nested) await page.getByRole('button', { name: 'Full viewport' }).click();
		const pill = page.getByRole('button', { name: /Open controls/ });
		const measure = () => pill.evaluate((button, nested) => {
			const scroller = nested ? document.getElementById('main')! : document.documentElement;
			const frame = scroller.getBoundingClientRect();
			const rect = button.getBoundingClientRect();
			const left = frame.left + scroller.clientLeft;
			const right = left + scroller.clientWidth;
			return {
				offset: (rect.left + rect.right - left - right) / 2,
				gutter: (nested ? frame.width : innerWidth) - scroller.clientWidth,
				left: rect.left - left,
				right: right - rect.right,
			};
		}, nested);
		const scrollbar = await page.addStyleTag({
			content: `
				* { scrollbar-width: auto !important; scrollbar-color: auto !important; }
				::-webkit-scrollbar { width: 15px !important; }
			`,
		});

		async function check(gutter: number) {
			await expect.poll(async () => (await measure()).gutter).toBe(gutter);
			await expect.poll(async () => Math.abs((await measure()).offset)).toBeLessThanOrEqual(1);
			const { left, right } = await measure();
			expect(left).toBeGreaterThanOrEqual(0);
			expect(right).toBeGreaterThanOrEqual(0);
		}
		await check(15);

		await scrollbar.evaluate((style) => { style.textContent = '* { scrollbar-width: none !important; }'; });
		await check(0);
	});
}

async function openLongReport(page: Page) {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/app-frame/rail-motion');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

test('Controls keep their input, scroll position and focus across presentations', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await openLongReport(page);
	const pill = page.locator('.surface-rail-pill');
	const dialog = page.getByRole('dialog', { name: 'Controls' });
	const panel = page.locator('.surface-rail-sheet');
	const input = page.getByRole('textbox', { name: 'Report name' });
	const last = dialog.getByRole('link', { name: 'Go to last section' });
	const original = await page.locator('[data-slot="surface-rail"] input[type="text"]').evaluateHandle((input) => ({
		input,
		parent: input.closest('[data-slot="surface-rail"]')?.parentElement,
	}));

	await expect(dialog).toBeHidden();
	await pill.click();
	await expect(dialog).toHaveAttribute('aria-modal', 'true');
	await expect(dialog.getByText('Presentation: mobile')).toBeVisible();
	await expect(dialog.getByRole('button', { name: 'Close controls', exact: true })).toBeFocused();
	await expect.poll(async () => {
		const [sheetBox, pillBox] = await Promise.all([dialog.boundingBox(), pill.boundingBox()]);
		return pillBox!.y - sheetBox!.y - sheetBox!.height;
	}).toBeCloseTo(4, 0);
	expect((await dialog.boundingBox())!.height).toBeLessThanOrEqual(844 * 0.7);

	const body = page.locator('body');
	const userSelect = await body.evaluate((element) => element.style.userSelect);
	const field = (await input.boundingBox())!;
	await page.mouse.move(field.x + field.width / 2, field.y + field.height / 2);
	await page.mouse.down();
	try {
		expect(await body.evaluate((element) => element.style.userSelect)).toBe(userSelect);
	} finally {
		await page.mouse.up();
	}

	await input.fill('Morning service');
	await last.scrollIntoViewIfNeeded();
	await expect(last).toBeInViewport({ ratio: 1 });
	await last.focus();
	await page.keyboard.press('Tab');
	await expect(dialog.getByRole('button', { name: 'Close controls', exact: true })).toBeFocused();
	await last.focus();
	const scrollTop = await dialog.evaluate((element) => element.scrollTop);
	expect(scrollTop).toBeGreaterThan(0);
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await expect(pill).toBeFocused();

	await pill.click();
	await expect(input).toHaveValue('Morning service');
	expect(await dialog.evaluate((element) => element.scrollTop)).toBe(scrollTop);
	await last.click();
	await expect(page).toHaveURL(/#last-section$/);
	await expect(panel).toBeHidden();
	await expect(pill).toBeFocused();

	await pill.click();
	await expect(dialog).toBeVisible();
	const pageScroll = await page.evaluate(() => window.scrollY);
	await page.mouse.move(5, 10);
	await page.mouse.wheel(0, -250);
	await page.evaluate(() => new Promise<void>((resolve) => {
		requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
	}));
	expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
	await page.mouse.click(5, 10);
	await expect(panel).toBeHidden();
	await expect(pill).toBeFocused();

	await pill.click();
	await dialog.getByRole('button', { name: 'Apply controls' }).click();
	await expect(panel).toBeHidden();
	await expect(pill).toBeFocused();

	await pill.click();
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.getByRole('complementary', { name: 'Controls' }).getByText('Presentation: desktop')).toBeVisible();
	await expect(input).toHaveValue('Morning service');
	await expect(pill).toBeHidden();

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(panel).toBeHidden();
	await pill.click();
	await expect(input).toHaveValue('Morning service');
	expect(await input.evaluate((input, saved) =>
		input === saved.input && input.closest('[data-slot="surface-rail"]')?.parentElement === saved.parent, original)).toBe(true);
	await original.dispose();

	await dialog.getByRole('button', { name: 'Hide controls' }).click();
	await expect(pill).toHaveCount(0);
	await expect(panel).toBeHidden();
	await page.getByRole('button', { name: 'Show controls' }).click();
	await pill.click();
	await expect(input).toHaveValue('Morning service');
});

test('Controls show and hide without animation @motion', async ({ page }) => {
	await openLongReport(page);
	const panel = page.locator('.surface-rail-sheet');
	const pill = page.locator('.surface-rail-pill');
	await pill.click();
	await expect(panel).toBeVisible();
	await expect(panel).toHaveCSS('transition-duration', '0s');
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await expect(panel).toHaveCSS('transition-duration', '0s');
	await expect(pill).toBeFocused();
});
