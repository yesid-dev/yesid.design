import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import ListingBody, { type ListingBodyProps } from './ListingBody.svelte';

const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));
const titleAside = html('<span data-testid="stamp">Record</span>');
const search = html('<input data-testid="search" aria-label="Search lines">');
const summary = html('<div data-testid="summary">3 results</div>');
const sort = html('<div data-testid="sort">Sort controls</div>');
const children = html('<div data-testid="results">Results</div>');
const more = html('<button type="button" data-testid="more">Show more</button>');

const body = (props: Partial<ListingBodyProps> = {}) =>
	render(ListingBody, {
		props: { children, ...props },
	});
type View = ReturnType<typeof body>;

const slot = (view: View, name: string) =>
	view.container.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const precedes = (a: Node, b: Node) =>
	a.compareDocumentPosition(b) === Node.DOCUMENT_POSITION_FOLLOWING;

describe('ListingBody region order', () => {
	it('renders title row, search, summary, sort, results and more in order', () => {
		const view = body({
			title: 'Every measured line',
			titleAside,
			search,
			summary,
			resultCountText: '3 results',
			sort,
			more,
		});

		const root = slot(view, 'listing-body')!;
		const header = slot(view, 'listing-body-header')!;
		const titleEl = slot(view, 'listing-body-title')!;
		const asideEl = slot(view, 'listing-body-aside')!;
		const searchEl = slot(view, 'listing-body-search')!;
		const summaryEl = slot(view, 'listing-body-summary')!;
		const sortEl = slot(view, 'listing-body-sort')!;
		const resultsEl = slot(view, 'listing-body-results')!;
		const moreEl = slot(view, 'listing-body-more')!;

		expect(root.tagName).toBe('SECTION');
		expect(root.getAttribute('aria-labelledby')).toBe(titleEl.id);
		expect(titleEl.tagName).toBe('H2');
		expect(titleEl.textContent).toBe('Every measured line');
		expect(header.contains(titleEl)).toBe(true);
		expect(header.contains(asideEl)).toBe(true);
		expect(precedes(titleEl, asideEl)).toBe(true);

		const sequence = [header, searchEl, summaryEl, sortEl, resultsEl, moreEl];
		for (let i = 0; i < sequence.length - 1; i += 1) {
			expect(precedes(sequence[i]!, sequence[i + 1]!)).toBe(true);
		}
		expect(resultsEl.contains(view.getByTestId('results'))).toBe(true);
		expect(moreEl.contains(view.getByTestId('more'))).toBe(true);
	});

	it('defaults heading to h2 and supports titleLevel={3}', () => {
		const h2View = body({ title: 'Find a stop' });
		expect(h2View.getByRole('heading', { level: 2, name: 'Find a stop' })).toBeInTheDocument();

		const h3View = body({ title: 'Find a vehicle', titleLevel: 3 });
		const heading = h3View.getByRole('heading', { level: 3, name: 'Find a vehicle' });
		expect(heading.tagName).toBe('H3');
		expect(slot(h3View, 'listing-body')?.getAttribute('aria-labelledby')).toBe(heading.id);
	});
});

describe('ListingBody absent regions', () => {
	it('emits no element for absent optional regions', () => {
		const view = body();
		for (const name of [
			'listing-body-header',
			'listing-body-title',
			'listing-body-aside',
			'listing-body-search',
			'listing-body-summary',
			'listing-body-result-status',
			'listing-body-sort',
			'listing-body-more',
		]) {
			expect(slot(view, name), name).toBeNull();
		}
		expect(slot(view, 'listing-body')?.hasAttribute('aria-labelledby')).toBe(false);
		expect(slot(view, 'listing-body-results')).not.toBeNull();
	});

	it('renders title without aside and aside without title cleanly', () => {
		const titleOnly = body({ title: 'Every measured line' });
		expect(slot(titleOnly, 'listing-body-header')).not.toBeNull();
		expect(slot(titleOnly, 'listing-body-title')).not.toBeNull();
		expect(slot(titleOnly, 'listing-body-aside')).toBeNull();

		const asideOnly = body({ titleAside });
		expect(slot(asideOnly, 'listing-body-header')).not.toBeNull();
		expect(slot(asideOnly, 'listing-body-title')).toBeNull();
		expect(slot(asideOnly, 'listing-body-aside')).not.toBeNull();
		expect(slot(asideOnly, 'listing-body')?.hasAttribute('aria-labelledby')).toBe(false);
	});

	it('treats an empty title string as absent', () => {
		const view = body({ title: '' });
		expect(slot(view, 'listing-body-header')).toBeNull();
		expect(slot(view, 'listing-body-title')).toBeNull();
		expect(slot(view, 'listing-body')?.hasAttribute('aria-labelledby')).toBe(false);
	});
});

describe('ListingBody polite status contract', () => {
	it('keeps a visually hidden role="status" element whenever resultCountText is defined', async () => {
		const view = body({ resultCountText: '6 lines' });
		const status = slot(view, 'listing-body-result-status')!;
		expect(status).not.toBeNull();
		expect(status.getAttribute('role')).toBe('status');
		expect(status.classList.contains('sr-only')).toBe(true);
		expect(status.textContent).toBe('6 lines');

		await view.rerender({ children, resultCountText: '1 line' });
		expect(slot(view, 'listing-body-result-status')).toBe(status);
		expect(status.textContent).toBe('1 line');

		await view.rerender({ children, resultCountText: '' });
		expect(slot(view, 'listing-body-result-status')).toBe(status);
		expect(status.textContent).toBe('');
	});

	it('emits no status element when resultCountText is undefined', () => {
		const view = body();
		expect(slot(view, 'listing-body-result-status')).toBeNull();
	});
});
