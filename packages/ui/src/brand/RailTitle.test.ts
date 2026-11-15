import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import RailTitle from './RailTitle.svelte';

const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));
const content = html('<div data-testid="content"><p>Section content</p></div>');
const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

describe('RailTitle', () => {
	it('is the section heading, an h2 by default, ending on the hidden orange dot', () => {
		const view = render(RailTitle, { props: { heading: 'Selected work' } });
		const heading = view.getByRole('heading', { level: 2 });
		expect(heading.textContent).toBe('Selected work.');
		expect(heading.closest('[aria-hidden]')).toBeNull();
		const dot = slot(view.container, 'rail-title-dot');
		expect(dot.getAttribute('aria-hidden')).toBe('true');
		expect(dot.textContent).toBe('.');
		// The dot stays on the last word's line.
		expect(dot.parentElement!.classList.contains('rail-title-tail')).toBe(true);
		expect(dot.parentElement!.textContent).toBe('work.');
		expect(slot(view.container, 'rail-title').dataset.side).toBe('left');
	});

	it('takes a level, a side and no dot', () => {
		const view = render(RailTitle, { props: { heading: 'Contact', level: 1, side: 'right', dot: false, titleId: 'contact-title' } });
		expect(view.getByRole('heading', { level: 1 }).textContent).toBe('Contact');
		expect(view.getByRole('heading', { level: 1 }).id).toBe('contact-title');
		expect(slot(view.container, 'rail-title-dot')).toBeNull();
		expect(slot(view.container, 'rail-title').dataset.side).toBe('right');
	});

	it('comes first in the DOM, before the section content it lays out', () => {
		const view = render(RailTitle, { props: { heading: 'Services', side: 'right', children: content, id: 'services' } });
		const layout = slot(view.container, 'rail-title-layout');
		expect(layout.id).toBe('services');
		expect(layout.dataset.side).toBe('right');
		expect(layout.firstElementChild).toBe(slot(layout, 'rail-title'));
		const body = slot(layout, 'rail-title-content');
		expect(body.contains(view.getByTestId('content'))).toBe(true);
		expect(layout.lastElementChild).toBe(body);
		expect(view.getAllByRole('heading')).toHaveLength(1);
	});

	it('passes a shared size and caller attributes to the title when it has no content', () => {
		const view = render(RailTitle, {
			props: { heading: 'About', size: '4rem', class: 'home-title', 'data-testid': 'about' },
		});
		const title = view.getByTestId('about');
		expect(title).toBe(slot(view.container, 'rail-title'));
		expect(title.classList.contains('home-title')).toBe(true);
		expect(title.style.getPropertyValue('--rail-title-size')).toBe('4rem');
	});

	it('draws hidden decoration, not a heading, when decorative', () => {
		const view = render(RailTitle, { props: { heading: 'Catalogue', decorative: true } });
		expect(view.queryAllByRole('heading')).toHaveLength(0);
		const title = slot(view.container, 'rail-title');
		expect(title.getAttribute('aria-hidden')).toBe('true');
		expect(title.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
		expect(title.textContent).toBe('Catalogue.');
	});
});
