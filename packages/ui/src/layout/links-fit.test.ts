import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { linksFit } from './links-fit.js';

// jsdom has no layout: each element gets a fixed width, and the pill is as wide as what stays in its row.
const BASE = 300;
const DIVIDER = 20;
let notify: () => void;

beforeEach(() => {
	vi.stubGlobal('ResizeObserver', class {
		constructor(callback: () => void) { notify = callback; }
		observe() {}
		unobserve() {}
		disconnect() {}
	});
});
afterEach(() => {
	vi.unstubAllGlobals();
	document.body.innerHTML = '';
});

const inRow = (element: HTMLElement) => element.style.position !== 'absolute';

function header(rootWidth: number, links: Array<[priority: 1 | 2 | 3, width: number]>) {
	document.body.innerHTML = `<header data-slot="site-header" style="padding: 0px"><nav class="nav-pill"><a class="nav-wordmark"></a>
		<span class="nav-divider nav-links-part"></span><div class="nav-links nav-links-part">
		${links.map(([priority]) => `<span data-priority="${priority}"><a></a></span>`).join('')}</div></nav></header>`;
	const root = document.querySelector<HTMLElement>('header')!;
	const pill = root.querySelector<HTMLElement>('nav')!;
	const row = pill.querySelector<HTMLElement>('.nav-links')!;
	const divider = pill.querySelector<HTMLElement>('.nav-divider')!;
	const items = [...row.children] as HTMLElement[];
	items.forEach((item, i) => Object.defineProperty(item, 'offsetWidth', { get: () => links[i][1] }));
	let width = rootWidth;
	Object.defineProperty(root, 'clientWidth', { get: () => width });
	pill.getBoundingClientRect = () => {
		// A collapsed row (the open menu folds it to max-width 0) adds nothing to the pill.
		const collapsed = row.classList.contains('nav-collapsed');
		const shown = inRow(row) && !collapsed ? items.filter(inRow).reduce((sum, item) => sum + item.offsetWidth, 0) : 0;
		return { width: BASE + (inRow(divider) ? DIVIDER : 0) + shown } as DOMRect;
	};
	const action = linksFit(pill, { paused: false });
	notify();
	return {
		pill,
		row,
		items,
		update: action.update,
		resize(next: number) { width = next; notify(); },
		shown: () => (inRow(row) ? items.filter(inRow).map((item) => item.dataset.priority) : []),
		destroy: () => action.destroy(),
	};
}

describe('linksFit', () => {
	it('keeps every link while the pill fits', () => {
		const view = header(600, [[2, 80], [2, 80], [1, 70]]);
		expect(view.shown()).toEqual(['2', '2', '1']);
		expect(view.pill.hasAttribute('data-links-overflow')).toBe(false);
	});

	it('drops priority 2 before priority 1, so the priority-one link stays in the pill', () => {
		// 300 + 20 + 230 = 550 does not fit 520 - 8; without priority 2, 390 does.
		const view = header(520, [[2, 80], [2, 80], [1, 70]]);
		expect(view.shown()).toEqual(['1']);
		expect(view.pill.hasAttribute('data-links-overflow')).toBe(false);
		expect(view.items.filter((item) => item.hasAttribute('data-links-dropped')).map((item) => item.dataset.priority)).toEqual(['2', '2']);
		expect(view.items[0].style.visibility).toBe('hidden');
		expect(view.items[2].style.visibility).toBe('');
	});

	it('drops priority 3 first and keeps lower numbers while they fit', () => {
		const view = header(560, [[1, 60], [2, 60], [3, 120]]);
		expect(view.shown()).toEqual(['1', '2']);
	});

	it('takes the whole row out when priority 1 alone does not fit', () => {
		const view = header(400, [[2, 80], [1, 90]]);
		expect(view.shown()).toEqual([]);
		expect(view.pill.hasAttribute('data-links-overflow')).toBe(true);
	});

	it('takes a single tier out as a whole, so equal priorities leave together', () => {
		const view = header(560, [[3, 80], [3, 80], [3, 80]]);
		expect(view.shown()).toEqual([]);
		expect(view.pill.hasAttribute('data-links-overflow')).toBe(true);
	});

	it('keeps a dropped tier out when the menu closes and the row grows back', () => {
		const view = header(520, [[2, 80], [2, 80], [1, 70]]);
		expect(view.shown()).toEqual(['1']);
		view.row.classList.add('nav-collapsible');
		view.update({ paused: true });
		view.row.classList.add('nav-collapsed');
		// The menu closes: the action resumes while the row is still folded.
		view.update({ paused: false });
		expect(view.shown()).toEqual(['1']);
		view.row.classList.remove('nav-collapsed');
		const end = new Event('transitionend', { bubbles: true });
		Object.defineProperty(end, 'propertyName', { value: 'max-width' });
		view.row.dispatchEvent(end);
		expect(view.shown()).toEqual(['1']);
		expect(view.pill.getBoundingClientRect().width).toBeLessThanOrEqual(512);
		view.destroy();
	});

	it('brings links back by tier when the header grows', () => {
		const view = header(380, [[2, 80], [2, 80], [1, 70]]);
		expect(view.shown()).toEqual([]);
		view.resize(520);
		expect(view.shown()).toEqual(['1']);
		view.resize(600);
		expect(view.shown()).toEqual(['2', '2', '1']);
		expect(view.items.some((item) => item.hasAttribute('data-links-dropped'))).toBe(false);
		view.destroy();
	});

});
