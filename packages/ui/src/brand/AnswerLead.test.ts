import { render, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AnswerLead, { type AnswerLeadProps } from './AnswerLead.svelte';

const base: AnswerLeadProps = { value: '12–18 min', sentence: 'between two departures.', comparison: 'Shorter than last week.' };
const show = (props: Partial<AnswerLeadProps> = {}) => render(AnswerLead, { props: { ...base, ...props } });
// The generated sentence id differs between renders; every other byte is compared.
const markup = (container: HTMLElement) => container.innerHTML.replace(/ (id|aria-labelledby)="[^"]*"/g, '');
const region = (container: HTMLElement) => within(container).getByRole('region', { name: base.sentence });

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
});
