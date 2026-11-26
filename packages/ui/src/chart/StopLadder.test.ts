import { render, screen, within } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import StopLadder from './StopLadder.svelte';

it('keeps the ordered ladder, stop links, highlight, and missing readings', () => {
	render(StopLadder, { props: {
		label: 'Delay by stop',
		max: 10,
		columns: { stop: 'Stop', value: 'Delay' },
		threshold: { value: 5, label: 'Five-minute threshold' },
		highlight: { fromId: 'first', toId: 'second', label: 'Where delay builds' },
		stops: [
			{ id: 'first', name: 'First stop', href: '/first', code: '201', timingPoint: true, value: 7, valueLabel: '7 minutes late' },
			{ id: 'second', name: 'Second stop', value: null, valueLabel: 'No value', state: 'Too few trips' },
		],
	} });
	const ladder = screen.getByRole('list', { name: 'Delay by stop' });
	const [first, second] = within(ladder).getAllByRole('listitem');
	expect(ladder.tagName).toBe('OL');
	expect(ladder.getAttribute('data-threshold')).toBe('true');
	expect(first.getAttribute('data-timing-point')).toBe('true');
	expect(first.getAttribute('data-highlighted')).toBe('true');
	expect(second.getAttribute('data-highlighted')).toBe('true');
	expect(within(first).getByRole('link', { name: 'First stop' }).getAttribute('href')).toBe('/first');
	expect(within(first).getByText('201')).toBeInTheDocument();
	expect(within(first).getByText('Where delay builds')).toBeInTheDocument();
	expect(within(first).getByText('7 minutes late')).toBeInTheDocument();
	expect(within(second).getByText('Second stop')).toBeInTheDocument();
	expect(within(second).getByText('Too few trips')).toBeInTheDocument();
	expect(ladder.querySelectorAll('.track[aria-hidden="true"]')).toHaveLength(1);
});
