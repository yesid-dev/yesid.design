import { expect, test, type Locator } from '@playwright/test';
import { openGallery } from './gallery.js';

async function expectCentred(field: Locator, icon: Locator, target: Locator) {
	await expect(icon).toBeVisible();
	const fieldBox = (await field.boundingBox())!;
	const iconBox = (await icon.boundingBox())!;
	const targetBox = (await target.boundingBox())!;
	expect(Math.abs(iconBox.y + iconBox.height / 2 - fieldBox.y - fieldBox.height / 2)).toBeLessThanOrEqual(1);
	expect(Math.abs(iconBox.x + iconBox.width / 2 - targetBox.x - targetBox.width / 2)).toBeLessThanOrEqual(1);
	expect(targetBox.width).toBeCloseTo(44);
	expect(targetBox.height).toBeCloseTo(44);
}

test('both combobox modes centre the disclosure and the searchable field centres its clear action', async ({ page }) => {
	await openGallery(page);
	const family = page.locator('[data-gallery-family="primitive:combobox"]');
	const search = family.locator('[data-gallery-state="localized-copy"] [data-slot="combobox"]');
	const input = search.locator('[data-slot="combobox-input"]');
	const open = search.locator('[data-slot="combobox-trigger"]');
	const select = family.locator('[data-gallery-demo="combobox-select-only"] [data-slot="combobox-trigger"]');
	const selectAffordance = select.locator('.combobox-select-chevron');

	await input.scrollIntoViewIfNeeded();
	await expectCentred(input, open.locator('svg'), open);
	await expectCentred(select, selectAffordance.locator('svg'), selectAffordance);
	const searchableHeight = (await input.boundingBox())!.height;
	const selectHeight = (await select.boundingBox())!.height;
	expect(searchableHeight).toBeCloseTo(44);
	expect(selectHeight).toBeCloseTo(searchableHeight);

	await open.click();
	await expectCentred(input, open.locator('svg'), open);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('listbox', { name: 'Choisir une vue opérationnelle' })).toBeHidden();
	const clear = search.locator('[data-slot="combobox-clear"]');
	await expectCentred(input, clear.locator('svg'), clear);
	expect((await input.boundingBox())!.height).toBeCloseTo(searchableHeight);

	await select.press('Enter');
	await expectCentred(select, selectAffordance.locator('svg'), selectAffordance);
	await page.getByRole('listbox', { name: 'Reporting period' }).getByRole('option').first().click();
	expect((await select.boundingBox())!.height).toBeCloseTo(selectHeight);
});
