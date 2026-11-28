import { expect, test, type Locator } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

/**
 * Figures that break onto a second line, or reach past half the gap beside their own tile, where
 * they could meet a neighbouring figure.
 */
function misplacedFigures(strip: Locator) {
	return strip.locator('.day-strip-value').evaluateAll((figures) =>
		figures.flatMap((figure) => {
			const halfGap = Number.parseFloat(getComputedStyle(figure.closest('ol')!).columnGap) / 2;
			const range = document.createRange();
			range.selectNodeContents(figure);
			const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
			const text = range.getBoundingClientRect();
			const tile = figure.closest('li')!.getBoundingClientRect();
			const outside = Math.max(tile.left - text.left, text.right - tile.right);
			const pastReach = outside - halfGap;
			return lines > 1 || pastReach > 0.5 ? [{ figure: figure.textContent, lines, pastReach }] : [];
		}),
	);
}

function measure(strip: Locator) {
	return strip.getByRole('list').evaluate((list) => {
		const bounds = list.getBoundingClientRect();
		const tiles = [...list.children].map((tile) => {
			const { left, right, top, width } = tile.getBoundingClientRect();
			return {
				left: left - bounds.left,
				right: right - bounds.left,
				top: Math.round(top - bounds.top),
				width,
			};
		});
		const rows = [...new Set(tiles.map((tile) => tile.top))].map((top) =>
			tiles.filter((tile) => tile.top === top),
		);
		return { listWidth: bounds.width, rows };
	});
}

for (const { width, textSize } of [
	{ width: 320, textSize: 100 },
	{ width: 320, textSize: 200 },
	{ width: 390, textSize: 100 },
	{ width: 1440, textSize: 100 },
]) {
	test(`every day tile has one width at ${width}px and ${textSize}% text`, async ({ page }, info) => {
		test.skip(info.project.name !== 'desktop', 'the test sets its own widths');
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/day-strip-tiles');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.addStyleTag({ content: `html { font-size: ${textSize}%; }` });
		await page.evaluate(() => document.fonts.ready);

		const geometry = {
			card: await measure(page.getByTestId('strip-card')),
			ten: await measure(page.getByTestId('strip-ten')),
			short: await measure(page.getByTestId('strip-short')),
		};
		await info.attach('day-strip-geometry', {
			body: JSON.stringify({ width, textSize, geometry }),
			contentType: 'application/json',
		});

		// Ten days wrap at every width here, so the case cannot pass on a single row.
		expect(geometry.ten.rows.length).toBeGreaterThan(1);
		if (width < 600) expect(geometry.card.rows.length, 'the week in a card wraps').toBeGreaterThan(1);

		for (const [name, { listWidth, rows }] of Object.entries(geometry)) {
			const widths = rows.flat().map((tile) => tile.width);
			expect(
				Math.max(...widths) - Math.min(...widths),
				`${name} tile widths ${widths.join(', ')}`,
			).toBeLessThanOrEqual(0.5);
			expect(rows[0]![0]!.left, `${name} first row start`).toBeCloseTo(0, 0);
			expect(
				Math.abs(rows[0]!.at(-1)!.right - listWidth),
				`${name} first row end`,
			).toBeLessThanOrEqual(0.5);
			for (const tile of rows.flat()) {
				expect(tile.right, `${name} tile inside the strip`).toBeLessThanOrEqual(listWidth + 0.5);
			}
		}
		for (const [name, { listWidth }] of Object.entries(geometry)) {
			const misplaced = await misplacedFigures(page.getByTestId(`strip-${name}`));
			// A strip narrower than one minimum tile (3.3rem) can only wrap a long figure.
			const narrowerThanATile = listWidth < (3.3 * 16 * textSize) / 100;
			expect(
				narrowerThanATile ? misplaced.filter(({ pastReach }) => pastReach > 0.5) : misplaced,
				`${name} figures`,
			).toEqual([]);
		}
		await expectNoHorizontalOverflow(page);
	});
}

test('a figure stays on one line inside its tile at every strip width', async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop', 'the test sets the strip width itself');
	await page.goto('/day-strip-tiles');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
	const strip = page.getByTestId('strip-ten').locator('[data-slot="day-strip"]');

	// Every column count from three to seven passes through its narrowest tile here.
	for (let width = 180; width <= 420; width += 1) {
		await strip.evaluate((element, px) => { element.style.inlineSize = `${px}px`; }, width);
		expect(await misplacedFigures(strip), `strip width ${width}px`).toEqual([]);
	}

	// A longer figure than the tile holds wraps instead of running into its neighbours.
	await strip.evaluate((element) => { element.style.inlineSize = '200px'; });
	const long = strip.locator('.day-strip-value').first();
	await long.evaluate((element) => { element.textContent = '10 h 30 min'; });
	const [wrapped] = await misplacedFigures(strip);
	expect(wrapped!.lines).toBeGreaterThan(1);
	expect(wrapped!.pastReach).toBeLessThanOrEqual(0.5);
});
