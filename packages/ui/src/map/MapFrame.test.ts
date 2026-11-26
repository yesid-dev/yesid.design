import { render, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import MapFrame, { type MapFrameProps } from './MapFrame.svelte';

const children = createRawSnippet(() => ({ render: () => '<div>Map</div>' }));
const legend = createRawSnippet(() => ({ render: () => '<p>Legend</p>' }));
const base: MapFrameProps = { label: 'Service map', children, legend, legendLabel: 'Show legend' };

const show = (props: Partial<MapFrameProps> = {}) => render(MapFrame, { props: { ...base, ...props } });
// Generated ids differ between renders; every other byte is compared.
const markup = (container: HTMLElement) => container.innerHTML.replace(/ (id|aria-controls)="[^"]*"/g, '');

describe('MapFrame', () => {
	it('adds no layout attributes by default or when the defaults are passed', () => {
		const omitted = show();
		const frame = within(omitted.container).getByRole('region', { name: 'Service map' });
		expect(frame.hasAttribute('data-fill-height')).toBe(false);
		expect(frame.hasAttribute('data-legend-side')).toBe(false);
		expect(markup(show({ fillHeight: false, legendSide: 'end' }).container)).toBe(markup(omitted.container));
	});

	it('marks a frame that fills its host and a legend docked at the start', () => {
		const omitted = markup(show().container);
		const view = show({ fillHeight: true, legendSide: 'start' });
		const frame = within(view.container).getByRole('region', { name: 'Service map' });
		expect(frame.hasAttribute('data-fill-height')).toBe(true);
		expect(frame.dataset.legendSide).toBe('start');
		const stripped = markup(view.container).replace(/ data-fill-height="[^"]*"| data-legend-side="start"/g, '');
		expect(stripped).toBe(omitted);
	});
});
