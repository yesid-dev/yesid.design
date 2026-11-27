import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { expect, it, vi } from 'vitest';
import ChartFrame from './ChartFrame.svelte';
import type { ChartPlot } from './geometry.js';

it('replaces the plot with one decorative skeleton while keeping its area and legend', async () => {
	const plot = vi.fn(() => ({ render: () => '<g data-plot></g>' }));
	const view = render(ChartFrame, {
		props: {
			label: 'Service by hour',
			xDomain: [0, 24],
			yDomain: [0, 100],
			children: createRawSnippet<[ChartPlot]>(plot),
			legend: createRawSnippet(() => ({ render: () => '<div>Service legend</div>' })),
		},
	});
	const frame = screen.getByRole('figure', { name: 'Service by hour' });
	const area = frame.querySelector('[data-slot="chart-area"]')!;
	const initial = frame.outerHTML;
	const legend = screen.getByText('Service legend');
	plot.mockClear();
	await view.rerender({ loading: true });
	expect(frame.getAttribute('aria-busy')).toBe('true');
	expect(area.querySelectorAll('[data-slot="skeleton"][aria-hidden="true"]')).toHaveLength(1);
	expect(area.querySelector('svg')).toBeNull();
	expect(plot).not.toHaveBeenCalled();
	expect(screen.getByText('Service legend')).toBe(legend);
	await view.rerender({ loading: false });
	expect(frame.outerHTML).toBe(initial);
});
