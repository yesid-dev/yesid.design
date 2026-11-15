import { fireEvent, render, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ListingFrame, { type ListingFrameProps } from './ListingFrame.svelte';

const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));
const blueprint = html('<div data-testid="blueprint">Art</div>');
const aside = html('<p data-testid="aside">Inventory</p>');
const search = html('<input data-testid="search" aria-label="Search the catalogue">');
const filters = html(
	'<div data-testid="filter-controls"><input aria-label="Filter query"><button type="button">Apply filters</button></div>',
);
const children = html('<div data-testid="results">Results</div>');

const frame = (props: Partial<ListingFrameProps> = {}) =>
	render(ListingFrame, {
		props: { heading: 'Lines', subtitle: 'Network', filterLabel: 'Filters', blueprint, filters, children, ...props },
	});
type View = ReturnType<typeof frame>;

const slot = (view: View, name: string) => view.container.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
const toggle = (view: View) => within(view.container).getByRole('button', { name: 'Filters' });
const panel = (view: View) => slot(view, 'listing-filter-panel');
const isOpen = (view: View) => [toggle(view).getAttribute('aria-expanded'), panel(view).dataset.state];
const precedes = (a: Node, b: Node) => a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING;
const click = fireEvent.click;

afterEach(() => sessionStorage.clear());

describe('header', () => {
	it('has one h1 and puts the artwork, copy and aside inside the header', () => {
		const view = frame({ description: 'Every line.', aside });
		const header = slot(view, 'blueprint-listing-header');
		expect(header.querySelectorAll('h1')).toHaveLength(1);
		expect(view.getByRole('heading', { level: 1 }).textContent).toBe('Lines.');
		for (const text of ['Network', 'Every line.']) expect(header.textContent).toContain(text);
		for (const id of ['blueprint', 'aside']) expect(header.contains(view.getByTestId(id))).toBe(true);
	});

	it('calls onHeaderMount once with the header and frame, and runs its cleanup on unmount', () => {
		const cleanup = vi.fn();
		const onHeaderMount = vi.fn(() => cleanup);
		const view = frame({ onHeaderMount });
		expect(onHeaderMount).toHaveBeenCalledOnce();
		const [header, host] = onHeaderMount.mock.calls[0] as unknown as HTMLElement[];
		expect(header).toBe(slot(view, 'blueprint-listing-header'));
		expect(host).toBe(slot(view, 'listing-frame'));

		expect(cleanup).not.toHaveBeenCalled();
		view.unmount();
		expect(cleanup).toHaveBeenCalledOnce();
	});
});

