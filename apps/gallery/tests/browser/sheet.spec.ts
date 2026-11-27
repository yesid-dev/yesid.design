import { expect, test, type Locator } from '@playwright/test';
import { openGallery } from './gallery.js';

test('Sheet owns its motion styles and respects reduced motion', async ({ page }) => {
	for (const reducedMotion of ['no-preference', 'reduce'] as const) {
		await page.emulateMedia({ reducedMotion });
		await openGallery(page);
		for (const [trigger, title] of [
			['Open details', 'Operational detail'],
			['Open schedule note', 'Schedule note'],
			['Open report files', 'Download report files'],
		]) {
			await page.getByRole('button', { name: trigger }).click();
			const dialog = page.getByRole('dialog', { name: title });
			await expect(dialog).toBeVisible();
			await expect(dialog).toHaveCSS('animation-name', reducedMotion === 'reduce' ? 'none' : 'enter');
			if (reducedMotion === 'no-preference') {
				await expect(dialog).toHaveCSS('animation-duration', '0.2s');
				await expect(dialog).toHaveCSS('animation-timing-function', 'cubic-bezier(0.2, 0.8, 0.2, 1)');
			}
			await page.keyboard.press('Escape');
			await expect(dialog).toBeHidden();
		}
	}
});

async function box(locator: Locator) {
	const bounds = await locator.boundingBox();
	expect(bounds).not.toBeNull();
	return bounds!;
}

test('responsive Sheet keeps mobile geometry and contains desktop overflow and focus @theme', async ({ page }, testInfo) => {
	const theme = testInfo.project.name === 'dark' ? 'dark' : 'light';
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openGallery(page, theme);
	const opener = page.getByRole('button', { name: 'Open report files' });
	const dialog = page.getByRole('dialog', { name: 'Download report files' });
	const overlay = page.locator('[data-slot="sheet-overlay"]');
	const firstLink = dialog.getByRole('link', { name: 'summary.csv CSV' });

	for (const { width, height } of [
		{ width: 390, height: 844 },
		{ width: 1024, height: 768 },
		{ width: 1440, height: 900 },
	]) {
		await page.setViewportSize({ width, height });
		await opener.click();
		await expect(firstLink).toBeFocused();
		await expect(dialog).toHaveCSS('animation-name', 'none');
		await expect(overlay).toHaveCSS('animation-name', 'none');
		expect(await box(overlay)).toEqual({ x: 0, y: 0, width, height });
		const panel = await box(dialog);

		if (width === 390) {
			expect(panel.x).toBe(0);
			expect(panel.width).toBe(width);
			expect(panel.y + panel.height).toBeCloseTo(height, 0);
			expect(panel.height).toBeLessThanOrEqual(height * 0.9);
			await expect(dialog).toHaveCSS('border-bottom-left-radius', '0px');
		} else {
			expect(panel.width).toBe(640);
			expect(panel.height).toBeCloseTo(Math.min(height * 0.8, 704), 0);
			expect(panel.x * 2 + panel.width).toBeCloseTo(width, 0);
			expect(panel.y * 2 + panel.height).toBeCloseTo(height, 0);
			await expect(dialog).toHaveCSS('border-bottom-left-radius', '12px');
			await expect(overlay).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
			const cardColor = await page.evaluate(() => {
				const probe = document.createElement('div');
				probe.style.backgroundColor = 'var(--card)';
				document.body.append(probe);
				const color = getComputedStyle(probe).backgroundColor;
				probe.remove();
				return color;
			});
			await expect(dialog).toHaveCSS('background-color', cardColor);

			const header = dialog.locator('[data-slot="sheet-header"]');
			const body = dialog.locator('[data-slot="sheet-body"]');
			const footer = dialog.locator('[data-slot="sheet-footer"]');
			const close = dialog.getByRole('button', { name: 'Close report files' });
			expect(await box(close)).toMatchObject({ width: 44, height: 44 });
			await page.keyboard.press('Shift+Tab');
			await expect(close).toBeFocused();
			await page.keyboard.press('Tab');
			await expect(firstLink).toBeFocused();

			const headerBefore = await box(header);
			const footerBefore = await box(footer);
			await body.evaluate(node => { node.scrollTop = node.scrollHeight; });
			expect(await body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
			await expect(dialog.getByRole('heading', { name: 'Cite this report' })).toBeInViewport();
			expect(await box(header)).toEqual(headerBefore);
			expect(await box(footer)).toEqual(footerBefore);

			if (width === 1440) {
				await dialog.evaluate(node => node.style.setProperty('--sheet-center-width', '48rem'));
				expect((await box(dialog)).width).toBe(768);
			}
		}

		if (width === 1024) {
			await overlay.click({ position: { x: 10, y: 10 } });
		} else {
			await page.keyboard.press('Escape');
		}
		await expect(dialog).toBeHidden();
		await expect(opener).toBeFocused();
	}

	await opener.click();
	await page.setViewportSize({ width: 767, height: 844 });
	await expect.poll(async () => (await box(dialog)).width).toBe(767);
	await page.setViewportSize({ width: 768, height: 844 });
	await expect.poll(async () => (await box(dialog)).width).toBe(640);
	await expect(firstLink).toBeFocused();
	await dialog.getByRole('button', { name: 'Close report files' }).click();
	await expect(dialog).toBeHidden();
	await expect(opener).toBeFocused();
});
