import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { statusGlyphSvg } from '../../../../packages/ui/src/brand/status-glyph.ts';

const path = '/map-legends';

test.describe('D3 map legends', { tag: '@theme' }, () => {
	test('opens the compact legend over the map and returns focus on Escape', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 850 });
		await page.goto(path);
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await expectNoHorizontalOverflow(page);
		const map = page.getByRole('region', { name: 'Live service map' });
		const trigger = map.getByRole('button', { name: 'Show map legend' });
		const panel = map.getByRole('region', { name: 'Show map legend' });
		const exclusions = page.getByTestId('map-legend-exclusions');
		await expect(trigger).toBeVisible();
		const target = (await trigger.boundingBox())!;
		expect(target.width).toBeGreaterThanOrEqual(44);
		expect(target.height).toBeGreaterThanOrEqual(44);
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(exclusions).toHaveAttribute('data-count', '1');
		await trigger.focus();
		await page.keyboard.press('Enter');
		await expect(panel.getByRole('button', { name: 'Live legend' })).toBeVisible();
		await expect(exclusions).toHaveAttribute('data-count', '2');
		await expect(panel.getByText('More than a minute before schedule')).toBeVisible();
		const label = (await page.getByTestId('map-legend-label').boundingBox())!;
		const card = (await panel.boundingBox())!;
		expect(label.x + label.width <= card.x || card.x + card.width <= label.x ||
			label.y + label.height <= card.y || card.y + card.height <= label.y).toBe(true);
		await page.keyboard.press('Tab');
		await expect(panel).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(panel).toBeHidden();
		await expect(trigger).toBeFocused();
		await expect(exclusions).toHaveAttribute('data-count', '1');
		await expectAccessible(page);
	});

	test('keeps the desktop legend below the panel and remembers its disclosure', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 950 });
		await page.goto(path);
		const map = page.getByRole('region', { name: 'Live service map' });
		const legend = map.getByRole('button', { name: 'Live legend' });
		const route = map.getByText('Route 24');
		const heading = (await route.boundingBox())!;
		const disclosure = (await legend.boundingBox())!;
		expect(disclosure.y).toBeGreaterThanOrEqual(heading.y + heading.height);
		await expect(map.getByRole('button', { name: 'Show map legend' })).toBeHidden();
		const statuses = map.getByRole('list', { name: 'Vehicle status' });
		await expect(statuses).toBeVisible();
		await legend.click();
		await expect(statuses).toBeHidden();
		await page.reload();
		await expect(legend).toHaveAttribute('aria-expanded', 'false');
		await expect(statuses).toBeHidden();
		await legend.click();
		await expect(statuses).toBeVisible();
		const scale = page.getByRole('list', { name: 'Late departures by stop' }).filter({ hasText: '30% or more' });
		await expect(scale.getByRole('listitem')).toHaveCount(5);
		await expect(page.getByText('Not enough observations to compare')).toBeVisible();
		await expectAccessible(page);
	});

	test('1440px switches to the compact legend at 200% text', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 950 });
		await page.goto(path);
		await page.locator('html[data-gallery-ready]').waitFor();
		const map = page.getByRole('region', { name: 'Live service map' });
		const trigger = map.getByRole('button', { name: 'Show map legend' });
		const title = map.getByRole('button', { name: 'Live legend' });
		await expect(title).toHaveCount(1);
		await expect(trigger).toHaveCount(0);

		const enlarged = await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await expect(trigger).toBeVisible();
		await expect(title).toHaveCount(0);
		await trigger.focus();
		await page.keyboard.press('Enter');
		const panel = map.getByRole('region', { name: 'Show map legend' });
		await expect(panel.getByRole('button', { name: 'Live legend' })).toBeVisible();
		await expect(title).toHaveCount(1);
		await expectAccessible(page);
		await expectNoHorizontalOverflow(page);
		await page.keyboard.press('Escape');
		await expect(panel).toBeHidden();
		await expect(trigger).toBeFocused();

		await enlarged.evaluate((style) => { style.parentNode?.removeChild(style); });
		await expect(title).toBeVisible();
		await expect(trigger).toHaveCount(0);
	});

	test('serializes the same status shapes that the inline marks render', async ({ page }) => {
		await page.goto(path);
		for (const status of ['early', 'on_time', 'late', 'severe', 'unknown'] as const) {
			const mark = page.locator(`[data-slot="status-mark"][data-status="${status}"] svg`);
			const { source, ink } = await mark.evaluate((svg) => {
				const copy = svg.cloneNode(true) as SVGElement;
				const ink = getComputedStyle(svg.querySelector('path')!).fill;
				copy.setAttribute('width', '32');
				copy.setAttribute('height', '32');
				copy.querySelector('path')!.setAttribute('fill', ink);
				return { source: new XMLSerializer().serializeToString(copy), ink };
			});
			const output = statusGlyphSvg(status, { size: 32, ink });
			const maxDiff = await page.evaluate(async ([a, b]) => {
				async function pixels(markup: string) {
					const canvas = document.createElement('canvas');
					canvas.width = canvas.height = 32;
					const context = canvas.getContext('2d')!;
					const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
					try {
						const image = new Image();
						image.src = url;
						await image.decode();
						context.drawImage(image, 0, 0);
						return context.getImageData(0, 0, 32, 32).data;
					} finally {
						URL.revokeObjectURL(url);
					}
				}
				const [inline, standalone] = await Promise.all([pixels(a), pixels(b)]);
				if (!inline.some((channel) => channel !== 0)) throw new Error('The inline status glyph did not render');
				return inline.reduce((max, channel, index) => Math.max(max, Math.abs(channel - standalone[index])), 0);
			}, [source, output]);
			expect(maxDiff).toBe(0);
		}
	});
});
