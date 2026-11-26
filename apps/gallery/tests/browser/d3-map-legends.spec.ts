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

	test('keeps measuring the map when route details unmount at phone width', async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.setViewportSize({ width: 1440, height: 950 });
		await page.goto(path);
		await page.locator('html[data-gallery-ready]').waitFor();

		const map = page.getByRole('region', { name: 'Live service map' });
		const details = map.getByRole('complementary', { name: 'Route details' });
		const stage = map.locator('[data-slot="map-stage"]');
		const measurements = page.getByTestId('map-legend-exclusions');
		await expect(details).toBeVisible();
		await expect(measurements).toHaveAttribute('data-count', '2');

		await page.setViewportSize({ width: 390, height: 844 });
		await expect(details).toHaveCount(0);
		await expect(map.getByRole('button', { name: 'Show map legend' })).toBeVisible();
		await page.setViewportSize({ width: 320, height: 844 });
		const phoneWidth = await stage.evaluate((element) => element.getBoundingClientRect().width);
		expect(errors).toEqual([]);
		await expect(measurements).toHaveAttribute('data-width', String(phoneWidth));
		await expect(measurements).toHaveAttribute('data-count', '1');

		await page.setViewportSize({ width: 1440, height: 950 });
		await expect(details).toBeVisible();
		await expect(measurements).toHaveAttribute('data-count', '2');
		expect(errors).toEqual([]);
	});

	test('a filling frame takes its short host height and docks its legend at the start', async ({ page }) => {
		await page.setViewportSize({ width: 844, height: 390 });
		await page.goto(path);
		await page.locator('html[data-gallery-ready]').waitFor();
		const host = (await page.getByTestId('short-map-host').boundingBox())!;
		const filling = page.getByRole('region', { name: 'Map in a short host' });
		const stage = (await filling.locator('[data-slot="map-stage"]').boundingBox())!;
		expect(host.height).toBeLessThan(320);
		expect(stage.y).toBeCloseTo(host.y, 0);
		expect(stage.height).toBeCloseTo(host.height, 0);
		const live = page.getByRole('region', { name: 'Live service map' });
		const liveStage = (await live.locator('[data-slot="map-stage"]').boundingBox())!;
		expect(liveStage.height).toBeGreaterThanOrEqual(320);

		const inset = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75);
		const start = filling.getByRole('button', { name: 'Open the short map legend' });
		const end = live.getByRole('button', { name: 'Show map legend' });
		const startBox = (await start.boundingBox())!;
		const endBox = (await end.boundingBox())!;
		expect(startBox.x - stage.x).toBeCloseTo(inset, 0);
		expect(liveStage.x + liveStage.width - (endBox.x + endBox.width)).toBeCloseTo(inset, 0);
		await start.click();
		const card = filling.getByRole('region', { name: 'Open the short map legend' });
		await expect(card.getByText('Short map legend')).toBeVisible();
		expect((await card.boundingBox())!.x - stage.x).toBeCloseTo(inset, 0);
		await expectNoHorizontalOverflow(page);
	});

	test('an inline legend sets each detail on its bold label line, after the scale', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 950 });
		await page.goto(path);
		const legend = page.getByTestId('inline-legend');
		const scale = legend.getByRole('list', { name: 'Crowding by trip' });
		const groups = legend.getByRole('list', { name: 'Service frequency' });
		const groupsHandle = await groups.elementHandle();
		expect(await scale.evaluate(
			(ramp, list) => Boolean(ramp.compareDocumentPosition(list!) & Node.DOCUMENT_POSITION_FOLLOWING),
			groupsHandle,
		)).toBe(true);
		const layout = await groups.getByRole('listitem').first().evaluate((item) => {
			const text = item.lastElementChild as HTMLElement;
			const detail = text.querySelector<HTMLElement>('.detail')!;
			const range = document.createRange();
			range.selectNodeContents(text.firstChild!);
			const label = [...range.getClientRects()].at(-1)!;
			const first = detail.getClientRects()[0];
			return {
				labelWeight: getComputedStyle(text).fontWeight,
				detailWeight: getComputedStyle(detail).fontWeight,
				text: text.textContent,
				sameLine: first.top < label.bottom && first.bottom > label.top && first.left >= label.right,
			};
		});
		expect(layout).toEqual({
			labelWeight: '600', detailWeight: '400', text: 'Frequent every ten minutes or better, all day', sameLine: true,
		});
		await expectAccessible(page, { include: '[data-testid="inline-legend"]' });
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
