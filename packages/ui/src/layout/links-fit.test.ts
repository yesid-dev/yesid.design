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

	it('clears measured document clearance when the picker fits, leaves, or unmounts', () => {
		const view = header(1024, []);
		view.pill.insertAdjacentHTML('beforeend', '<div data-slot="site-header-network"><button></button></div>');
		view.pill.getBoundingClientRect = () => ({ width: 1050 }) as DOMRect;
		const documentBelow = () => document.documentElement.hasAttribute('data-site-header-network-below');
		const options = { paused: false, onNetworkInline: vi.fn() };
		try {
			view.update(options);
			expect(documentBelow()).toBe(true);
			view.resize(1440);
			expect(documentBelow()).toBe(false);
			view.resize(1024);
			expect(documentBelow()).toBe(true);
			view.update({ paused: false });
			expect(documentBelow()).toBe(false);
			view.update(options);
			expect(documentBelow()).toBe(true);
		} finally {
			view.destroy();
		}
		expect(documentBelow()).toBe(false);
	});
});

describe('linksFit network picker', () => {
	// The pill is 1020 wide with both links (300 + 20 + 400 + 300). The picker adds its full name
	// (200) or its short code (50) inline, and nothing below the pill.
	const NAME = 200;
	const CODE = 50;
	const documentBelow = () => document.documentElement.hasAttribute('data-site-header-network-below');

	function networkHeader(rootWidth: number) {
		const view = header(rootWidth, [[1, 400], [2, 300]]);
		view.pill.insertAdjacentHTML('beforeend', '<div data-slot="site-header-network"><label></label></div>');
		const linksWidth = view.pill.getBoundingClientRect;
		let measures = 0;
		const below = () => view.pill.hasAttribute('data-network-below') && !view.pill.hasAttribute('data-network-measuring');
		view.pill.getBoundingClientRect = () => {
			measures += 1;
			const network = below() ? 0 : view.pill.hasAttribute('data-network-code') ? CODE : NAME;
			return { width: linksWidth().width + network } as DOMRect;
		};
		const onNetworkInline = vi.fn();
		view.update({ paused: false, onNetworkInline });
		return {
			...view,
			onNetworkInline,
			measures: () => measures,
			state: () => view.pill.hasAttribute('data-network-below') ? 'below'
				: view.pill.hasAttribute('data-network-code') ? 'code' : 'name',
		};
	}

	it('keeps the full name inline while it fits', () => {
		const view = networkHeader(1300);
		expect(view.state()).toBe('name');
		expect(view.onNetworkInline).toHaveBeenLastCalledWith(true);
		expect(view.shown()).toEqual(['1', '2']);
		expect(documentBelow()).toBe(false);
		view.destroy();
	});

	it('shows the short code inline before moving the picker below or dropping links', () => {
		// The full name needs 1220 of 1142; the code needs 1070.
		const view = networkHeader(1150);
		expect(view.state()).toBe('code');
		expect(view.pill.hasAttribute('data-network-measuring')).toBe(false);
		expect(view.onNetworkInline).toHaveBeenLastCalledWith(true);
		expect(view.shown()).toEqual(['1', '2']);
		expect(documentBelow()).toBe(false);
		view.destroy();
	});

	it('moves the picker below only when the code does not fit either, then drops links', () => {
		const view = networkHeader(1050);
		expect(view.state()).toBe('below');
		expect(view.pill.hasAttribute('data-network-code')).toBe(false);
		expect(view.onNetworkInline).toHaveBeenLastCalledWith(false);
		expect(view.shown()).toEqual(['1', '2']);
		expect(documentBelow()).toBe(true);
		view.resize(1024);
		expect(view.state()).toBe('below');
		expect(view.shown()).toEqual(['1']);
		view.destroy();
	});

	it('returns to the code and then the full name as the header grows', () => {
		const view = networkHeader(1050);
		const states: unknown[][] = [];
		for (const width of [1150, 1300, 1150, 1050, 1300]) {
			view.resize(width);
			states.push([view.state(), view.onNetworkInline.mock.lastCall?.[0], documentBelow()]);
		}
		expect(states).toEqual([
			['code', true, false],
			['name', true, false],
			['code', true, false],
			['below', false, true],
			['name', true, false],
		]);
		expect(view.pill.hasAttribute('data-network-measuring')).toBe(false);
		view.destroy();
	});

	it('clears the code under 1024, without a network option and when it unmounts', () => {
		const view = networkHeader(1150);
		view.resize(1000);
		expect(view.state()).toBe('below');
		expect(view.pill.hasAttribute('data-network-code')).toBe(false);
		view.resize(1150);
		expect(view.state()).toBe('code');
		view.update({ paused: false });
		expect(view.pill.hasAttribute('data-network-code')).toBe(false);
		view.update({ paused: false, onNetworkInline: vi.fn() });
		expect(view.state()).toBe('code');
		view.destroy();
		expect(view.pill.hasAttribute('data-network-code')).toBe(false);
		expect(view.pill.hasAttribute('data-network-below')).toBe(false);
	});

	it('does not measure again for its own attribute changes', async () => {
		const view = networkHeader(1300);
		await new Promise((resolve) => requestAnimationFrame(resolve));
		view.resize(1150);
		expect(view.state()).toBe('code');
		const measures = view.measures();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(view.measures()).toBe(measures);
		view.destroy();
	});
});
