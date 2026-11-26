import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { GALLERY_THEMES, openGallery } from './gallery.js';

const hint = 'Read how planned service changes affect connections and accessible boarding.';

test.beforeEach(({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets every width and text size');
});

for (const theme of GALLERY_THEMES) {
	for (const [width, textSize] of [[320, 200], [390, 100], [390, 200], [1440, 100]] as const) {
		test(`${theme}, ${width}px, ${textSize}% text: sheet insets and tooltip interaction`, async ({ page }, testInfo) => {
			await page.setViewportSize({ width, height: 900 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await openGallery(page, theme);
			await page.locator('html').evaluate((node, scale) => { node.style.fontSize = `${scale}%`; }, textSize);

			await page.getByRole('button', { name: 'Open schedule note' }).click();
			const sheet = page.getByRole('dialog', { name: 'Schedule note' });
			await expect(sheet).toBeVisible();
			const insets = await sheet.evaluate(node => ['header', 'body', 'footer'].map(part => {
				const style = getComputedStyle(node.querySelector(`[data-slot="sheet-${part}"]`)!);
				return [style.paddingInlineStart, style.paddingInlineEnd];
			}));
			const inset = `${16 * textSize / 100}px`;
			expect(insets).toEqual(Array.from({ length: 3 }, () => [inset, inset]));
			expect((await new AxeBuilder({ page }).include('[data-slot="sheet-content"]').analyze()).violations).toEqual([]);
			await sheet.getByRole('button', { name: 'Done' }).click();
			await expect(sheet).toBeHidden();

			const trigger = page.getByRole('link', { name: 'Service guide' });
			const tooltip = page.getByRole('tooltip');
			await trigger.hover();
			await expect(tooltip).toBeVisible();
			await expect(trigger).toHaveAccessibleDescription(hint);
			const bounds = () => tooltip.evaluate(node => {
				const box = node.getBoundingClientRect();
				const wrapper = node.parentElement!.getBoundingClientRect();
				const left = Math.min(box.left, wrapper.left);
				const right = Math.max(box.right, wrapper.right);
				const viewport = document.documentElement;
				return { left, right, top: box.top, bottom: box.bottom, width: viewport.clientWidth, height: viewport.clientHeight };
			});
			await expect.poll(async () => {
				const box = await bounds();
				return Math.max(-box.left, box.right - box.width, -box.top, box.bottom - box.height);
			}).toBeLessThanOrEqual(1);
			const measuredBounds = await bounds();
			await testInfo.attach('sheet-insets-and-tooltip-bounds', {
				body: JSON.stringify({ insets, tooltip: measuredBounds }),
				contentType: 'application/json',
			});
			await expect(page.locator('[data-gallery-family="primitive:tooltip"]').getByRole('tooltip')).toHaveCount(0);
			await expect(tooltip).toHaveCSS('font-size', `${15 * textSize / 100}px`);
			await expect(tooltip).toHaveCSS('animation-name', 'none');
			const pointerStart = await trigger.boundingBox();
			const pointerEnd = await tooltip.boundingBox();
			await page.mouse.move(pointerStart!.x + pointerStart!.width / 2, pointerStart!.y + pointerStart!.height / 2);
			await page.mouse.move(pointerEnd!.x + pointerEnd!.width / 2, pointerEnd!.y + pointerEnd!.height / 2, { steps: 12 });
			await expect(tooltip).toBeVisible();
			expect((await new AxeBuilder({ page })
				.include('[data-gallery-family="primitive:tooltip"]')
				.include('[data-slot="tooltip-content"]')
				.analyze()).violations).toEqual([]);
			await expect(tooltip).toBeVisible();
			await page.keyboard.press('Escape');
			await expect(tooltip).toBeHidden();

			await page.mouse.move(0, 0);
			await trigger.focus();
			await expect(tooltip).toBeVisible();
			await expect(trigger).toHaveAccessibleName('Service guide');
			await expect(trigger).toHaveAccessibleDescription(hint);
			await page.keyboard.press('Escape');
			await expect(tooltip).toBeHidden();
			await expect(trigger).toBeFocused();
			await expect(trigger).toHaveAccessibleDescription('');
		});
	}
}
