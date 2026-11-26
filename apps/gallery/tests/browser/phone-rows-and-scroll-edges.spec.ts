import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const ROUTE = '/phone-rows-and-scroll-edges';

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
	const violations = await page.evaluate(() => {
		const viewportRight = window.innerWidth;
		const issues: string[] = [];
		const root = document.querySelector('[data-testid="phone-rows-and-scroll-edges"]')!;

		// Check all fade overlays against both their parent scroll container and the viewport.
		for (const fade of root.querySelectorAll<HTMLElement>('[data-slot="scroll-fade-start"], [data-slot="scroll-fade-end"]')) {
			const style = getComputedStyle(fade);
			if (style.display === 'none') continue;
			const rect = fade.getBoundingClientRect();
			const host = fade.parentElement!.getBoundingClientRect();
			if (rect.left < host.left - 0.5 || rect.right > host.right + 0.5) {
				issues.push(`fade outside host: ${fade.dataset.slot} [${rect.left}, ${rect.right}] vs [${host.left}, ${host.right}]`);
			}
			if (rect.left < -1 || rect.right > viewportRight + 1) {
				issues.push(`fade crosses viewport: ${fade.dataset.slot} [${rect.left}, ${rect.right}] vs [0, ${viewportRight}]`);
			}
		}

		// Check every visible descendant outside horizontally scrolling regions against the viewport.
		for (const el of root.querySelectorAll<HTMLElement>('*')) {
			if (el.closest('.scroll, .data-table-scroll') && !el.matches('.scroll, .data-table-scroll')) continue;
			const style = getComputedStyle(el);
			if (style.display === 'none' || style.visibility === 'hidden') continue;
			const rect = el.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) continue;
			if (rect.right > viewportRight + 1 || rect.left < -1) {
				issues.push(`${el.tagName.toLowerCase()}.${el.className} crosses viewport: [${rect.left}, ${rect.right}] vs [0, ${viewportRight}]`);
			}
		}
		return issues;
	});
	expect(violations).toEqual([]);
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
	test('renders phone rows without labels, single detail sentence, one-line empty row, and sortable headers at 390px', async ({ page }) => {
		await open(page, 390);
		const card = page.getByTestId('phone-rows-card');
		const table = card.getByRole('table', { name: 'Stations by on-time rate' });

		// No per-row column labels rendered.
		await expect(table.locator('.data-table-stack-label')).toHaveCount(0);

		// Sortable header row stays visible and interactive on a phone.
		const onTimeSort = table.getByRole('button', { name: 'Sort by On time' });
		const stationSort = table.getByRole('button', { name: 'Sort by Station' });
		const reportsSort = table.getByRole('button', { name: 'Sort by Reports' });
		const onTimeHeader = table.getByRole('columnheader', { name: 'Sort by On time' });
		const reportsHeader = table.getByRole('columnheader', { name: 'Sort by Reports' });
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
		await expect(firstRow.getByRole('rowheader')).toContainText('North Ridge');
		const normalLayout = await firstRow.evaluate((row) => {
			const primary = row.querySelector<HTMLElement>('[data-row-position="primary"]')!.getBoundingClientRect();
			const value = row.querySelector<HTMLElement>('[data-row-position="value"]')!.getBoundingClientRect();
			const detail = row.querySelector<HTMLElement>('.data-table-row-detail')!.getBoundingClientRect();
			const hiddenOther = [...row.querySelectorAll<HTMLElement>('td:not([data-row-position]):not(.data-table-row-detail)')]
				.every((cell) => getComputedStyle(cell).display === 'none');
			return { primary, value, detail, hiddenOther };
		});
		expect(normalLayout.hiddenOther).toBe(true);
		expect(normalLayout.value.top).toBeLessThan(normalLayout.primary.bottom);
		expect(normalLayout.detail.top).toBeGreaterThanOrEqual(normalLayout.primary.bottom - 1);

		// Empty row: value hidden, primary + detail read on ONE line.
		const emptyRow = table.locator('tbody tr[data-row-empty]');
		await expect(emptyRow).toHaveCount(1);
		const emptyLayout = await emptyRow.evaluate((row) => {
			const primary = row.querySelector<HTMLElement>('[data-row-position="primary"]')!.getBoundingClientRect();
			const value = row.querySelector<HTMLElement>('[data-row-position="value"]')!;
			const detail = row.querySelector<HTMLElement>('.data-table-row-detail')!.getBoundingClientRect();
			return {
				valueHidden: getComputedStyle(value).display === 'none',
				primary,
				detail,
			};
		});
		expect(emptyLayout.valueHidden).toBe(true);
		expect(emptyLayout.detail.left).toBeGreaterThanOrEqual(emptyLayout.primary.right - 1);
		expect(emptyLayout.detail.top).toBeLessThan(emptyLayout.primary.bottom);

		// Keyboard sort toggles direction and switches columns cleanly.
		await onTimeSort.press('Enter');
		await expect(onTimeHeader).toHaveAttribute('aria-sort', 'ascending');
		await expect(table.locator('tbody tr').first().getByRole('rowheader')).toContainText('West Depot');

		await reportsSort.press('Space');
		await expect(reportsHeader).toHaveAttribute('aria-sort', 'descending');
		await expect(table.locator('tbody tr').first().getByRole('rowheader')).toContainText('Central Station');

		// Formatted filter counts render in en, fr, es.
		await expect(page.getByTestId('count-en')).toContainText('8,630 stops');
		await expect(page.getByTestId('count-fr')).toContainText(new Intl.NumberFormat('fr').format(8630));
		await expect(page.getByTestId('count-es')).toContainText(new Intl.NumberFormat('es').format(10420));

		await expectStrictContainment(page);
		await expectAccessible(page);
	});

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
		const startScroller = startTableCard.locator('.data-table-scroll');
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: false, end: true });

		// Token-based fade image is painted in both themes.
		const endBg = await startTableCard.locator('[data-slot="scroll-fade-end"]').evaluate((el) => getComputedStyle(el).backgroundImage);
		expect(endBg).toContain('linear-gradient');

		await startScroller.evaluate((el) => { el.scrollLeft = Math.floor((el.scrollWidth - el.clientWidth) / 2); });
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: true, end: true });

		await startScroller.evaluate((el) => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: true, end: false });

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
			};
		});
		expect(hourState.scrollLeft).toBeGreaterThan(0);
		expect(Math.abs(hourState.scrollLeft - hourState.maxScroll)).toBeLessThanOrEqual(2);
		expect(hourState.lastVisible).toBe(true);
		expect(hourState.fadeAfterSticky).toBe(true);

		// Scrolling HourGrid back to start flips fades.
		await hourScroller.evaluate((el) => { el.scrollLeft = 0; });
		await expect.poll(() => fadeVisibility(hourGridEndCard)).toEqual({ start: false, end: true });

		// DataTable with initialScroll="end": starts at end with start fade only and last day in view.
		const endTableCard = page.getByTestId('scroll-table-end-card');
		const endScroller = endTableCard.locator('.data-table-scroll');
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

		// Widening viewport removes fades when content fits.
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect.poll(() => fadeVisibility(startTableCard)).toEqual({ start: false, end: false });
		await expect.poll(() => fadeVisibility(endTableCard)).toEqual({ start: false, end: false });
		await expect.poll(() => fadeVisibility(hourGridEndCard)).toEqual({ start: false, end: false });
	});

	for (const width of [320, 390]) {
		test(`keeps strict containment and accessibility at ${width}px with 200% text`, async ({ page }) => {
			await open(page, width, 200);
			await expectStrictContainment(page);
			await expectAccessible(page);
		});
	}

	test('starts scrolled to the end before hydration (JS disabled) and hides fades in forced colors', async ({ browser, baseURL, page }) => {
		const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
		const noJsPage = await context.newPage();
		await noJsPage.goto(ROUTE);
		const preHydration = await noJsPage.evaluate(() => {
			const check = (selector: string) => {
				const scroller = document.querySelector<HTMLElement>(selector)!;
				const last = scroller.querySelector('thead th:last-child')!.getBoundingClientRect();
				const box = scroller.getBoundingClientRect();
				return {
					overflows: scroller.scrollWidth > scroller.clientWidth + 1,
					lastInView: last.right <= box.right + 1 && last.left >= box.left - 1,
				};
			};
			return {
				hourGrid: check('[data-testid="hour-grid-end-card"] .scroll'),
				dataTable: check('[data-testid="scroll-table-end-card"] .data-table-scroll'),
			};
		});
		await context.close();
		expect(preHydration.hourGrid).toEqual({ overflows: true, lastInView: true });
		expect(preHydration.dataTable).toEqual({ overflows: true, lastInView: true });

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
