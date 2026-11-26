import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import FilterSummary, { filterCountText } from './FilterSummary.svelte';

const labels = {
	en: { singular: '{count} alert', plural: '{count} alerts' },
	fr: { singular: '{count} résultat', plural: '{count} résultats' },
	es: { singular: '{count} resultado', plural: '{count} resultados' },
};

const summary = (locale: keyof typeof labels, count: number, onClear = vi.fn()) =>
	render(FilterSummary, { props: { count, locale, countLabel: labels[locale], clearLabel: 'Clear filters', onClear } });
const countText = (view: ReturnType<typeof summary>) =>
	view.container.querySelector('[data-slot="filter-summary-count"]')?.textContent?.trim();

describe('FilterSummary', () => {
	it.each([
		['en', 0, '0 alerts'],
		['en', 1, '1 alert'],
		['en', 5, '5 alerts'],
		['fr', 0, '0 résultat'],
		['fr', 1, '1 résultat'],
		['fr', 2, '2 résultats'],
		['es', 0, '0 resultados'],
		['es', 1, '1 resultado'],
		['es', 2, '2 resultados'],
	] as const)('counts %s %i as %j, the same words filterCountText gives', (locale, count, text) => {
		expect(countText(summary(locale, count))).toBe(text);
		expect(filterCountText(count, labels[locale], locale)).toBe(text);
	});

	it.each([
		['en', 8630],
		['fr', 8630],
		['es', 8630],
		['es', 10420],
	] as const)('formats %s %i with Intl.NumberFormat while keeping plural rules on the raw number', (locale, count) => {
		const formatted = new Intl.NumberFormat(locale).format(count);
		const expected = labels[locale].plural.replace('{count}', formatted);
		expect(filterCountText(count, labels[locale], locale)).toBe(expected);
		expect(countText(summary(locale, count))).toBe(expected);
		if (locale === 'en') expect(expected).toBe('8,630 alerts');
		if (locale === 'fr') expect(expected).toBe(`${formatted} résultats`);
	});

	it('shows the clear label and calls onClear when it is clicked', async () => {
		const onClear = vi.fn();
		const view = summary('en', 3, onClear);
		const clear = view.getByRole('button', { name: 'Clear filters' });
		expect(onClear).not.toHaveBeenCalled();
		await fireEvent.click(clear);
		expect(onClear).toHaveBeenCalledOnce();
	});
});
