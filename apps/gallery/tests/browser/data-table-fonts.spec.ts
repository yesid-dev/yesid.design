import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const LAYOUTS = ['compact', 'tablet', 'rows'] as const;
const DATA_COLUMNS = ['code', 'status', 'trips', 'share'] as const;

async function open(page: Page) {
	await page.goto('/data-table-fonts');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

/** The computed family each token resolves to, so assertions compare like with like. */
function tokenFamilies(page: Page) {
	return page.evaluate(() => {
		const probe = document.body.appendChild(document.createElement('span'));
		const read = (token: string) => {
			probe.style.fontFamily = `var(${token})`;
			return getComputedStyle(probe).fontFamily;
		};
		const families = { body: read('--font-body'), mono: read('--font-mono') };
		probe.remove();
		return families;
	});
}

const fontsOf = (elements: Locator) =>
	elements.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).fontFamily));

/** Computed family by column, for the header cells and the first body row's cell content. */
function tableFonts(scope: Locator) {
	return scope.locator('table').evaluate((table) => {
		const read = (selector: string, text: (cell: Element) => Element) =>
			Object.fromEntries(
				[...table.querySelectorAll<HTMLElement>(selector)].map((cell) => [
					cell.dataset.column!,
					getComputedStyle(text(cell)).fontFamily,
				]),
			);
		return {
			headers: read('thead th', (cell) => cell),
			cells: read('tbody tr:first-child > [data-column]', (cell) =>
				cell.querySelector('.data-table-cell-content')!,
			),
		};
	});
}

const everyColumn = (family: string) => ({
	line: family,
	code: family,
	status: family,
	trips: family,
	share: family,
});

test('header cells take the header font, and a body column takes the body font', async ({ page }) => {
	await open(page);
	const { body, mono } = await tokenFamilies(page);
	expect(body).not.toBe(mono);

	for (const layout of LAYOUTS) {
		const brand = await tableFonts(page.getByTestId(`fonts-brand-${layout}`));
		expect(brand.headers, `${layout} headers`).toEqual(everyColumn(body));
		expect(brand.cells.line, `${layout} row header`).toBe(body);
		expect(
			new Set(await fontsOf(page.getByTestId(`fonts-brand-${layout}`).locator('.data-table-sort'))),
			`${layout} sort button`,
		).toEqual(new Set([body]));
		for (const column of DATA_COLUMNS) {
			// On a narrow frame the compact rows layout already sets its detail line in the text font.
			const detail = layout === 'rows' && column !== 'trips';
			const expected = column === 'status' || column === 'share' || detail ? body : mono;
			expect(brand.cells[column], `${layout} ${column}`).toBe(expected);
		}
	}
});

test('without either option the table keeps its fonts', async ({ page }) => {
	await open(page);
	const { body, mono } = await tokenFamilies(page);

	for (const layout of LAYOUTS) {
		const fonts = await tableFonts(page.getByTestId(`fonts-default-${layout}`));
		expect(fonts.headers, `${layout} headers`).toEqual(everyColumn(mono));
		expect(fonts.cells.line, `${layout} row header`).toBe(body);
		for (const column of DATA_COLUMNS) {
			const detail = layout === 'rows' && column !== 'trips';
			expect(fonts.cells[column], `${layout} ${column}`).toBe(detail ? body : mono);
		}
	}
});

test('labels beside stacked and compact-row values follow the header font', async ({ page }) => {
	await open(page);
	const { body, mono } = await tokenFamilies(page);
	const width = page.viewportSize()!.width;
	const shown = [
		...(width <= 448 ? ['compact'] : []),
		...(width <= 1023 ? ['tablet'] : []),
		'rows',
	];

	for (const layout of shown) {
		// The compact rows layout never shows a label beside the primary cell.
		const labels = (group: string) =>
			page
				.getByTestId(`fonts-${group}-${layout}`)
				.locator('tbody tr:first-child .data-table-stack-label')
				.filter({ visible: true });
		await expect(labels('brand').first()).toBeVisible();
		expect(new Set(await fontsOf(labels('brand'))), `${layout} brand labels`).toEqual(new Set([body]));

		const fallback = await labels('default').evaluateAll((nodes) =>
			nodes.map((node) => ({
				column: node.parentElement!.dataset.column!,
				family: getComputedStyle(node).fontFamily,
			})),
		);
		expect(fallback.length).toBeGreaterThan(0);
		for (const { column, family } of fallback) {
			// Stacked labels default to mono. A compact-row label defaults to its own cell's font.
			const rowDefault = column === 'trips' ? mono : body;
			expect(family, `${layout} default ${column} label`).toBe(layout === 'rows' ? rowDefault : mono);
		}
	}
});

test('one declaration on the root sets every table header', async ({ page }) => {
	await open(page);
	const { body } = await tokenFamilies(page);
	await page.addStyleTag({ content: ':root { --data-table-header-font: var(--font-body); }' });

	expect(new Set(await fontsOf(page.getByTestId('fonts-default').locator('thead th')))).toEqual(
		new Set([body]),
	);
});

test('a numeric column keeps tabular figures in the body font, while loading too', async ({ page }) => {
	await open(page);
	const { body } = await tokenFamilies(page);
	const share = page.getByTestId('fonts-brand-compact').locator('tbody td[data-column="share"]').first();

	await expect(share).toHaveCSS('font-family', body);
	await expect(share).toHaveCSS('font-variant-numeric', 'tabular-nums');
	const widths = await share.evaluate((cell) =>
		['1111', '8888'].map((digits) => {
			const probe = cell.querySelector('.data-table-cell-content')!.appendChild(document.createElement('span'));
			probe.textContent = digits;
			const { width } = probe.getBoundingClientRect();
			probe.remove();
			return width;
		}),
	);
	expect(widths[0]).toBeCloseTo(widths[1]!, 1);

	// Placeholders use the loaded column's font, so the swap does not change their measure.
	await expect(
		page.getByTestId('fonts-brand-loading').locator('tbody td[data-column="share"]').first(),
	).toHaveCSS('font-family', body);
	await expectNoHorizontalOverflow(page);
	await expectAccessible(page);
});
