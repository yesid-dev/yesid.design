import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SheetContractFixture from './test-fixtures/SheetContractFixture.svelte';

afterEach(() => cleanup());

describe('Sheet content contract', () => {
	it('renders the body with the shared inset and forwards content and attributes', () => {
		render(SheetContractFixture, { props: { showCloseButton: false } });
		const body = screen.getByText('Fixture body');
		expect(body.classList.contains('px-4')).toBe(true);
		expect(body.classList.contains('py-2')).toBe(true);
		expect(body.id).toBe('fixture-body');
		expect(body.getAttribute('lang')).toBe('en');
	});

	it('omits the close button when the caller hides it without supplying copy', () => {
		render(SheetContractFixture, { props: { showCloseButton: false } });
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('accepts caller-owned localized close copy', () => {
		render(SheetContractFixture, { props: { closeLabel: 'Fermer le panneau' } });
		expect(screen.getByText('Fermer le panneau')).toBeInTheDocument();
		expect(screen.queryByText('Close')).toBeNull();
	});

	it('tears down an open dismissible layer without stale reactive work', async () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			render(SheetContractFixture, { props: { closeLabel: 'Fermer' } });
			cleanup();
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(warning).not.toHaveBeenCalled();
		} finally {
			warning.mockRestore();
		}
	});
});
