import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SearchInput, { type SearchInputProps } from './SearchInput.svelte';
import Ref from './test-fixtures/SearchInputRef.svelte';
import Persisted from './test-fixtures/SearchInputPersisted.svelte';

const field = (props: Partial<SearchInputProps> = {}) =>
	render(SearchInput, { props: { label: 'Search lines', placeholder: 'Route, mode, or destination', ...props } });
const input = (view: ReturnType<typeof field>) => view.getByRole('textbox', { name: 'Search lines' }) as HTMLInputElement;
const type = (element: HTMLInputElement, value: string) => fireEvent.input(element, { target: { value } });

afterEach(() => sessionStorage.clear());

describe('SearchInput', () => {
	it('is named by label, hints with the placeholder and shows the initial value', () => {
		const view = field({ value: 'metro' });
		expect(input(view).placeholder).toBe('Route, mode, or destination');
		expect(input(view).value).toBe('metro');
	});

	it.each([
		['testId', { testId: 'line-search' }, 'line-search', 'line-search'],
		['an explicit name', { testId: 'line-search', name: 'q' }, 'q', 'line-search'],
		['neither', {}, 'listing-search', null],
	])('names the field from %s', (_case, props, name, testId) => {
		const element = input(field(props));
		expect([element.name, element.getAttribute('data-testid')]).toEqual([name, testId]);
	});

	it('updates its value as the reader types', async () => {
		const element = input(field());
		await type(element, 'bus');
		expect(element.value).toBe('bus');
	});

	it('bound to persisted state, keeps what was typed across an unmount and remount', async () => {
		const first = render(Persisted);
		await type(first.getByRole('textbox') as HTMLInputElement, 'railway');
		expect(first.getByTestId('echo').textContent).toBe('railway');
		first.unmount();

		expect((render(Persisted).getByRole('textbox') as HTMLInputElement).value).toBe('railway');
	});
});

	describe('native search contract', () => {
		it('associates a visible label and descriptions, forwards events and native constraints', async () => {
			let focused = false;
			const view = field({ visibleLabel: true, description: 'Search by route name', id: 'routes',
				required: true, disabled: false, maxlength: 40, autocomplete: 'off',
				onfocus: () => { focused = true; }, 'aria-describedby': 'external' });
			const element = input(view);
			expect(view.getByLabelText('Search lines')).toBe(element);
			expect(element.required).toBe(true);
			expect(element.maxLength).toBe(40);
			expect(element.getAttribute('aria-describedby')).toBe('external routes-description');
			expect(view.getByText('Search by route name').id).toBe('routes-description');
			element.focus();
			expect(document.activeElement).toBe(element);
			expect(focused).toBe(true);
		});
	});

it('exposes the input through the bindable ref for programmatic focus', async () => {
	const view = render(Ref);
	await fireEvent.click(view.getByRole('button', { name: 'Focus search' }));
	expect(document.activeElement).toBe(view.getByRole('textbox', { name: 'Routes' }));
});

it('keeps the default field as the single markup root', () => {
	const view = field();
	const root = view.container.firstElementChild;
	expect(view.container.children).toHaveLength(1);
	expect(root?.tagName).toBe('DIV');
	expect(root?.getAttribute('class')).toBe('relative');
	expect(root?.getAttribute('data-slot')).toBe('listing-search-field');
	expect(input(view).parentElement).toBe(root);
});

it.each([
	{ visibleLabel: true },
	{ description: 'Narrow the routes' },
])('wraps the field only for contextual content %j', (props) => {
	const view = field(props);
	const root = view.container.firstElementChild;
	const control = input(view).parentElement;
	expect(control?.getAttribute('data-slot')).toBe('listing-search-field');
	expect(control?.parentElement).toBe(root);
	if (props.visibleLabel) expect(view.getByLabelText('Search lines')).toBe(input(view));
	if (props.description) expect(view.getByText(props.description).parentElement).toBe(root);
});
