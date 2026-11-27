import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const ROUTE = '/phone-rows-and-scroll-edges';
const TABLE_SCROLLPORT = '[data-slot="data-table-frame"][data-responsive="scroll"]';
const TABLE_SCROLLPORTS = `${TABLE_SCROLLPORT}, [data-slot="data-table-frame"][data-scrollable="true"]`;
const REPORTS_SORT = 'Sort by Fahrgastinformationssystemverfügbarkeitsberichte';
const EMPTY_ROW = 'tbody tr[data-row-empty]';

async function open(page: Page, width: number, textPercent = 100): Promise<void> {
	await page.setViewportSize({ width, height: 900 });
	await page.goto(ROUTE);
	await page.locator('html[data-gallery-ready]').waitFor();
	await page.evaluate(() => document.fonts.ready);
	if (textPercent !== 100) {
		await page.addStyleTag({ content: `html { font-size: ${textPercent}%; }` });
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	}
}

/** Asserts that no visible element or scroll fade extends more than 1px past the viewport or its scroll container. */
async function expectStrictContainment(page: Page): Promise<void> {
	await expectNoHorizontalOverflow(page);
	const violations = await page.evaluate((tableScrollport) => {
		const viewportRight = window.innerWidth;
		const issues: string[] = [];
		const root = document.querySelector('[data-testid="phone-rows-and-scroll-edges"]')!;

		// Compare each fade to the actual scrollport, including borders and scrollbars.
		for (const fade of root.querySelectorAll<HTMLElement>('[data-slot="scroll-fade-start"], [data-slot="scroll-fade-end"]')) {
			const style = getComputedStyle(fade);
			if (style.display === 'none') continue;
			const rect = fade.getBoundingClientRect();
			const table = fade.closest<HTMLElement>(tableScrollport);
			const scroller = table ?? fade.parentElement!.querySelector<HTMLElement>('.scroll')!;
			const box = scroller.getBoundingClientRect();
			const left = box.left + scroller.clientLeft;
			const right = left + scroller.clientWidth;
			const top = box.top + scroller.clientTop;
			const bottom = top + scroller.clientHeight;
			if (rect.left < left - 1 || rect.right > right + 1 || rect.top < top - 1 || rect.bottom > bottom + 1) {
				issues.push(`fade outside scrollport: ${fade.dataset.slot} [${rect.left}, ${rect.right}] vs [${left}, ${right}]`);
			}
			if (table) {
				const start = fade.dataset.slot === 'scroll-fade-start';
				const rtl = getComputedStyle(table).direction === 'rtl';
				const offset = start === rtl ? rect.right - right : rect.left - left;
				if (Math.abs(offset) > 1) issues.push(`table fade misses scrollport edge by ${offset}px`);
			} else if (rect.width > 0) {
				const heading = scroller.querySelector('tbody th')?.getBoundingClientRect();
				const rtl = getComputedStyle(scroller).direction === 'rtl';
				if (heading && (rtl ? rect.right > heading.left + 1 : rect.left < heading.right - 1)) {
					issues.push(`HourGrid fade overlaps the sticky heading: ${fade.dataset.slot}`);
				}
			}
			if (style.pointerEvents !== 'none') issues.push(`fade intercepts pointer events: ${fade.dataset.slot}`);
			if (rect.left < -1 || rect.right > viewportRight + 1) {
				issues.push(`fade crosses viewport: ${fade.dataset.slot} [${rect.left}, ${rect.right}] vs [0, ${viewportRight}]`);
			}
		}

		// Check descendant boxes outside horizontally scrolling regions, including clipped cells.
		for (const el of root.querySelectorAll<HTMLElement>('*')) {
			const scroller = el.closest(`.scroll, ${tableScrollport}`);
			if (scroller && scroller !== el) continue;
			const style = getComputedStyle(el);
			if (style.display === 'none' || style.visibility === 'hidden') continue;
			const rect = el.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) continue;
			if (rect.right > viewportRight + 1 || rect.left < -1) {
				issues.push(`${el.tagName.toLowerCase()}.${el.className} crosses viewport: [${rect.left}, ${rect.right}] vs [0, ${viewportRight}]`);
			}
		}
		return issues;
	}, TABLE_SCROLLPORTS);
	expect(violations).toEqual([]);
}

