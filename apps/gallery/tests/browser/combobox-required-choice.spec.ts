import { expect, test } from '@playwright/test';
import { expectAccessible } from '@yesid/config/playwright';

import { openGallery } from './gallery.js';

test('a combobox with clearable={false} keeps its value through the keyboard', async ({ page }) => {
	await openGallery(page);
	const family = page.locator('[data-gallery-family="primitive:combobox"]');
	const demo = family.locator('[data-gallery-demo="combobox-required-choice"]');
	const combobox = demo.getByRole('combobox', { name: 'Rank by measure' });
	const listbox = page.getByRole('listbox', { name: 'Rank by measure' });
	const ranked = family.getByText(/^Ranked by:/);
	await demo.scrollIntoViewIfNeeded();

	// No clear button: the list trigger is the only button.
	await expect(combobox).toHaveValue('Response time');
	await expect(demo.getByRole('button')).toHaveCount(1);
	await expect(demo.getByRole('button')).toHaveAccessibleName('Rank by measure');

	// Empty the field, then press the keys that would clear an ordinary field.
	await combobox.selectText();
	await combobox.press('Delete');
	await expect(listbox).toBeVisible();
	await expect(combobox).toHaveValue('');
	await expect(listbox.getByRole('option')).toHaveCount(3);
	await combobox.press('Backspace');
	await combobox.press('Delete');
	await expectAccessible(page);
	await combobox.press('Escape');
	await expect(listbox).toBeHidden();
	await expect(combobox).toHaveValue('Response time');
	await expect(ranked).toHaveText('Ranked by: response-time');

	// Picking the chosen option again keeps it.
	await combobox.press('ArrowDown');
	await expect(listbox.getByRole('option', { name: /Response time/ })).toHaveAttribute('data-highlighted', '');
	await combobox.press('Enter');
	await expect(listbox).toBeHidden();
	await expect(combobox).toHaveValue('Response time');
	await expect(ranked).toHaveText('Ranked by: response-time');

	// Typing still filters, and Enter picks the match.
	await combobox.press('ArrowDown');
	await expect(listbox).toBeVisible();
	await combobox.fill('error');
	await expect(listbox.getByRole('option')).toHaveCount(1);
	await combobox.press('Enter');
	await expect(listbox).toBeHidden();
	await expect(combobox).toHaveValue('Error rate');
	await expect(ranked).toHaveText('Ranked by: error-rate');
	await expect(demo.getByRole('button')).toHaveCount(1);
	await expectAccessible(page);
});
