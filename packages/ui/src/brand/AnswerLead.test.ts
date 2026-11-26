import { render, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import AnswerLead, { type AnswerLeadProps } from './AnswerLead.svelte';

const base: AnswerLeadProps = { value: '12–18 min', sentence: 'between two departures.', comparison: 'Shorter than last week.' };
const show = (props: Partial<AnswerLeadProps> = {}) => render(AnswerLead, { props: { ...base, ...props } });
// The generated ids differ between renders; every other byte is compared.
const markup = (container: HTMLElement) => container.innerHTML.replace(/ (id|aria-labelledby)="[^"]*"/g, '');
const region = (container: HTMLElement) => within(container).getByRole('region', { name: `${base.value} ${base.sentence}` });
const noReading = createRawSnippet(() => ({ render: () => '<span>No reading yet</span>' }));

// The only region in the view, with its computed accessible name.
function named(container: HTMLElement) {
	let name = '';
	const element = within(container).getByRole('region', { name: (computed) => { name = computed; return true; } });
	return { element, name };
}
const occurrences = (text: string, part: string) => text.split(part).length - 1;

describe('AnswerLead', () => {
	it('keeps the threshold layout without a layout attribute', () => {
		const omitted = show();
		expect(region(omitted.container).hasAttribute('data-layout')).toBe(false);
		expect(markup(show({ layout: 'threshold' }).container)).toBe(markup(omitted.container));
	});

	it('marks the fit layout and changes nothing else', () => {
		const omitted = markup(show().container);
		const view = show({ layout: 'fit' });
		expect(region(view.container).dataset.layout).toBe('fit');
		expect(markup(view.container).replace(' data-layout="fit"', '')).toBe(omitted);
	});

	describe.each(['threshold', 'fit'] as const)('in the %s layout', (layout) => {
		it('names the section by the figure, then the sentence, reading the figure once', () => {
			const { container } = show({ value: '78', sentence: 'vehicles are reporting now.', layout });
			const { element, name } = named(container);
			expect(name).toBe('78 vehicles are reporting now.');
			expect(occurrences(name, '78')).toBe(1);
			// The visible figure stays in the tree, once, as the first part of the statement.
			expect(within(element).getAllByText('78')).toHaveLength(1);
			expect(element.querySelector('[aria-hidden]')).toBeNull();
			expect(element.textContent!.indexOf('78')).toBeLessThan(element.textContent!.indexOf('vehicles are reporting now.'));
		});

		it('reads what stands in for an absent figure before the sentence', () => {
			const { container } = show({ value: null, sentence: 'Saturday’s results are missing.', absent: noReading, layout });
			const { element, name } = named(container);
			expect(name).toBe('No reading yet Saturday’s results are missing.');
			expect(occurrences(name, 'No reading yet')).toBe(1);
			expect(within(element).getAllByText('No reading yet')).toHaveLength(1);
		});

		it('names the section by the sentence alone with neither a figure nor an absent mark', () => {
			const { container } = show({ value: null, sentence: 'Saturday’s results are missing.', layout });
			expect(named(container).name).toBe('Saturday’s results are missing.');
		});
	});
});
