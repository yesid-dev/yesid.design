import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ComboboxFixture from './test-fixtures/ComboboxFixture.svelte';
import RequiredChoiceFixture from './test-fixtures/RequiredChoiceFixture.svelte';

afterEach(() => cleanup());

const options = [
	{ value: 'alpha', label: 'Alpha', sublabel: 'Eastern region', glyph: 'A', search: 'alpha eastern' },
	{ value: 'beta', label: 'Béta', sublabel: 'Northern region', glyph: 'B', search: 'beta northern' },
	{ value: 'gamma', label: 'Gamma', search: 'gamma western' },
] as const;

describe('Combobox', () => {
	it('exposes the caller label and a generic DOM hook', () => {
		const { container } = render(ComboboxFixture, { props: { options } });

		expect(screen.getByRole('combobox', { name: 'Choose a product' })).toBeInTheDocument();
		expect(
			container.querySelector('[data-slot="combobox"]')?.classList.contains('fixture-combobox'),
		).toBe(true);
	});

	it('names the listbox and links it to the input', async () => {
		render(ComboboxFixture, { props: { options } });
		const input = screen.getByRole('combobox', { name: 'Choose a product' });

		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Choose a product' }));
		const listbox = await screen.findByRole('listbox', { name: 'Choose a product' });

		expect(listbox.id).not.toBe('');
		expect(input.getAttribute('aria-controls')).toBe(listbox.id);
	});

	it('renders a seeded selection and clears the bound nullable value', async () => {
		render(ComboboxFixture, { props: { options, value: 'beta' } });

		expect(
			(screen.getByRole('combobox', { name: 'Choose a product' }) as HTMLInputElement).value,
		).toBe('Béta');
		await fireEvent.click(screen.getByRole('button', { name: 'Clear product' }));

		await waitFor(() => {
			expect(screen.getByTestId('combobox-value').textContent).toBe('none');
			expect(screen.getByTestId('combobox-value-changes').textContent).toBe('1');
			expect(screen.queryByRole('button', { name: 'Clear product' })).toBeNull();
		});
	});

	it('syncs an external selection into the visible input', async () => {
		render(ComboboxFixture, { props: { options } });
		const input = screen.getByRole('combobox', {
			name: 'Choose a product',
		}) as HTMLInputElement;

		await fireEvent.click(screen.getByTestId('combobox-external-value'));
		await waitFor(() => {
			expect(screen.getByTestId('combobox-value').textContent).toBe('gamma');
			expect(input.value).toBe('Gamma');
			expect(screen.getByTestId('combobox-value-changes').textContent).toBe('0');
		});
	});

	it('exposes open state and composes open callbacks once', async () => {
		render(ComboboxFixture, { props: { options } });
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Choose a product' }));

		await waitFor(() => {
			expect(screen.getByTestId('combobox-open').textContent).toBe('open');
			expect(screen.getByTestId('combobox-open-changes').textContent).toBe('1');
		});
	});

	it('disables the native clear affordance with the combobox', () => {
		render(ComboboxFixture, { props: { options, value: 'beta', disabled: true } });
		expect(screen.getByRole('button', { name: 'Clear product' }).hasAttribute('disabled')).toBe(
			true,
		);
	});

	it('filters with folded token-AND matching and renders the caller empty copy', async () => {
		render(ComboboxFixture, { props: { options } });
		const input = screen.getByRole('combobox', { name: 'Choose a product' });

		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Choose a product' }));
		await new Promise((resolve) => setTimeout(resolve, 5));
		await fireEvent.input(input, { target: { value: 'beta north' } });

		expect(await screen.findByRole('option', { name: /Béta/i })).toBeInTheDocument();
		expect(screen.queryByRole('option', { name: /Alpha/i })).not.toBeInTheDocument();

		await fireEvent.input(input, { target: { value: 'missing' } });
		expect(await screen.findByText('No matching products')).toBeInTheDocument();

		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Choose a product' }));
		await waitFor(() => expect(screen.queryByText('No matching products')).toBeNull());
	});

	it('clears when Enter picks the chosen option again', async () => {
		render(ComboboxFixture, { props: { options, value: 'beta' } });
		const input = screen.getByRole('combobox', { name: 'Choose a product' });

		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Choose a product' }));
		await waitFor(() =>
			expect(screen.getByRole('option', { name: /Béta/i }).hasAttribute('data-highlighted')).toBe(true),
		);
		await fireEvent.keyDown(input, { key: 'Enter' });

		await waitFor(() => {
			expect(screen.getByTestId('combobox-value').textContent).toBe('none');
			expect(screen.getByTestId('combobox-value-changes').textContent).toBe('1');
		});
	});

	it('commits the filtered option with Enter', async () => {
		render(ComboboxFixture, { props: { options } });
		const input = screen.getByRole('combobox', { name: 'Choose a product' });

		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Choose a product' }));
		await fireEvent.input(input, { target: { value: 'beta' } });
		await screen.findByRole('option', { name: /Béta/i });
		await fireEvent.keyDown(input, { key: 'Enter' });

		await waitFor(() => {
			expect(screen.getByTestId('combobox-value').textContent).toBe('beta');
			expect((input as HTMLInputElement).value).toBe('Béta');
			expect(input.getAttribute('aria-expanded')).toBe('false');
		});
	});
});

