import { expect, test, type Page } from '@playwright/test';
import { expectAccessible } from '@yesid/config/playwright';

async function holdAppModules(page: Page) {
	const { promise, resolve } = Promise.withResolvers<void>();
	await page.route('**/_app/immutable/**/*.js', async (route) => {
		await promise;
		await route.fallback();
	});
	return resolve;
}

test('a collapsed filter signals that it is unavailable until it can respond', async ({ page }) => {
	const release = await holdAppModules(page);
	const example = '#mode-filter';
	const group = page.locator(example);
	const toggle = group.getByRole('button', { name: 'Mode', exact: true });
	const ready = page.locator('html[data-gallery-ready]');
	try {
		await page.goto('/filter-group', { waitUntil: 'domcontentloaded' });
		await page.evaluate(() => document.fonts.ready);
		await expect(ready).toHaveCount(0);
		await expect(toggle).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toBeDisabled();
		await expect(toggle).toHaveCSS('cursor', 'not-allowed');
		await expect(toggle).not.toHaveCSS('opacity', '1');

		const panelId = await toggle.getAttribute('aria-controls');
		expect(panelId).toBeTruthy();
		const panel = group.locator(`[id="${panelId}"]`);
		await expect(panel).toHaveAttribute('inert', '');
		await toggle.scrollIntoViewIfNeeded();
		const before = (await toggle.boundingBox())!;
		await page.mouse.click(before.x + before.width / 2, before.y + before.height / 2);
		await expect(toggle).not.toBeFocused();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expectAccessible(page, { include: example });

		release();
		await ready.waitFor();
		await expect(toggle).toBeEnabled();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect(await toggle.boundingBox()).toEqual(before);
		await expect(toggle).toHaveAttribute('aria-controls', panelId!);

		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		const options = panel.getByRole('group', { name: 'Mode' });
		await expect(options.getByRole('radio', { name: 'Tram' })).toBeChecked();
		const bus = options.getByRole('radio', { name: 'Bus' });
		await bus.click();
		await expect(bus).toBeChecked();
		await expectAccessible(page, { include: example });

		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(panel).toHaveAttribute('inert', '');
		await expect(options).toHaveCount(0);
	} finally {
		release();
	}
});

test('visible filter choices and the reset are unavailable until they can respond', async ({ page }) => {
	const release = await holdAppModules(page);
	const options = page.getByRole('group', { name: 'Direction' });
	const reset = options.getByRole('radio', { name: 'All directions' });
	const east = options.getByRole('radio', { name: 'Eastbound' });
	try {
		await page.goto('/reading-record', { waitUntil: 'domcontentloaded' });
		await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);
		await expect(east).toBeVisible();
		await expect(east).toBeDisabled();
		await expect(east).toHaveCSS('cursor', 'not-allowed');
		await expect(east).not.toHaveCSS('opacity', '1');
		await expect(reset).toBeDisabled();
		await expect(reset).toBeChecked();

		release();
		await expect(east).toBeEnabled();
		await east.click();
		await expect(east).toBeChecked();
		await reset.click();
		await expect(reset).toBeChecked();
	} finally {
		release();
	}
});
