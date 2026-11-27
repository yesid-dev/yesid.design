import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DataTable, { type DataTableColumn } from './DataTable.svelte';

interface Row {
	id: string;
	route: string;
	wait: number | null;
	detail?: string;
}

const cell = (read: (row: Row) => string | number) =>
	createRawSnippet<[Row]>((row) => ({ render: () => `<span>${read(row())}</span>` }));

const columns: DataTableColumn<Row>[] = [
	{ key: 'route', header: 'Route', rowHeader: true, cell: cell((row) => row.route) },
	{ key: 'wait', header: 'Wait', numeric: true, cell: cell((row) => row.wait ?? '—') },
];
const rows: Row[] = [
	{ id: 'a', route: '24', wait: 6, detail: 'Eastbound, 240 m' },
	{ id: 'b', route: '55', wait: 11, detail: 'Northbound, 410 m' },
];

const table = (caption = 'Waits by route') =>
	render(DataTable<Row>, { props: { rows, columns, key: (row) => row.id, caption } });

afterEach(() => vi.restoreAllMocks());

function mockScrollMetrics(
	element: HTMLElement,
	metrics: { clientWidth: number; scrollWidth: number; scrollLeft?: number },
): void {
	let currentLeft = metrics.scrollLeft ?? 0;
	Object.defineProperty(element, 'clientWidth', { configurable: true, get: () => metrics.clientWidth });
	Object.defineProperty(element, 'scrollWidth', { configurable: true, get: () => metrics.scrollWidth });
	Object.defineProperty(element, 'scrollLeft', {
		configurable: true,
		get: () => currentLeft,
		set: (value: number) => {
			currentLeft = value;
		},
	});
}

