import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import MapLegend, { type MapLegendProps } from './MapLegend.svelte';

const symbol = createRawSnippet(() => ({ render: () => '<span></span>' }));
const base: MapLegendProps = {
	title: 'Legend',
	items: [{ label: 'Stop', detail: 'Served every day', symbol }],
	groups: [{ title: 'Service', items: [{ label: 'Frequent', detail: 'Every ten minutes', symbol }, { label: 'Night', symbol }] }],
	scale: {
		title: 'Late share',
		steps: [{ label: 'Low', swatch: 'gray' }, { label: 'High', swatch: 'black' }],
		states: [{ label: 'No data', detail: 'Too few reports', symbol }],
	},
};

const show = (props: Partial<MapLegendProps> = {}) => render(MapLegend, { props: { ...base, ...props } });
// Generated ids differ between renders; every other byte is compared.
const markup = (container: HTMLElement) => container.innerHTML.replace(/ id="[^"]*"/g, '');
const lists = (container: HTMLElement) =>
	[...container.querySelectorAll('ul, ol')].map((list) => list.getAttribute('aria-label'));

describe('MapLegend', () => {
	it('keeps the detail below its label and the scale after the groups by default', () => {
		const { container } = show();
		expect(lists(container)).toEqual(['Legend', 'Service', 'Late share', 'Late share']);
		expect(container.querySelector('[data-detail-layout]')).toBeNull();
		expect(container.querySelector('.detail')?.textContent).toBe('Served every day');
	});

	it('renders the same markup when the defaults are passed explicitly', () => {
		const omitted = markup(show().container);
		expect(markup(show({ detailLayout: 'below', scalePlacement: 'after-groups' }).container)).toBe(omitted);
	});

	it('sets each detail on its label line without adding punctuation', () => {
		const { container } = show({ detailLayout: 'inline' });
		const items = container.querySelectorAll('ul');
		expect([...items].every((list) => list.dataset.detailLayout === 'inline')).toBe(true);
		const text = [...container.querySelectorAll('ul li')].map((item) => item.textContent?.trim());
		expect(text).toEqual(['Stop Served every day', 'Frequent Every ten minutes', 'Night', 'No data Too few reports']);
	});

	it('changes only the list attribute in inline mode', () => {
		const omitted = markup(show().container);
		const inline = markup(show({ detailLayout: 'inline' }).container);
		expect(inline.replaceAll(' data-detail-layout="inline"', '')).toBe(omitted);
	});

	it('can render the scale between the flat items and the groups', () => {
		const { container } = show({ scalePlacement: 'before-groups' });
		expect(lists(container)).toEqual(['Legend', 'Late share', 'Late share', 'Service']);
		const titles = [...container.querySelectorAll('.group-title')].map((title) => title.textContent);
		expect(titles).toEqual(['Late share', 'Service']);
	});
});