describe('edge title', () => {
	it.each(['Notes', 'Un catalogue de travaux et de recherches', ''])('shows the supplied title %j and the results', (edgeTitle) => {
		const view = frame({ edgeTitle });
		expect(slot(view, 'listing-edge-title').textContent?.trim()).toBe(`${edgeTitle}.`);
		expect(view.getByTestId('results').textContent).toBe('Results');
	});

	it('defaults to the heading and stays hidden from assistive technology', () => {
		const column = slot(frame(), 'listing-edge-title');
		expect(column.textContent?.trim()).toBe('Lines.');
		expect(column.getAttribute('aria-hidden')).toBe('true');
	});
	it('draws the edge title with a decorative left RailTitle, adding no heading', () => {
		const view = frame({ edgeTitle: 'Catalogue' });
		const title = slot(view, 'listing-edge-title').querySelector<HTMLElement>('[data-slot="rail-title"]')!;
		expect(title.dataset.side).toBe('left');
		expect(title.getAttribute('aria-hidden')).toBe('true');
		expect(title.classList.contains('edge-title')).toBe(true);
		expect(title.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
		expect(view.getAllByRole('heading')).toHaveLength(1);
	});
});

describe('result count', () => {
	it('announces resultCountText in a polite status that is always present', async () => {
		const view = frame({ resultCountText: '3 results' });
		const status = slot(view, 'listing-result-status');
		expect(status.getAttribute('role')).toBe('status');
		expect(status.classList.contains('sr-only')).toBe(true);
		expect(status.textContent).toBe('3 results');
		expect(slot(view, 'listing-content').contains(status)).toBe(true);
		await view.rerender({ resultCountText: '1 result' });
		expect(slot(view, 'listing-result-status')).toBe(status);
		expect(status.textContent).toBe('1 result');
	});

	it('adds no status without resultCountText', () => {
		expect(slot(frame(), 'listing-result-status')).toBeNull();
	});
});

describe('reading presentation', () => {
	const reading = (props: Partial<ListingFrameProps> = {}) => frame({ presentation: 'reading', ...props });

	it('keeps the expressive presentation as the default', () => {
		expect(slot(frame(), 'listing-frame').dataset.presentation).toBe('expressive');
		expect(slot(reading(), 'listing-frame').dataset.presentation).toBe('reading');
	});

	it('shows one plain h1 and no edge title, rail or artwork', () => {
		const view = reading({ edgeTitle: 'Un catalogue', description: 'Every line.', aside });
		const header = slot(view, 'blueprint-listing-header');
		expect(header.querySelectorAll('h1')).toHaveLength(1);
		expect(view.getByRole('heading', { level: 1 }).textContent).toBe('Lines');
		for (const name of ['listing-edge-title', 'listing-accent-rail', 'blueprint-listing-art']) {
			expect(slot(view, name)).toBeNull();
		}
		expect(view.queryByTestId('blueprint')).toBeNull();
		expect(view.queryByText('Un catalogue')).toBeNull();
		for (const text of ['Network', 'Every line.']) expect(header.textContent).toContain(text);
		expect(header.contains(view.getByTestId('aside'))).toBe(true);
	});

	it('works without a blueprint and draws a neutral line instead of hazard tape', () => {
		const view = render(ListingFrame, {
			props: { presentation: 'reading', heading: 'Lines', subtitle: 'Network', filterLabel: 'Filters', filters, children },
		});
		const rule = view.getByTestId('listing-page-separator');
		expect(rule.getAttribute('aria-hidden')).toBe('true');
		expect(rule.getAttribute('data-slot')).not.toBe('separator');
		expect(view.getByTestId('results')).toBeInTheDocument();
	});
});

describe('rule option (D22)', () => {
	it.each([
		['expressive', undefined, 'hazard'],
		['reading', undefined, 'line'],
		['expressive', 'dimension', 'dimension'],
		['reading', 'dimension', 'dimension'],
		['reading', 'hazard', 'hazard'],
		['expressive', 'line', 'line'],
	] as const)('in the %s presentation, rule %j draws the %s rule', (presentation, rule, drawn) => {
		const view = frame({ presentation, rule, search });
		const separator = view.getByTestId('listing-page-separator');
		expect(slot(view, 'listing-frame').dataset.rule).toBe(drawn);
		expect(separator.getAttribute('aria-hidden')).toBe('true');
		expect(separator.classList.contains('dimension-line')).toBe(drawn === 'dimension');
		expect(separator.getAttribute('data-variant')).toBe(drawn === 'dimension' ? 'dimension' : null);
		expect(separator.classList.contains('listing-line')).toBe(drawn === 'line');
		// One rule between the header and the list: the search never draws its own.
		const rules = view.container.querySelectorAll('[data-slot="separator"], .listing-line');
		expect(rules).toHaveLength(1);
		expect(rules[0]).toBe(separator);
		expect(slot(view, 'listing-filter-search').querySelector('[data-slot="separator"], .listing-line')).toBeNull();
	});
});

describe('layout order', () => {
	it('runs from the separator through the filter column to the results', () => {
		const view = frame({ search });
		const [separator, column, results] = [
			view.getByTestId('listing-page-separator'),
			slot(view, 'listing-filter-column'),
			slot(view, 'listing-content'),
		];
		expect(precedes(separator, column)).toBe(true);
		expect(precedes(column, results)).toBe(true);
		expect(results.contains(view.getByTestId('results'))).toBe(true);
		expect(column.tagName).toBe('ASIDE');
	});

	it('shows search above the panel inside the filter column and mounts the filters once', () => {
		const view = frame({ search });
		const column = slot(view, 'listing-filter-column');
		expect(column.contains(view.getByTestId('search'))).toBe(true);
		expect(precedes(view.getByTestId('search'), toggle(view))).toBe(true);
		expect(precedes(toggle(view), panel(view))).toBe(true);
		expect(view.getAllByTestId('filter-controls')).toHaveLength(1);
		expect(panel(view).contains(view.getByTestId('filter-controls'))).toBe(true);
	});

	it('omits the search slot without a search snippet', () => {
		expect(slot(frame(), 'listing-filter-search')).toBeNull();
	});
});

describe('filter toggle', () => {
	it('starts closed, flips the toggle and panel together, and controls the panel', async () => {
		const view = frame();
		expect(isOpen(view)).toEqual(['false', 'closed']);
		expect(toggle(view).getAttribute('aria-controls')).toBe(panel(view).id);

		await click(toggle(view));
		expect(isOpen(view)).toEqual(['true', 'open']);
		await click(toggle(view));
		expect(isOpen(view)).toEqual(['false', 'closed']);
	});

	it('never makes the panel inert or aria-hidden, so the filters stay reachable', async () => {
		const view = frame();
		const input = view.getByLabelText('Filter query');
		for (const open of [false, true]) {
			if (open) await click(toggle(view));
			expect(panel(view).hasAttribute('inert')).toBe(false);
			expect(panel(view).hasAttribute('aria-hidden')).toBe(false);
			expect(input.closest('[inert], [aria-hidden="true"]')).toBeNull();
		}
	});

	it('opens no dialog or backdrop and leaves page scroll alone', async () => {
		const view = frame();
		await click(toggle(view));
		expect(view.container.querySelector('[role="dialog"], [data-slot="listing-filter-backdrop"]')).toBeNull();
		expect(document.body.style.overflow).not.toBe('hidden');
	});

	it('starts closed on every remount', async () => {
		const first = frame();
		await click(toggle(first));
		first.unmount();
		expect(isOpen(frame())).toEqual(['false', 'closed']);
	});
});