describe('DataTable', () => {
	it('keeps its caption and headers while showing decorative rows during loading', async () => {
		const onSort = vi.fn();
		const key = vi.fn((row: Row) => row.id);
		const view = render(DataTable<Row>, {
			props: {
				rows,
				columns: [{ ...columns[0]!, sortable: true }, columns[1]!],
				key,
				caption: 'Waits by route',
				onSort,
				pageSize: 1,
				pageLabels: { showing: () => 'Showing one', more: () => 'Show more' },
				loading: true,
			},
		});
		const frame = view.container.querySelector('[data-slot="data-table-frame"]')!;
		const grid = screen.getByRole('table', { name: 'Waits by route' });
		expect(frame.getAttribute('aria-busy')).toBe('true');
		expect(within(grid).getAllByRole('columnheader')).toHaveLength(2);
		expect(grid.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(4);
		expect(grid.querySelectorAll('tbody :is(th, td)[aria-hidden="true"] > div > [data-skeleton-busy]')).toHaveLength(8);
		expect(within(grid).queryByRole('rowheader')).toBeNull();
		expect(screen.queryByRole('button', { name: 'Show more' })).toBeNull();
		expect(key).not.toHaveBeenCalled();
		const sort = screen.getByRole('button', { name: 'Route' }) as HTMLButtonElement;
		expect(sort.disabled).toBe(true);
		await fireEvent.click(sort);
		expect(onSort).not.toHaveBeenCalled();

		await view.rerender({ skeletonRows: 2 });
		expect(grid.querySelectorAll('tbody tr')).toHaveLength(2);
		await view.rerender({ loading: false });
		expect(frame.hasAttribute('aria-busy')).toBe(false);
		expect(grid.querySelector('[data-slot="skeleton"]')).toBeNull();
		expect(within(grid).getByRole('rowheader').textContent?.trim()).toBe('24');
		expect(screen.getByRole('button', { name: 'Show more' })).toBeDefined();
		await fireEvent.click(sort);
		expect(onSort).toHaveBeenCalledWith('route');
	});

	it('renders the same markup when loading is false or omitted', () => {
		const props = { rows, columns, key: (row: Row) => row.id, caption: 'Waits by route' };
		const omitted = render(DataTable<Row>, { props });
		const inactive = render(DataTable<Row>, { props: { ...props, loading: false, skeletonRows: 8 } });
		expect(inactive.container.innerHTML).toBe(omitted.container.innerHTML);
	});

	it('is a table named by its caption, with column and row headers', () => {
		table();

		const grid = screen.getByRole('table', { name: 'Waits by route' });
		const headers = within(grid).getAllByRole('columnheader').map((th) => th.textContent?.trim());
		expect(headers).toEqual(columns.map((column) => column.header));
		const rowHeaders = within(grid).getAllByRole('rowheader').map((th) => th.textContent?.trim());
		expect(rowHeaders).toEqual(rows.map((row) => row.route));
	});

	it('is not a focusable region while nothing overflows', () => {
		table();

		expect(screen.queryByRole('region')).toBeNull();
	});

	it('applies caller accessibility attributes outside scroll region mode', () => {
		render(DataTable<Row>, {
			props: {
				rows,
				columns,
				key: (row) => row.id,
				caption: 'Waits by route',
				role: 'group',
				'aria-label': 'Current waits',
				tabindex: -1,
			},
		});

		const frame = screen.getByRole('group', { name: 'Current waits' });
		expect(frame.getAttribute('tabindex')).toBe('-1');
		expect(within(frame).getByRole('table', { name: 'Waits by route' })).toBeDefined();
	});

	it('refuses a blank caption', () => {
		expect(() => table('   ')).toThrow(/caption/);
	});

	it('marks middle row alignment on the frame and changes nothing else', () => {
		const show = (rowAlign?: 'top' | 'middle') =>
			render(DataTable<Row>, { props: { rows, columns, key: (row) => row.id, caption: 'Waits by route', rowAlign } });
		const omitted = show();
		const frame = omitted.container.querySelector<HTMLElement>('[data-slot="data-table-frame"]')!;
		expect(frame.hasAttribute('data-row-align')).toBe(false);
		expect(show('top').container.innerHTML).toBe(omitted.container.innerHTML);

		const middle = show('middle').container;
		const marked = middle.querySelector<HTMLElement>('[data-slot="data-table-frame"]')!;
		expect(marked.dataset.rowAlign).toBe('middle');
		expect(middle.innerHTML.replace(' data-row-align="middle"', '')).toBe(omitted.container.innerHTML);
	});

	it.each([
		{ labels: undefined, marker: undefined, rendered: ['Route', 'Wait', 'Sector', 'Distance'] },
		{ labels: true, marker: undefined, rendered: ['Route', 'Wait', 'Sector', 'Distance'] },
		{ labels: false, marker: 'none', rendered: [] },
		{ labels: 'details' as const, marker: 'details', rendered: ['Route', 'Sector', 'Distance'] },
	])('renders the compact row label markup for labels=$labels', ({ labels, marker, rendered }) => {
		const view = render(DataTable<Row>, {
			props: {
				rows,
				columns: [
					...columns,
					{ key: 'sector', header: 'Sector', cell: cell(() => 'Eastbound') },
					{ key: 'distance', header: 'Distance', cell: cell(() => '240 m') },
				],
				key: (row) => row.id,
				caption: 'Waits by route',
				responsive: { mode: 'rows', primary: 'route', value: 'wait', labels },
			},
		});
		const frame = view.container.querySelector<HTMLElement>('[data-slot="data-table-frame"]')!;
		const rowLabels = [...frame.querySelectorAll('tbody tr:first-child .data-table-stack-label')];
		expect(frame.dataset.rowLabels).toBe(marker);
		expect(rowLabels.map((label) => label.textContent)).toEqual(rendered);
		expect(rowLabels.every((label) => label.getAttribute('aria-hidden') === 'true')).toBe(true);
	});

	it.each([false, 'details'] as const)('supports a row detail snippet, empty rows and sortable headers with labels=%s', async (labels) => {
		const onSort = vi.fn();
		const detailColumns: DataTableColumn<Row>[] = [
			{ key: 'route', header: 'Route', rowHeader: true, sortable: true, cell: cell((row) => row.route) },
			{ key: 'wait', header: 'Wait', numeric: true, sortable: true, cell: cell((row) => row.wait ?? '—') },
			{ key: 'sector', header: 'Sector', sortable: true, cell: cell((row) => row.detail ?? '—') },
		];
		const mixedRows: Row[] = [
			...rows,
			{ id: 'c', route: '80', wait: null, detail: 'Did not report on these dates.' },
		];
		const rowDetail = createRawSnippet<[Row]>((row) => ({
			render: () => `<span>${row().detail ?? ''}</span>`,
		}));

		const compact = render(DataTable<Row>, {
			props: {
				rows: mixedRows,
				columns: detailColumns,
				key: (row) => row.id,
				caption: 'Compact phone rows',
				responsive: { mode: 'rows', primary: 'route', value: 'wait', labels },
				rowDetail,
				rowEmpty: (row) => row.wait === null,
				sort: { key: 'wait', direction: 'desc' },
				onSort,
				sortLabels: { by: (column) => `Sort by ${column}` },
			},
		});
		const frame = compact.container.querySelector<HTMLElement>('[data-slot="data-table-frame"]')!;
		expect(frame.dataset.hasRowDetail).toBe('true');

		const grid = within(compact.container).getByRole('table', { name: 'Compact phone rows' });
		expect(within(grid).getAllByRole('columnheader')).toHaveLength(3);
		const waitSort = within(grid).getByRole('button', { name: 'Sort by Wait' });
		expect(waitSort.closest('th')?.getAttribute('aria-sort')).toBe('descending');
		const sectorSort = within(grid).getByRole('button', { name: 'Sort by Sector' });
		await fireEvent.click(sectorSort);
		expect(onSort).toHaveBeenCalledWith('sector');

		const bodyRows = compact.container.querySelectorAll('tbody tr');
		expect(bodyRows).toHaveLength(3);
		expect(bodyRows[0]!.hasAttribute('data-row-empty')).toBe(false);
		expect(bodyRows[2]!.hasAttribute('data-row-empty')).toBe(true);
		const detailCell = bodyRows[2]!.querySelector<HTMLTableCellElement>('.data-table-row-detail')!;
		expect(detailCell.textContent?.trim()).toBe('Did not report on these dates.');
		expect(detailCell.getAttribute('aria-hidden')).toBe('true');
		const sectorColId = compact.container.querySelector('thead th[data-column="sector"]')?.id;
		const waitColId = compact.container.querySelector('thead th[data-column="wait"]')?.id;
		expect(bodyRows[2]!.querySelector('[data-column="sector"]')?.getAttribute('headers')).toContain(sectorColId!);
		expect(bodyRows[2]!.querySelector('[data-column="wait"]')?.getAttribute('headers')).toContain(waitColId!);
	});

	it('forwards a reflowed table scroll event with the frame as the handler receiver', async () => {
		const onscroll = vi.fn(function (this: HTMLDivElement, event: Event) {
			expect(this).toBe(event.currentTarget);
		});
		const view = render(DataTable<Row>, {
			props: {
				rows,
				columns,
				key: (row) => row.id,
				caption: 'Waits by route',
				responsive: { mode: 'rows', primary: 'route', value: 'wait' },
				onscroll,
			},
		});
		await fireEvent.scroll(view.container.querySelector('[data-slot="data-table-frame"]')!);
		expect(onscroll).toHaveBeenCalledOnce();
	});

	it('updates scroll edge fades on scroll and resize, and supports initialScroll end', async () => {
		let resizeCallback: (() => void) | undefined;
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(cb: () => void) {
					resizeCallback = cb;
				}
				observe() {}
				disconnect() {}
			},
		);

		const metrics = { clientWidth: 300, scrollWidth: 600, scrollLeft: 0 };
		const originalDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
		const scrollView = render(DataTable<Row>, {
			props: {
				rows,
				columns,
				key: (row) => row.id,
				caption: 'Scrollable waits',
				responsive: { mode: 'scroll', minWidth: '40rem' },
			},
		});
		const frame = scrollView.container.querySelector<HTMLElement>('[data-slot="data-table-frame"]')!;
		const scroller = frame;
		expect(frame.dataset.scrollStart).toBeUndefined();
		expect(frame.dataset.scrollEnd).toBeUndefined();

		mockScrollMetrics(scroller, metrics);
		resizeCallback?.();
		await vi.waitFor(() => {
			expect(frame.dataset.scrollable).toBe('true');
			expect(frame.dataset.scrollStart).toBeUndefined();
			expect(frame.dataset.scrollEnd).toBe('true');
		});

		scroller.scrollLeft = 150;
		await fireEvent.scroll(scroller);
		expect(frame.dataset.scrollStart).toBe('true');
		expect(frame.dataset.scrollEnd).toBe('true');

		scroller.scrollLeft = 300;
		await fireEvent.scroll(scroller);
		expect(frame.dataset.scrollStart).toBe('true');
		expect(frame.dataset.scrollEnd).toBeUndefined();

		metrics.scrollWidth = 300;
		resizeCallback?.();
		await vi.waitFor(() => {
			expect(frame.dataset.scrollable).toBe('false');
			expect(frame.dataset.scrollStart).toBeUndefined();
			expect(frame.dataset.scrollEnd).toBeUndefined();
		});

		const endMetrics = { clientWidth: 300, scrollWidth: 700, scrollLeft: 0 };
		let endResize: (() => void) | undefined;
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(cb: () => void) {
					endResize = cb;
				}
				observe() {}
				disconnect() {}
			},
		);
		const endView = render(DataTable<Row>, {
			props: {
				rows,
				columns,
				key: (row) => row.id,
				caption: 'Recent days first',
				responsive: { mode: 'scroll', minWidth: '40rem', initialScroll: 'end' },
			},
		});
		const endFrame = endView.container.querySelector<HTMLElement>('[data-slot="data-table-frame"]')!;
		const endScroller = endFrame;
		expect(endScroller.dataset.initialScroll).toBe('end');
		mockScrollMetrics(endScroller, endMetrics);
		endResize?.();
		await vi.waitFor(() => {
			expect(endScroller.scrollLeft).toBe(400);
			expect(endFrame.dataset.scrollStart).toBe('true');
			expect(endFrame.dataset.scrollEnd).toBeUndefined();
		});
		if (originalDesc) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalDesc);
	});
});
