import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const path = '/app-frame/controls-rail';

test.describe('D1 frame and network slot', { tag: '@theme' }, () => {
	for (const width of [320, 390]) {
		test(`both rails at ${width}px and 200% text`, async ({ page }) => {
			await page.setViewportSize({ width, height: 850 });
			await page.goto(path);
			await page.locator('html[data-gallery-ready]').waitFor();
			await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			const pill = page.getByTestId('nav-pill');
			const network = page.getByRole('combobox', { name: 'Network' });
			const networkPicker = network.locator('..');
			await expect(networkPicker.getByText('STM', { exact: true })).toBeVisible();
			await expect(network.locator('option:checked')).toHaveText('Montréal · STM');
			const pillBox = (await pill.boundingBox())!;
			const networkBox = (await network.boundingBox())!;
			expect(networkBox.y).toBeGreaterThanOrEqual(pillBox.y + pillBox.height);
			const controls = page.getByRole('button', { name: /Open controls/ });
			const evidence = page.getByRole('button', { name: /Open evidence/ });
			const controlsBox = (await controls.boundingBox())!;
			const evidenceBox = (await evidence.boundingBox())!;
			expect(evidenceBox.y + evidenceBox.height).toBeLessThan(controlsBox.y);
			await controls.press('Enter');
			const sheet = page.getByRole('dialog', { name: 'Controls' });
			await expect(sheet.getByRole('combobox', { name: 'Record period' })).toBeVisible();
			await expectAccessible(page);
			await sheet.getByRole('button', { name: 'Close controls' }).press('Enter');
			await expect(sheet).toBeHidden();
			await expect(controls).toBeFocused();
			await expectNoHorizontalOverflow(page);
		});
	}

	test('desktop controls are sticky and float over full viewport content', async ({ page }) => {
		await page.setViewportSize({ width: 1100, height: 820 });
		await page.goto(path);
		await page.locator('html[data-gallery-ready]').waitFor();
		const header = page.getByTestId('nav');
		const search = header.getByRole('searchbox', { name: 'Search reports' });
		const network = header.getByRole('combobox', { name: 'Network' });
		await expect(network.locator('option:checked')).toHaveText('Montréal · STM');
		const searchBox = (await search.boundingBox())!;
		const networkBox = (await network.boundingBox())!;
		expect(networkBox.x).toBeGreaterThanOrEqual(searchBox.x + searchBox.width);
		const main = page.getByRole('main', { name: 'Service workspace' });
		const rail = page.getByRole('complementary', { name: 'Controls' });
		await expect(rail).toHaveCSS('position', 'sticky');
		expect((await rail.boundingBox())!.x).toBeLessThan((await main.boundingBox())!.x);
		const headerHeight = (await header.boundingBox())!.height;
		await expect(page.getByTestId('chrome-size')).toHaveText(String(Math.ceil(headerHeight)));
		await page.getByRole('button', { name: 'Full viewport' }).click();
		await expect(rail).toHaveCSS('position', 'absolute');
		expect((await rail.boundingBox())!.x).toBeGreaterThan((await main.boundingBox())!.x);
		await expectNoHorizontalOverflow(page);
		await expectAccessible(page);
	});
});
