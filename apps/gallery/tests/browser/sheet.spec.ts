import { expect, test, type Locator, type Page } from '@playwright/test';
import { openGallery } from './gallery.js';

async function visitReportFiles(page: Page, path = '/sheet') {
	await page.goto(path);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
}

async function openReportFiles(page: Page) {
	const opener = page.getByRole('button', { name: 'Open report files' });
	await opener.click();
	const dialog = page.getByRole('dialog', { name: 'Download report files' });
	await expect(dialog).toBeVisible();
	return { opener, dialog };
}

test('Sheet owns its motion styles and respects reduced motion', async ({ page }) => {
	for (const reducedMotion of ['no-preference', 'reduce'] as const) {
		await page.emulateMedia({ reducedMotion });
		await openGallery(page);
		for (const [trigger, title, duration] of [
			['Open details', 'Operational detail', '0.5s'],
			['Open schedule note', 'Schedule note', '0.5s'],
			['Open report files', 'Download report files', '0.2s'],
		] as const) {
			if (trigger === 'Open report files') await visitReportFiles(page);
			await page.getByRole('button', { name: trigger }).click();
			const dialog = page.getByRole('dialog', { name: title });
			await expect(dialog).toBeVisible();
			await expect(dialog).toHaveCSS('animation-name', reducedMotion === 'reduce' ? 'none' : 'enter');
			if (reducedMotion === 'no-preference') {
				await expect(dialog).toHaveCSS('animation-duration', duration);
				if (trigger === 'Open report files') {
					await expect(dialog).toHaveCSS('animation-timing-function', 'cubic-bezier(0.2, 0.8, 0.2, 1)');
				}
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
	await visitReportFiles(page);
	await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
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
			const title = dialog.getByRole('heading', { name: 'Download report files' });
			await expect(title).toHaveCSS('font-size', '18px');
			await expect(title).toHaveCSS('font-weight', '600');
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
		}

		if (width === 1024) {
			await overlay.click({ position: { x: 10, y: 10 } });
		} else {
			await page.keyboard.press('Escape');
		}
		await expect(dialog).toBeHidden();
		await expect(opener).toBeFocused();
	}
});

test('an inline width override keeps a static centered Sheet clickable above its scrim', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.setViewportSize({ width: 1024, height: 768 });
	await visitReportFiles(page);
	await page.getByRole('button', { name: 'Use a wider centered window' }).click();
	const { dialog, opener } = await openReportFiles(page);
	expect((await box(dialog)).width).toBe(768);
	await expect(dialog).toHaveCSS('animation-duration', '0.2s');
	await expect(dialog.getByRole('heading', { name: 'Download report files' })).toHaveCSS('font-size', '18px');
	await dialog.getByRole('button', { name: 'Close report files' }).click();
	await expect(dialog).toBeHidden();
	await expect(opener).toBeFocused();
});

test('caller utilities override the responsive Sheet defaults at both sides of 768px', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 767, height: 768 });
	await visitReportFiles(page, '/sheet/custom');
	const { dialog } = await openReportFiles(page);

	for (const width of [767, 1024]) {
		await page.setViewportSize({ width, height: 768 });
		const panel = await box(dialog);
		expect(panel.width).toBe(width / 2);
		if (width < 768) {
			expect(panel.x).toBe(0);
			expect(panel.y + panel.height).toBeCloseTo(768, 0);
		} else {
			expect(panel.x * 2 + panel.width).toBeCloseTo(width, 0);
			expect(panel.y * 2 + panel.height).toBeCloseTo(768, 0);
		}
		await expect(dialog).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
		await expect(dialog).toHaveCSS('border-width', '0px');
		await expect(dialog).toHaveCSS('border-radius', '0px');
	}
});

test('reduced motion suppresses a caller opacity transition on Sheet Content', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await visitReportFiles(page, '/sheet/custom');
	const { dialog } = await openReportFiles(page);
	await expect(dialog).toHaveCSS('transition-property', 'opacity');

	await page.emulateMedia({ reducedMotion: 'reduce' });
	await expect(dialog).toHaveCSS('transition-property', 'none');
	const result = await dialog.evaluate(node => {
		const before = getComputedStyle(node).opacity;
		node.style.opacity = '0.25';
		return {
			before,
			after: getComputedStyle(node).opacity,
			transitions: node.getAnimations().filter(animation => animation instanceof CSSTransition).length,
		};
	});
	expect(result).toEqual({ before: '1', after: '0.25', transitions: 0 });
});

test('an open responsive Sheet switches geometry without layout transitions or lost focus', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.setViewportSize({ width: 1024, height: 768 });
	await visitReportFiles(page);
	const { dialog } = await openReportFiles(page);
	const firstLink = dialog.getByRole('link', { name: 'summary.csv CSV' });
	await expect(firstLink).toBeFocused();
	await dialog.evaluate(async node => {
		await Promise.all(node.getAnimations().map(animation => animation.finished));
		node.setAttribute('data-transitions', '');
		node.addEventListener('transitionrun', event => {
			if (event.target === node && event instanceof TransitionEvent) {
				node.setAttribute('data-transitions', `${node.getAttribute('data-transitions')} ${event.propertyName}`);
			}
		});
	});
	for (const [width, expected] of [[767, 767], [768, 640]]) {
		await page.setViewportSize({ width, height: 768 });
		await page.evaluate(() => new Promise<void>(resolve => {
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
		}));
		expect((await box(dialog)).width).toBe(expected);
		await expect(dialog).toHaveAttribute('data-transitions', '');
		await expect(firstLink).toBeFocused();
	}
});

test.describe('server layout', () => {
	test.use({ javaScriptEnabled: false });

	test('an initially open unportalled Sheet renders centered at desktop width', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/sheet/initially-open');
		const dialog = page.getByRole('dialog').filter({
			has: page.getByRole('heading', { name: 'Download report files' }),
		});
		await expect(dialog).toBeVisible();
		const panel = await box(dialog);
		expect(panel.width).toBe(640);
		expect(panel.x).toBe(192);
		expect(panel.y * 2 + panel.height).toBeCloseTo(768, 0);
	});
});