describe('Combobox with clearable={false}', () => {
	function input(): HTMLInputElement {
		return screen.getByRole('combobox', { name: 'Rank by' }) as HTMLInputElement;
	}

	async function openList(): Promise<void> {
		await fireEvent.pointerDown(screen.getByRole('button', { name: 'Rank by' }));
		await screen.findByRole('listbox', { name: 'Rank by' });
	}

	function expectKept(label: string, value: string, changes: string): void {
		expect(screen.getByTestId('combobox-value').textContent).toBe(value);
		expect(screen.getByTestId('combobox-value-changes').textContent).toBe(changes);
		expect(input().value).toBe(label);
		expect(input().getAttribute('aria-expanded')).toBe('false');
	}

	it('renders no clear affordance while a value is chosen', () => {
		const { container } = render(RequiredChoiceFixture, { props: { options, value: 'beta' } });
		const root = container.querySelector<HTMLElement>('[data-slot="combobox"]')!;

		expect(container.querySelector('[data-slot="combobox-clear"]')).toBeNull();
		expect(within(root).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
			'Rank by',
		]);
	});

	it('keeps the value when the emptied field gets Backspace, Delete and Escape', async () => {
		render(RequiredChoiceFixture, { props: { options, value: 'beta' } });
		await openList();

		await fireEvent.input(input(), { target: { value: '' } });
		expect(await screen.findByRole('option', { name: /Alpha/i })).toBeInTheDocument();
		await fireEvent.keyDown(input(), { key: 'Backspace' });
		await fireEvent.keyDown(input(), { key: 'Delete' });
		await fireEvent.keyDown(input(), { key: 'Escape' });

		await waitFor(() => expectKept('Béta', 'beta', '0'));
	});

	it('restores the chosen label when the field is emptied without typing first', async () => {
		render(RequiredChoiceFixture, { props: { options, value: 'beta' } });

		await fireEvent.keyDown(input(), { key: 'Delete' });
		await fireEvent.input(input(), { target: { value: '' } });
		await screen.findByRole('listbox', { name: 'Rank by' });
		await fireEvent.keyDown(input(), { key: 'Escape' });

		await waitFor(() => expectKept('Béta', 'beta', '0'));
	});

	it('keeps the value when Enter picks the chosen option again', async () => {
		render(RequiredChoiceFixture, { props: { options, value: 'beta' } });
		await openList();
		await waitFor(() =>
			expect(screen.getByRole('option', { name: /Béta/i }).hasAttribute('data-highlighted')).toBe(true),
		);

		await fireEvent.keyDown(input(), { key: 'Enter' });

		await waitFor(() => expectKept('Béta', 'beta', '0'));
	});

	it('still filters as you type and commits a new choice', async () => {
		render(RequiredChoiceFixture, { props: { options, value: 'beta' } });
		await openList();

		await fireEvent.input(input(), { target: { value: 'gam' } });
		expect(await screen.findByRole('option', { name: /Gamma/i })).toBeInTheDocument();
		expect(screen.queryByRole('option', { name: /Béta/i })).toBeNull();
		await fireEvent.keyDown(input(), { key: 'Enter' });

		await waitFor(() => expectKept('Gamma', 'gamma', '1'));
	});
});
