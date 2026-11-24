import { expect, test } from '@playwright/test';
import { ratio } from '../../../../packages/gates/src/engines/contrastPairs.js';

test('a disabled View keeps Record selected and readable without adding a Tab stop', { tag: '@theme' }, async ({ page }, info) => {
 await page.setViewportSize({ width: 320, height: 900 });
 await page.goto('/reading-record');
 await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
 await expect(page.locator('html')).toHaveAttribute('data-theme', info.project.name);
 await page.addStyleTag({ content: 'html { font-size: 200%; }' });
 const view = page.getByRole('radiogroup', { name: 'View' });
 const record = view.getByRole('radio', { name: 'Record', checked: true });
 const live = view.getByRole('radio', { name: 'Live now', checked: false });
 await expect(record).toBeDisabled();
 await expect(live).toBeDisabled();
 await expect(record).toHaveCSS('opacity', '1');
 await expect(live).toHaveCSS('opacity', '0.4');

 const period = page.getByRole('radiogroup').first().getByRole('radio', { checked: true });
 const selectedStyle = await period.evaluate(element => {
  const style = getComputedStyle(element);
  return { ink: style.color, fill: style.backgroundColor };
 });
 await expect(record).toHaveCSS('color', selectedStyle.ink);
 await expect(record).toHaveCSS('background-color', selectedStyle.fill);
 await period.focus();
 await page.keyboard.press('Tab');
 await expect(page.locator('[data-selected-style="consistent"]').getByRole('radio', { checked: true })).toBeFocused();
 await expect(record).toBeChecked();
 const colors = await record.evaluate(element => {
  const style = getComputedStyle(element);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d')!;
  return [style.color, style.backgroundColor].map(color => {
   context.clearRect(0, 0, 1, 1);
   context.fillStyle = color;
   context.fillRect(0, 0, 1, 1);
   const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
   if (alpha !== 255) throw new Error('Expected an opaque selected color');
   return '#' + [r!, g!, b!].map(channel => channel.toString(16).padStart(2, '0')).join('');
  });
 });
 const contrast = ratio(colors[0]!, colors[1]!);
 await info.attach('selected-disabled-contrast', { body: JSON.stringify({ colors, contrast }), contentType: 'application/json' });
 expect(contrast).toBeGreaterThanOrEqual(4.5);

 await page.emulateMedia({ forcedColors: 'active' });
 await expect(record).toBeChecked();
 await expect(record).toBeDisabled();
 const selectedFill = await record.evaluate(element => getComputedStyle(element).backgroundColor);
 expect(selectedFill).not.toBe('rgba(0, 0, 0, 0)');
 await expect(live).not.toHaveCSS('background-color', selectedFill);
});

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
    const readingLabel = page.locator('[data-slot="metric-display"]').first().locator('.label-reading');
    await expect(readingLabel).toHaveCSS('text-transform', 'none');
    expect(await readingLabel.evaluate(el => getComputedStyle(el).fontFamily)).toContain('Inter');
    await expect(page.locator('[data-slot="metric-display"]').nth(1).locator('.label-metric')).toHaveCSS('text-transform', 'uppercase');
    const radios = page.getByRole('radiogroup').first().getByRole('radio');
    const boxes = await Promise.all((await radios.all()).map(el => el.boundingBox()));
    if (width >= 390) expect(new Set(boxes.map(box => box?.y)).size).toBe(1);
    if (width < 640) {
     const label = await readingLabel.boundingBox();
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
