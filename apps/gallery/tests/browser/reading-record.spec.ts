import { expect, test } from '@playwright/test';

for (const language of ['en', 'fr', 'es']) {
 for (const theme of ['dark', 'light']) {
  test(`reading record ${language} ${theme}`, async ({ page }) => {
   await page.addInitScript(value => localStorage.setItem('theme', value), theme);
   await page.goto('/reading-record');
   await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
   await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
   await page.getByRole('combobox').selectOption(language);
   await expect(page.locator('article')).toHaveAttribute('lang', language);
   for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const field = page.getByRole('searchbox');
    expect(await field.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    const values = await page.locator('[data-slot="metric-display"] .metric-value').evaluateAll(els => els.map(el => ({color:getComputedStyle(el).color, figures:getComputedStyle(el).fontVariantNumeric})));
    expect(values[0].figures).toContain('tabular-nums');
    expect(values[0].color).toBe(await page.locator('article').evaluate(el => getComputedStyle(el).color));
    const radios = page.getByRole('radiogroup').first().getByRole('radio');
    const boxes = await Promise.all((await radios.all()).map(el => el.boundingBox()));
    if (width >= 390) expect(new Set(boxes.map(box => box?.y)).size).toBe(1);
    if (width < 640) {
     const label = await page.locator('[data-slot="metric-display"]').first().locator('.label-metric').boundingBox();
     const value = await page.locator('.metric-value').first().boundingBox();
     expect(Math.abs(label!.y - value!.y)).toBeLessThan(20);
    }
   }
   const search = page.getByRole('searchbox');
   await search.fill('Peel');
   await expect(page.locator('section').first().getByRole('listitem')).toHaveCount(1);
   await search.focus(); await expect(search).toBeFocused();
   const filter = page.locator('div[data-selected-style="consistent"]');
   const selected = filter.getByRole('radio', {checked:true});
   const resetColor = await selected.evaluate(el => getComputedStyle(el).backgroundColor);
   await filter.getByRole('radio').nth(1).click();
   await expect(filter.getByRole('radio').nth(1)).toBeChecked();
   await expect(filter.getByRole('radio').nth(1)).toHaveCSS('background-color', resetColor);
   const region = page.getByRole('region').filter({ has: page.getByRole('table') });
   await region.focus(); await expect(region).toBeFocused();
   await expect(page.locator('th[scope="row"]')).toHaveCount(2);
   await expect(page.locator('dl dt')).toHaveCount(2);
   await expect(page.locator('[data-member]')).toHaveCount(25);
   const row = page.locator('[data-member="25"]');
   await row.getByRole('button').click();
   await expect(row.getByRole('group')).toBeVisible();
   await row.getByRole('group').getByRole('button').last().click();
   await expect(row.getByRole('group')).toHaveCount(0);
   await row.getByRole('button').click();
   await row.getByRole('group').getByRole('button').first().click();
   await expect(row.getByRole('button')).toHaveCount(0);
  });
 }
}
