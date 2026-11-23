import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

test('the floating panels move map labels to a clear point and leave the canvas on a phone', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/map-parts');
	const label = page.getByTestId('map-label');
	await expect(label).toBeVisible();
	await expect.poll(() => label.evaluate((element) => parseFloat(element.style.left))).toBeGreaterThan(100);
	const left = page.locator('[data-slot="map-overlays"]');
	const right = page.getByRole('complementary', { name: 'Renseignements sur cet arrêt' });
	await expect(left).toHaveCSS('position', 'absolute');
	await expect(right).toHaveCSS('position', 'absolute');
	const cardEnd = page.getByTestId('spread-end');
	await expect.poll(() => cardEnd.evaluate((element) => {
		const content = element.getBoundingClientRect();
		const card = element.parentElement!.getBoundingClientRect();
		return card.bottom - content.bottom;
	})).toBeLessThan(22);

	await page.setViewportSize({ width: 320, height: 850 });
	await expect(left).toHaveCSS('position', 'static');
	await expect(right).toHaveCSS('position', 'static');
	await expect(label).toHaveCSS('left', '24px');
	await expect(page.getByRole('figure', { name: 'La station se situe au virage de la ligne 24' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('search, long choice labels and a card action stay reachable at 200% text', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 850 });
	await page.goto('/map-parts');
	await page.addStyleTag({ content: 'html { font-size: 200%; }' });
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	const search = page.getByRole('textbox', { name: 'Rechercher un arrêt' });
	const clear = page.getByRole('button', { name: 'Effacer la recherche' });
	await expect(clear).toHaveCount(0);
	await search.fill('  ');
	await expect(clear).toHaveCount(0);
	await search.fill('station');
	await clear.click();
	await expect(search).toHaveValue('');
	await expect(search).toBeFocused();
	await expect(clear).toHaveCount(0);
	const choice = page.getByRole('radio', { name: 'Vers la station Édouard-Montpetit' });
	await choice.press('ArrowRight');
	await expect(page.getByRole('radio', { name: 'Vers le terminus de correspondance' })).toBeChecked();
	for (const locator of [
		choice,
		page.getByRole('link', { name: 'Voir les correspondances à cet arrêt' }),
	]) {
		await locator.scrollIntoViewIfNeeded();
		await expect(locator).toBeInViewport();
		await expect.poll(() => locator.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
	}
	await expectNoHorizontalOverflow(page);
	await expectAccessible(page, { include: '[data-testid="map-parts"]' });
	await page.setViewportSize({ width: 390, height: 850 });
	await expectNoHorizontalOverflow(page);
});
