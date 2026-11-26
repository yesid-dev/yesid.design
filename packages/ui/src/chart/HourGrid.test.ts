import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HourGrid, { type HourGridCell } from './HourGrid.svelte';

const columns = Array.from({ length: 14 }, (_, index) => ({
	id: `d${index + 1}`,
	label: `Day ${index + 1}`,
}));

const rows = [
	{
		id: 'am',
		label: 'Morning',
		cells: columns.map(
			(column, index): HourGridCell => ({
				text: String(index + 1),
				level: (index % 5) as 0 | 1 | 2 | 3 | 4,
				name: `Morning, ${column.label}, ${index + 1}`,
			}),
		),
	},
];

const scale = { label: 'Scale', steps: ['0', '1', '2', '3', '4'] };
const stateLabels = { few: 'Few', none: 'None', unmeasured: 'Unmeasured' };

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

afterEach(() => vi.restoreAllMocks());

describe('HourGrid', () => {
	it('shows edge fades only on overflowing sides and updates on scroll and resize', async () => {
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

		const view = render(HourGrid, {
			props: { label: 'Daily readings', columns, rows, scale, stateLabels },
		});
		const wrap = view.container.querySelector<HTMLElement>('.scroll-wrap')!;
		const scroller = view.getByRole('region', { name: 'Daily readings' });
		expect(wrap.dataset.scrollStart).toBeUndefined();
		expect(wrap.dataset.scrollEnd).toBeUndefined();

		const metrics = { clientWidth: 320, scrollWidth: 720, scrollLeft: 0 };
		mockScrollMetrics(scroller, metrics);
		resizeCallback?.();
		await vi.waitFor(() => {
			expect(wrap.dataset.scrollStart).toBeUndefined();
			expect(wrap.dataset.scrollEnd).toBe('true');
		});

		scroller.scrollLeft = 180;
		await fireEvent.scroll(scroller);
		expect(wrap.dataset.scrollStart).toBe('true');
		expect(wrap.dataset.scrollEnd).toBe('true');

		scroller.scrollLeft = 400;
		await fireEvent.scroll(scroller);
		expect(wrap.dataset.scrollStart).toBe('true');
		expect(wrap.dataset.scrollEnd).toBeUndefined();

		metrics.scrollWidth = 320;
		resizeCallback?.();
		await vi.waitFor(() => {
			expect(wrap.dataset.scrollStart).toBeUndefined();
			expect(wrap.dataset.scrollEnd).toBeUndefined();
		});
	});

	it('starts scrolled to the end when initialScroll="end" is passed', async () => {
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

		const view = render(HourGrid, {
			props: { label: 'Recent daily readings', columns, rows, scale, stateLabels, initialScroll: 'end' },
		});
		const wrap = view.container.querySelector<HTMLElement>('.scroll-wrap')!;
		const scroller = view.getByRole('region', { name: 'Recent daily readings' });
		expect(scroller.dataset.initialScroll).toBe('end');
		expect(scroller.hasAttribute('data-scroll-hydrated')).toBe(true);

		mockScrollMetrics(scroller, { clientWidth: 300, scrollWidth: 700, scrollLeft: 0 });
		resizeCallback?.();
		await vi.waitFor(() => {
			expect(scroller.scrollLeft).toBe(400);
			expect(wrap.dataset.scrollStart).toBe('true');
			expect(wrap.dataset.scrollEnd).toBeUndefined();
		});

		// Once the user scrolls back toward the start, later resizes preserve their position.
		scroller.scrollLeft = 0;
		await fireEvent.scroll(scroller);
		expect(wrap.dataset.scrollStart).toBeUndefined();
		expect(wrap.dataset.scrollEnd).toBe('true');

		resizeCallback?.();
		expect(scroller.scrollLeft).toBe(0);
	});
});
