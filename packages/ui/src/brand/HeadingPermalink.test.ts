import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import HeadingPermalink from './HeadingPermalink.svelte';

const heading = (id: string, text: string) => {
	const element = document.body.appendChild(document.createElement('h2'));
	element.id = id;
	element.textContent = text;
	return element;
};

afterEach(() => {
	document.body.innerHTML = '';
});

describe('HeadingPermalink', () => {
	it('links to its target and is named by the label, then the heading text', () => {
		const target = heading('safety', 'Safety first');
		const view = render(HeadingPermalink, { props: { target: 'safety', label: 'Link to this section' } });
		const link = view.getByRole('link', { name: 'Link to this section: Safety first' });
		expect(link.getAttribute('href')).toBe('#safety');
		expect(link.classList.contains('heading-anchor')).toBe(true);
		expect(link.querySelector('[aria-hidden="true"]')?.textContent).toBe('#');
		target.append(link);
		expect(view.getByRole('link', { name: 'Link to this section: Safety first' })).toBe(link);
	});

	it('gives each link its own label so repeated headings keep their own names', () => {
		heading('access', 'Accès');
		heading('hours', 'Horaires');
		const french = { label: 'Lien vers cette section' };
		const first = render(HeadingPermalink, { props: { target: 'access', ...french } });
		render(HeadingPermalink, { props: { target: 'hours', ...french } });
		expect(first.getByRole('link', { name: 'Lien vers cette section: Accès' }).getAttribute('href')).toBe('#access');
		expect(first.getByRole('link', { name: 'Lien vers cette section: Horaires' }).getAttribute('href')).toBe('#hours');
	});
});
