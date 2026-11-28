import { expect, test, type Locator } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, expectTapTargets } from '@yesid/config/playwright';

const REGION_GAP = 12;
const CARD_GAP = 16;

const CARDS = {
	full: ['search', 'summary', 'sort', 'results', 'more'],
	sparse: ['search', 'results'],
	results: ['results'],
	titled: ['header', 'sort', 'results'],
} as const;

/** Every top and left is relative to the card's content box (inside its border and padding). */
function measure(card: Locator) {
	return card.evaluate((element) => {
		const style = getComputedStyle(element);
		const px = (value: string) => Number.parseFloat(value);
		const rect = element.getBoundingClientRect();
		const originTop = rect.top + px(style.borderTopWidth) + px(style.paddingTop);
		const originLeft = rect.left + px(style.borderLeftWidth) + px(style.paddingLeft);
		const box = (node: Element) => {
			const { top, bottom, left, width, height } = node.getBoundingClientRect();
			return {
				top: top - originTop,
				bottom: bottom - originTop,
				left: left - originLeft,
				width,
				height,
			};
		};
		const body = element.querySelector(':scope > [data-slot="listing-body"]')!;
		const bodyStyle = getComputedStyle(body);

		return {
			cardPadding: px(style.paddingTop),
			contentWidth:
				rect.width -
				px(style.borderLeftWidth) -
				px(style.borderRightWidth) -
				px(style.paddingLeft) -
				px(style.paddingRight),
			cardColor: style.color,
			header: box(element.querySelector(':scope > header')!),
			footer: box(element.querySelector(':scope > footer')!),
			body: box(body),
			bodyPaint: {
				padding: bodyStyle.padding,
				borderWidth: bodyStyle.borderWidth,
				backgroundColor: bodyStyle.backgroundColor,
				backgroundImage: bodyStyle.backgroundImage,
				color: bodyStyle.color,
			},
			regions: [...body.children].map((child) => ({
				slot: child.getAttribute('data-slot')!.replace('listing-body-', ''),
				position: getComputedStyle(child).position,
				...box(child),
			})),
		};
	});
}

test('regions sit 12px apart inside the parent card, and absent regions take no space', async ({ page }, info) => {
	await page.goto('/listing-body/regions');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);

	const geometry: Record<string, Awaited<ReturnType<typeof measure>>> = {};

	for (const [name, expected] of Object.entries(CARDS)) {
		const measured = await measure(page.getByTestId(`regions-card-${name}`));
		geometry[name] = measured;
		const { header, footer, body, bodyPaint, regions } = measured;

		expect(bodyPaint, name).toEqual({
			padding: '0px',
			borderWidth: '0px',
			backgroundColor: 'rgba(0, 0, 0, 0)',
			backgroundImage: 'none',
			color: measured.cardColor,
		});
		expect(body.left, `${name} body left`).toBeCloseTo(0, 1);
		expect(body.width, `${name} body width`).toBeCloseTo(measured.contentWidth, 1);
		expect(body.top - header.bottom, `${name} title to body`).toBeCloseTo(CARD_GAP, 1);
		expect(footer.top - body.bottom, `${name} body to evidence`).toBeCloseTo(CARD_GAP, 1);

		// The count status stays in the DOM, out of flow, so it adds nothing to the rhythm.
		for (const status of regions.filter((region) => region.slot === 'result-status')) {
			expect(status.position, `${name} status position`).toBe('absolute');
			expect([status.width, status.height], `${name} status size`).toEqual([1, 1]);
		}

		const visible = regions.filter((region) => region.slot !== 'result-status');
		expect(visible.map((region) => region.slot), name).toEqual(expected);
		expect(visible[0]!.top, `${name} first region top`).toBeCloseTo(body.top, 1);
		expect(visible.at(-1)!.bottom, `${name} last region bottom`).toBeCloseTo(body.bottom, 1);
		for (const [index, region] of visible.entries()) {
			expect(region.left, `${name} ${region.slot} left`).toBeCloseTo(0, 1);
			expect(region.height, `${name} ${region.slot} height`).toBeGreaterThan(0);
			if (index > 0) {
				const previous = visible[index - 1]!;
				expect(region.top - previous.bottom, `${name} ${previous.slot} to ${region.slot}`).toBeCloseTo(
					REGION_GAP,
					1,
				);
			}
		}
	}

	await info.attach('regions-geometry', {
		body: JSON.stringify({ width: page.viewportSize()!.width, geometry }),
		contentType: 'application/json',
	});
	await expectNoHorizontalOverflow(page);
	await expectTapTargets(page);
});

test('regions presentation is axe clean in light and dark', { tag: '@theme' }, async ({ page }, info) => {
	for (const width of [390, 1440] as const) {
		await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
		await page.goto('/listing-body/regions');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await expect(page.locator('html')).toHaveAttribute('data-theme', info.project.name);
		await page.evaluate(() => document.fonts.ready);
		await expectAccessible(page);
	}
});
