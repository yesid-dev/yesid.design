import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import ListingRail from './ListingRail.svelte';

it('owns one real h1 and its public id, without adding focus targets', () => {
	const view = render(ListingRail, { heading: 'Contact', titleId: 'contact-title', clipAtHeader: false });
	const heading = view.getByRole('heading', { level: 1, name: 'Contact' });
	expect(heading.id).toBe('contact-title');
	expect(heading.closest('[aria-hidden="true"]')).toBeNull();
	expect(view.container.querySelectorAll('a, button, [tabindex]')).toHaveLength(0);
	expect(view.container.querySelector('[data-slot="listing-accent-rail"]')?.getAttribute('aria-hidden')).toBe('true');
});

it('supports another heading level and an explicit decorative mode', () => {
	const semantic = render(ListingRail, { heading: 'Details', level: 2 });
	expect(semantic.getByRole('heading', { level: 2 }).textContent).toBe('Details.');
	semantic.unmount();
	const view = render(ListingRail, { heading: 'Catalogue', decorative: true });
	expect(view.queryByRole('heading')).toBeNull();
	expect(view.container.querySelector('[data-slot="listing-edge-title"]')?.getAttribute('aria-hidden')).toBe('true');
});