async function expectEmptyRowSemantics(row: Locator): Promise<void> {
	await expect(row).toMatchAriaSnapshot(`
		- row:
		  - /children: equal
		  - rowheader "West Depot":
		    - link "West Depot"
		  - cell "—"
		  - rowheader "No reports in this period."
		  - cell "0"
	`);
}

async function fadeVisibility(container: Locator): Promise<{ start: boolean; end: boolean }> {
	return container.evaluate((el) => {
		const start = el.querySelector<HTMLElement>('[data-slot="scroll-fade-start"]');
		const end = el.querySelector<HTMLElement>('[data-slot="scroll-fade-end"]');
		return {
			start: !!start && getComputedStyle(start).display !== 'none',
			end: !!end && getComputedStyle(end).display !== 'none',
		};
	});
}

test.describe('Phone rows, formatted filter counts and scroll edges', { tag: '@theme' }, () => {
	for (const width of [360, 390]) {
		test(`keeps words in nested badges whole at ${width}px`, async ({ page }) => {
			await open(page, width);
			const card = page.locator('#initial-wide');
			const badge = card.getByText('Unknown', { exact: true });
			await expect(badge).toBeVisible();
			const lines = await badge.evaluate((element) => {
				const range = document.createRange();
				range.selectNodeContents(element.firstChild!);
				return new Set([...range.getClientRects()].map((rect) => rect.top)).size;
			});
			expect(lines).toBe(1);
			await expect(card.locator('[data-slot="data-table-frame"]')).toHaveAttribute('data-scrollable', 'false');
		});
	}

	for (const width of [320, 390]) {
		test(`keeps oversized words whole and scrollable at ${width}px with 200% text`, async ({ page }) => {
			await open(page, width, 200);
			const cards = page.getByTestId('table-wrap-card');
			await expect(cards).toHaveCount(3);
			for (const card of await cards.all()) {
				const table = card.getByRole('table');
				const caption = (await table.locator('caption').textContent())!;
				const region = card.getByRole('region', { name: caption, exact: true });
				await expect(card).toHaveCSS('overflow-x', 'hidden');
				await expect(table).toHaveCSS('display', 'block');
				await expect(table).toHaveCSS('overflow-x', 'visible');
				await expect(region).toHaveAttribute('tabindex', '0');
				await expect(region).toHaveCSS('overflow-x', 'auto');
				expect(await card.evaluate((element) => element.scrollWidth)).toBe(await card.evaluate((element) => element.clientWidth));
				const words = await region.evaluate((frame) => {
					const start = frame.getBoundingClientRect().left + frame.clientLeft - frame.scrollLeft;
					const end = start + frame.scrollWidth;
					const range = document.createRange();
					return [...frame.querySelectorAll('[data-wrap-word]')].map((word) => {
						range.selectNodeContents(word.firstChild!);
						const boxes = [...range.getClientRects()];
						return {
							word: word.textContent,
							lines: new Set(boxes.map((box) => box.top)).size,
							reachable: boxes.every((box) => box.left >= start - 0.5 && box.right <= end + 0.5),
						};
					});
				});
				for (const { word, lines, reachable } of words) {
					expect(lines, `${caption}: ${word} stays whole`).toBe(1);
					expect(reachable, `${caption}: ${word} can be fully reached by scrolling`).toBe(true);
				}
				await region.press('ArrowRight');
				await expect.poll(() => region.evaluate((frame) => frame.scrollLeft)).toBeGreaterThan(0);
			}
			await expectStrictContainment(page);
		});
	}

	test('makes fixed-width cells in reflowed tables reachable by keyboard only while they overflow', async ({ page }) => {
		await open(page, 390);
		const cards = page.getByTestId('table-wrap-card');
		const scrollRegions = cards.locator('[data-slot="data-table-frame"]:is([tabindex], [role="region"])');
		const toggle = page.getByRole('button', { name: 'Show fixed-width cells' });
		const expectNoScrollViolations = async () => {
			const { violations } = await new AxeBuilder({ page })
				.include('[data-testid="table-wrap-card"]')
				.withRules(['scrollable-region-focusable'])
				.analyze();
			expect(violations).toEqual([]);
		};
		await expect(scrollRegions).toHaveCount(0);
		await expectNoScrollViolations();
		await toggle.click();
		for (const card of await cards.all()) {
			const caption = (await card.locator('caption').textContent())!;
			const region = card.getByRole('region', { name: caption, exact: true });
			await expect(region).toHaveAttribute('tabindex', '0');
			await expect(region).toHaveCSS('overflow-x', 'auto');
			await expect(region.getByRole('table')).toHaveCSS('overflow-x', 'visible');
			await expect(region.getByTestId('wide-table-cell')).toHaveCSS('width', '600px');
			await expect(region.locator('[data-slot="scroll-fade-end"]')).toBeVisible();
			await region.focus();
			await expect(region).toBeFocused();
			await region.press('ArrowRight');
			await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
			await expect(region.locator('[data-slot="scroll-fade-start"]')).toBeVisible();
			await region.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
			await expect(region.locator('[data-slot="scroll-fade-end"]')).toBeHidden();
			const wideCell = (await region.getByTestId('wide-table-cell').boundingBox())!;
			const scrollport = (await region.boundingBox())!;
			expect(wideCell.x + wideCell.width).toBeLessThanOrEqual(scrollport.x + scrollport.width + 0.5);
		}
		await expectNoHorizontalOverflow(page);
		const escaped = await cards.evaluateAll((cards) => cards.flatMap((card) => [...card.querySelectorAll<HTMLElement>('*')]
			.filter((element) => {
				const box = element.getBoundingClientRect();
				if (!box.width || !box.height || !element.checkVisibility() || (box.left >= -1 && box.right <= innerWidth + 1)) {
					return false;
				}
				for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
					if (['auto', 'scroll'].includes(getComputedStyle(ancestor).overflowX)) return false;
				}
				return true;
			})
			.map((element) => element.outerHTML.slice(0, 160))));
		expect(escaped).toEqual([]);
		await expectNoScrollViolations();
		await toggle.click();
		await expect(scrollRegions).toHaveCount(0);
	});

	test('remeasures overflow when a cell control gains and loses focus without resizing the table', async ({ page }) => {
		await open(page, 390);
		const card = page.locator('#initial-wide');
		const frame = card.locator('[data-slot="data-table-frame"]');
		const table = card.getByRole('table');
		const input = table.getByRole('textbox', { name: 'North on-time rate' });
		const tableSize = () => table.evaluate(({ clientWidth, clientHeight }) => ({ clientWidth, clientHeight }));
		const before = await tableSize();
		await expect(frame).toHaveAttribute('data-scrollable', 'false');
		await expect(frame).toHaveAttribute('aria-labelledby', 'wrap-heading-0');
		await expect(input).toHaveCSS('width', '45px');

		await table.getByRole('button', { name: 'Station' }).press('Tab');
		await expect(input).toBeFocused();
		await expect(input).toHaveCSS('width', '620px');
		const region = card.getByRole('region', { name: 'Compact rows with long words', exact: true });
		await expect(region).toHaveAttribute('tabindex', '0');
		await expect(region).toHaveCSS('overflow-x', 'auto');
		expect(await tableSize()).toEqual(before);

		await input.press('Shift+Tab');
		await expect(frame).toHaveAttribute('data-scrollable', 'false');
		await expect(frame).not.toHaveAttribute('tabindex');
		await expect(frame).toHaveAttribute('aria-labelledby', 'wrap-heading-0');
		await expect(frame).toHaveCSS('overflow-x', 'visible');
		expect(await tableSize()).toEqual(before);
	});

	test('starts with reachable reflowed overflow before hydration and preserves the scroll offset', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		const { promise: held, resolve: resume } = Promise.withResolvers<void>();
		await page.route('**/_app/immutable/**/*.js', async (route) => {
			await held;
			await route.fallback();
		});
		try {
			await page.goto(`${ROUTE}#initial-wide`, { waitUntil: 'domcontentloaded' });
			await page.evaluate(() => document.fonts.ready);
			const ready = page.locator('html[data-gallery-ready]');
			const card = page.locator('#initial-wide');
			const frame = card.locator('[data-slot="data-table-frame"]');
			const input = card.getByRole('textbox', { name: 'North on-time rate' });
			const fittingFrames = page.getByTestId('table-wrap-card').locator('[data-stack-at]');
			const frameHeights = () => fittingFrames.evaluateAll((frames) => frames.map((frame) => frame.clientHeight));
			await expect(ready).toHaveCount(0);
			await expect(frame).not.toHaveAttribute('data-scrollable');
			await expect(frame).toHaveCSS('overflow-x', 'auto');
			await expect(card.getByRole('table')).toHaveCSS('overflow-x', 'visible');
			await expect(input).toHaveCSS('width', '620px');
			const heights = await frameHeights();
			const scrollLeft = await frame.evaluate((element) => {
				element.scrollLeft = element.scrollWidth;
				return element.scrollLeft;
			});
			expect(scrollLeft).toBeGreaterThan(0);
			const inlineEnd = (await input.boundingBox())!;
			const scrollport = (await frame.boundingBox())!;
			expect(inlineEnd.x + inlineEnd.width).toBeLessThanOrEqual(scrollport.x + scrollport.width + 0.5);

			resume();
			await expect(ready).toBeAttached();
			const region = card.getByRole('region', { name: 'Compact rows with long words', exact: true });
			await expect(region).toHaveAttribute('tabindex', '0');
			expect(await region.evaluate((element) => element.scrollLeft)).toBe(scrollLeft);
			await expect(page.getByTestId('table-wrap-card').locator('[data-stack-at][data-scrollable="false"]')).toHaveCount(2);
			expect(await frameHeights()).toEqual(heights);
		} finally {
			resume();
		}
	});

	test('reflows compact rows and stacked tables without making them scroll containers', async ({ page }) => {
		await open(page, 390);
		const rows = page.getByRole('table', { name: 'Stations by on-time rate', exact: true });
		const stack = page.getByRole('table', { name: 'Three-day corridor performance' });
		for (const table of [rows, stack]) {
			await expect(table).toHaveCSS('display', 'block');
			await expect(table).toHaveCSS('overflow-x', 'visible');
			await expect(table).toHaveCSS('overflow-y', 'visible');
		}
		const { violations } = await new AxeBuilder({ page })
			.include('[data-testid="phone-rows-card"] [data-slot="data-table"]')
			.include('[data-testid="compact-stack-card"] [data-slot="data-table"]')
			.withRules(['scrollable-region-focusable'])
			.analyze();
		expect(violations).toEqual([]);
	});

	test('renders phone rows without labels, single detail sentence, one-line empty row, and sortable headers at 390px', async ({ page }) => {
		await open(page, 390);
		const card = page.getByTestId('phone-rows-card');
		const table = card.getByRole('table', { name: 'Stations by on-time rate' });

		// No per-row column labels rendered.
		await expect(table.locator('.data-table-stack-label')).toHaveCount(0);

		// Sortable header row stays visible and interactive on a phone.
		const onTimeSort = table.getByRole('button', { name: 'Sort by On time' });
		const stationSort = table.getByRole('button', { name: 'Sort by Station' });
		const reportsSort = table.getByRole('button', { name: REPORTS_SORT });
		const onTimeHeader = table.getByRole('columnheader', { name: 'Sort by On time' });
		const reportsHeader = table.getByRole('columnheader', { name: REPORTS_SORT });
		await expect(onTimeHeader).toHaveAttribute('aria-sort', 'descending');
		await expect(stationSort).toBeVisible();
		await expect(reportsSort).toBeVisible();

		for (const button of [stationSort, onTimeSort, reportsSort]) {
			const box = (await button.boundingBox())!;
			expect(box.width).toBeGreaterThanOrEqual(44);
			expect(box.height).toBeGreaterThanOrEqual(44);
		}

		// Normal row: primary + bold value on line 1, single muted detail sentence on line 2, other columns hidden.
		const firstRow = table.locator('tbody tr').first();
		await expect(firstRow.getByRole('rowheader', { name: 'North Ridge' })).toContainText('North Ridge');
		await expect(firstRow).toMatchAriaSnapshot(`
			- row:
			  - /children: equal
			  - rowheader "North Ridge":
			    - link "North Ridge"
			  - cell "93%"
			  - rowheader "Westbound · 820 m":
			    - link "Westbound"
			    - text: · 820 m
			  - cell "184"
		`);
		const normalLayout = await firstRow.evaluate((row) => {
			const primary = row.querySelector<HTMLElement>('[data-row-position="primary"]')!.getBoundingClientRect();
			const value = row.querySelector<HTMLElement>('[data-row-position="value"]')!.getBoundingClientRect();
			const detail = row.querySelector<HTMLElement>('.data-table-row-detail')!.getBoundingClientRect();
			const rowBox = row.getBoundingClientRect();
			const hiddenOther = [...row.querySelectorAll<HTMLElement>(':is(th, td):not([data-row-position], .data-table-row-detail)')]
				.every((cell) => {
					const box = cell.getBoundingClientRect();
					return getComputedStyle(cell).clipPath !== 'none' && box.width === 1 && box.height === 1 &&
						box.left >= rowBox.left && box.right <= rowBox.right;
				});
			return { primary, value, detail, hiddenOther };
		});
		expect(normalLayout.hiddenOther).toBe(true);
		expect(normalLayout.value.top).toBeLessThan(normalLayout.primary.bottom);
		expect(normalLayout.detail.top).toBeGreaterThanOrEqual(normalLayout.primary.bottom - 1);
		const primaryLink = firstRow.getByRole('link', { name: 'North Ridge' });
		const directionLink = firstRow.getByRole('link', { name: 'Westbound' });
		await expect(directionLink).toHaveCSS('pointer-events', 'none');
		await primaryLink.press('Tab');
		await expect(directionLink).toBeFocused();
		await expect(directionLink).toBeInViewport();
		await expect(directionLink.locator('xpath=ancestor::th')).toHaveCSS('clip-path', 'none');
		await expect(directionLink).toHaveCSS('pointer-events', 'auto');

		// Empty row: value hidden, primary + detail read on ONE line.
		const emptyRow = table.locator(EMPTY_ROW);
		await expect(emptyRow).toHaveCount(1);
		await expectEmptyRowSemantics(emptyRow);
		const emptyLayout = await emptyRow.evaluate((row) => {
			const primary = row.querySelector<HTMLElement>('[data-row-position="primary"]')!.getBoundingClientRect();
			const value = row.querySelector<HTMLElement>('[data-row-position="value"]')!;
			const detail = row.querySelector<HTMLElement>('.data-table-row-detail')!.getBoundingClientRect();
			return {
				valueClipped: getComputedStyle(value).clipPath !== 'none' &&
					value.getBoundingClientRect().width === 1 && value.getBoundingClientRect().height === 1,
				primary,
				detail,
			};
		});
		expect(emptyLayout.valueClipped).toBe(true);
		expect(emptyLayout.detail.left).toBeGreaterThanOrEqual(emptyLayout.primary.right - 1);
		expect(emptyLayout.detail.top).toBeLessThan(emptyLayout.primary.bottom);

		// Keyboard sort toggles direction and switches columns cleanly.
		await onTimeSort.press('Enter');
		await expect(onTimeHeader).toHaveAttribute('aria-sort', 'ascending');
		await expect(table.locator('tbody tr').first().getByRole('rowheader', { name: 'West Depot' })).toContainText('West Depot');

		await reportsSort.press('Space');
		await expect(reportsHeader).toHaveAttribute('aria-sort', 'descending');
		await expect(table.locator('tbody tr').first().getByRole('rowheader', { name: 'Central Station' })).toContainText('Central Station');

		// Formatted filter counts render in en, fr, es.
		await expect(page.getByTestId('count-en')).toContainText('8,630 stops');
		await expect(page.getByTestId('count-fr')).toContainText(new Intl.NumberFormat('fr').format(8630));
		await expect(page.getByTestId('count-es')).toContainText(new Intl.NumberFormat('es').format(10420));

		await expectStrictContainment(page);
		await expectAccessible(page);
	});

	for (const textPercent of [100, 200]) {
		test(`shows only the requested row labels at 390px with ${textPercent}% text`, async ({ page }) => {
			await open(page, 390, textPercent);
			const all = page.getByRole('table', { name: 'Stations by on-time rate, value and detail labels' });
			const details = page.getByRole('table', { name: 'Stations by on-time rate, detail labels only' });
			const none = page.getByRole('table', { name: 'Stations by on-time rate', exact: true });
			const valueCell = (table: Locator) => table.locator('tbody tr').first().locator('[data-row-position="value"]');
			const label = '.data-table-stack-label';

			await expect(valueCell(all).locator(label)).toBeVisible();
			await expect(valueCell(all)).toHaveCSS('align-self', 'start');
			for (const table of [all, details]) {
				const row = table.locator('tbody tr').first();
				await expect(row.locator(`[data-row-position="primary"] ${label}`)).toBeHidden();
				for (const [key, header] of [['direction', 'Direction and distance'], ['reports', 'Reports']] as const) {
					const detailLabel = row.locator(`[data-column="${key}"] ${label}`);
					await expect(detailLabel).toBeVisible();
					await expect(detailLabel).toHaveText(header);
				}
			}
			await expect(none.locator(label)).toHaveCount(0);
			for (const table of [details, none]) {
				await expect(valueCell(table).locator(label)).toBeHidden();
				await expect(valueCell(table)).toHaveCSS('align-self', 'baseline');
				await expect(table.locator('thead th[aria-sort] button')).toHaveCSS('font-weight', '600');
			}
			const primary = details.locator('tbody tr').first().locator('[data-row-position="primary"]');
			const primaryBox = (await primary.boundingBox())!;
			const valueBox = (await valueCell(details).boundingBox())!;
			if (textPercent === 200) {
				expect(valueBox.y).toBeGreaterThanOrEqual(primaryBox.y + primaryBox.height - 1);
				expect(valueBox.x).toBeCloseTo(primaryBox.x);
			} else {
				expect(valueBox.x).toBeGreaterThan(primaryBox.x);
				expect(valueBox.y).toBeLessThan(primaryBox.y + primaryBox.height);
			}
			await expectStrictContainment(page);
		});
	}

	for (const width of [768, 1440]) {
		test(`keeps normal multi-column table layout and accessible semantics at ${width}px`, async ({ page }) => {
			await open(page, width);
			const table = page.getByTestId('phone-rows-card').getByRole('table', { name: 'Stations by on-time rate' });
			const firstRow = table.locator('tbody tr').first();
			const wideLayout = await firstRow.evaluate((row) => {
				const detail = row.querySelector<HTMLElement>('.data-table-row-detail')!;
				const cells = [...row.querySelectorAll<HTMLElement>('th, td:not(.data-table-row-detail)')];
				const tops = cells.map((cell) => cell.getBoundingClientRect().top);
				return {
					detailHidden: getComputedStyle(detail).display === 'none',
					visibleCells: cells.filter((cell) => getComputedStyle(cell).display !== 'none').length,
					maxTopDiff: Math.max(...tops) - Math.min(...tops),
				};
			});
			expect(wideLayout.detailHidden).toBe(true);
			expect(wideLayout.visibleCells).toBe(4);
			expect(wideLayout.maxTopDiff).toBeLessThanOrEqual(1);

			// Non-overflowing grid and table show zero fades.
			expect(await fadeVisibility(page.getByTestId('hour-grid-fit-card'))).toEqual({ start: false, end: false });
			expect(await fadeVisibility(page.getByTestId('scroll-table-fit-card'))).toEqual({ start: false, end: false });

			await expectStrictContainment(page);
			await expectAccessible(page);
		});
	}

	test('shows edge fades only on overflowing sides, updates on scroll and resize, and starts at end for HourGrid and DataTable', async ({ page }) => {
		await open(page, 390);

		// Non-overflowing regions show no fades.
		expect(await fadeVisibility(page.getByTestId('hour-grid-fit-card'))).toEqual({ start: false, end: false });
		expect(await fadeVisibility(page.getByTestId('scroll-table-fit-card'))).toEqual({ start: false, end: false });

		// DataTable starting at start: end fade only -> both -> start fade only.
		const startTableCard = page.getByTestId('scroll-table-start-card');
		const startScroller = startTableCard.locator('#corridor-scrollport');
		await expect(startScroller).toHaveAccessibleName('Corridor performance by day');
		await expect(startScroller).toHaveAccessibleDescription('Scrollable DataTable starting at the start');
		await startScroller.focus();
		await expect(startScroller).toBeFocused();
		await expect(startScroller.locator(':scope > table')).toHaveCount(1);
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: false, end: true });
		const decoration = startScroller.locator(':scope > [aria-hidden="true"]');
		await expect(decoration).toHaveCount(1);
		await expect(decoration).toHaveCSS('pointer-events', 'none');
		await expect(decoration).toHaveCSS('width', '0px');
		await expect(decoration).toHaveCSS('height', '0px');

		// Token-based fade image is painted in both themes.
		const endBg = await startTableCard.locator('[data-slot="scroll-fade-end"]').evaluate((el) => getComputedStyle(el).backgroundImage);
		expect(endBg).toContain('linear-gradient');

		await startScroller.evaluate((el) => { el.scrollLeft = Math.floor((el.scrollWidth - el.clientWidth) / 2); });
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: true, end: true });
		await expectStrictContainment(page);

		await startScroller.evaluate((el) => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: true, end: false });
		await expectStrictContainment(page);

		// HourGrid with initialScroll="end": starts at end with start fade only and most recent day in view.
		const hourGridEndCard = page.getByTestId('hour-grid-end-card');
		const hourScroller = hourGridEndCard.getByRole('region', { name: 'Recent 14-day reporting grid' });
		await expect.poll(() => fadeVisibility(hourGridEndCard)).toEqual({ start: true, end: false });
		const hourState = await hourScroller.evaluate((el) => {
			const lastCol = el.querySelector('thead th:last-child')!.getBoundingClientRect();
			const box = el.getBoundingClientRect();
			const rowHeader = el.querySelector('tbody th')!.getBoundingClientRect();
			const startFade = el.parentElement!.querySelector<HTMLElement>('[data-slot="scroll-fade-start"]')!.getBoundingClientRect();
			return {
				scrollLeft: el.scrollLeft,
				maxScroll: el.scrollWidth - el.clientWidth,
				lastVisible: lastCol.right <= box.right + 1 && lastCol.left >= box.left,
				fadeAfterSticky: startFade.left >= rowHeader.right - 2,
				stickyWidth: rowHeader.width,
				scrollportWidth: el.clientWidth,
			};
		});
		expect(hourState.scrollLeft).toBeGreaterThan(0);
		expect(Math.abs(hourState.scrollLeft - hourState.maxScroll)).toBeLessThanOrEqual(2);
		expect(hourState.lastVisible).toBe(true);
		expect(hourState.fadeAfterSticky).toBe(true);
		expect(hourState.stickyWidth).toBeGreaterThan(hourState.scrollportWidth / 2);

		// Scrolling HourGrid back to start flips fades.
		await hourScroller.evaluate((el) => { el.scrollLeft = 0; });
		await expect.poll(() => fadeVisibility(hourGridEndCard)).toEqual({ start: false, end: true });

		// DataTable with initialScroll="end": starts at end with start fade only and last day in view.
		const endTableCard = page.getByTestId('scroll-table-end-card');
		const endScroller = endTableCard.locator(TABLE_SCROLLPORT);
		await expect.poll(() => fadeVisibility(endTableCard)).toEqual({ start: true, end: false });
		const endTableState = await endScroller.evaluate((el) => {
			const lastCol = el.querySelector('thead th:last-child')!.getBoundingClientRect();
			const box = el.getBoundingClientRect();
			return {
				scrollLeft: el.scrollLeft,
				lastVisible: lastCol.right <= box.right + 1 && lastCol.left >= box.left,
			};
		});
		expect(endTableState.scrollLeft).toBeGreaterThan(0);
		expect(endTableState.lastVisible).toBe(true);
		await endScroller.evaluate((el) => { el.scrollLeft = 120; });
		const oldScrollWidth = await endScroller.evaluate((el) => el.scrollWidth);
		await endTableCard.getByRole('button', { name: 'Widen recent table' }).click();
		await expect.poll(() => endScroller.evaluate((el) => el.scrollWidth)).toBeGreaterThan(oldScrollWidth);
		expect(await endScroller.evaluate((el) => el.scrollLeft)).toBe(120);
		await expect.poll(() => fadeVisibility(endTableCard)).toEqual({ start: true, end: true });

		// Widening viewport removes fades when content fits.
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: false, end: false });
		await expect.poll(() => fadeVisibility(endTableCard)).toEqual({ start: false, end: false });
		await expect.poll(() => fadeVisibility(hourGridEndCard)).toEqual({ start: false, end: false });
		await expect(startScroller).not.toHaveAttribute('tabindex');
		await expect(decoration).toHaveCount(0);
	});

	test('keeps the HourGrid end fade clear of its sticky heading at 320px', async ({ page }) => {
		await open(page, 320);
		await expectEmptyRowSemantics(page.locator(EMPTY_ROW));
		const card = page.getByTestId('hour-grid-end-card');
		const scroller = card.getByRole('region', { name: 'Recent 14-day reporting grid' });
		await expect.poll(() => fadeVisibility(card)).toEqual({ start: true, end: false });
		await scroller.evaluate((el) => { el.scrollLeft = 0; });
		await expect.poll(() => fadeVisibility(card)).toEqual({ start: false, end: true });
		const endFade = card.locator('[data-slot="scroll-fade-end"]');
		expect((await endFade.boundingBox())!.width).toBeGreaterThan(0);
		await expectStrictContainment(page);
	});

	for (const width of [320, 390]) {
		test(`keeps strict containment and accessibility at ${width}px with 200% text`, async ({ page }) => {
			await open(page, width, 200);
			await expectEmptyRowSemantics(page.locator(EMPTY_ROW));
			const card = page.getByTestId('hour-grid-end-card');
			const startFade = card.locator('[data-slot="scroll-fade-start"]');
			await expect(startFade).toHaveCSS('display', 'block');
			await expect.poll(() => startFade.evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
			await expectStrictContainment(page);
			await expectAccessible(page);
			const scroller = card.getByRole('region', { name: 'Recent 14-day reporting grid' });
			await scroller.evaluate((el) => { el.scrollLeft = 0; });
			const endFade = card.locator('[data-slot="scroll-fade-end"]');
			await expect(endFade).toHaveCSS('display', 'block');
			await expect.poll(() => endFade.evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
			await expectStrictContainment(page);
		});
	}

	test('starts scrolled to the end before hydration (JS disabled) and hides fades in forced colors', async ({ browser, baseURL, page }) => {
		const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
		const noJsPage = await context.newPage();
		await noJsPage.goto(ROUTE);
		const preHydration = await noJsPage.evaluate(() => {
			const check = (selector: string, direction: 'ltr' | 'rtl') => {
				const scroller = document.querySelector<HTMLElement>(selector)!;
				scroller.dir = direction;
				scroller.scrollLeft = 0;
				const box = scroller.getBoundingClientRect();
				const inView = (cell: Element) => {
					const rect = cell.getBoundingClientRect();
					return rect.right <= box.right + 1 && rect.left >= box.left - 1;
				};
				const lastInView = inView(scroller.querySelector('thead th:last-child')!);
				const travel = scroller.scrollWidth - scroller.clientWidth;
				scroller.scrollLeft = direction === 'rtl' ? travel : -travel;
				return {
					overflows: travel > 1,
					lastInView,
					firstReachable: inView(scroller.querySelector('thead tr > :first-child')!),
				};
			};
			return (['ltr', 'rtl'] as const).map((direction) => ({
				hourGrid: check('[data-testid="hour-grid-end-card"] .scroll', direction),
				dataTable: check('[data-testid="scroll-table-end-card"] [data-slot="data-table-frame"]', direction),
			}));
		});
		const preHydrationTable = noJsPage.getByRole('region', { name: 'Recent corridor performance' });
		await expect(preHydrationTable).toHaveAttribute('tabindex', '0');
		await preHydrationTable.focus();
		await expect(preHydrationTable).toBeFocused();
		await context.close();
		for (const { hourGrid, dataTable } of preHydration) {
			expect(hourGrid).toEqual({ overflows: true, lastInView: true, firstReachable: true });
			expect(dataTable).toEqual({ overflows: true, lastInView: true, firstReachable: true });
		}

		// Forced colors: fades are hidden, scroll regions stay focusable.
		await page.emulateMedia({ forcedColors: 'active' });
		await open(page, 390);
		expect(await fadeVisibility(page.getByTestId('hour-grid-end-card'))).toEqual({ start: false, end: false });
		expect(await fadeVisibility(page.getByTestId('scroll-table-start-card'))).toEqual({ start: false, end: false });
		const region = page.getByTestId('hour-grid-end-card').getByRole('region', { name: 'Recent 14-day reporting grid' });
		await region.focus();
		await expect(region).toBeFocused();
	});
});
