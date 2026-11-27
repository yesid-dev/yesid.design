import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import SheetContractFixture from './test-fixtures/SheetContractFixture.svelte';
import type { SheetContentProps, SheetSide } from './index.js';

afterEach(() => cleanup());

describe('Sheet content contract', () => {
	it.each([
		['bottom', 'bottom-0'],
		['right', 'right-0'],
		['center', 'm-auto'],
		[{ base: 'bottom', md: 'center' }, 'bottom-0'],
	] as const)('applies the presentation for %j', (side, className) => {
		render(SheetContractFixture, { props: { showCloseButton: false, side } });
		expect(screen.getByRole('dialog').classList.contains(className)).toBe(true);
	});

	it('types the base and md sides and keeps detents exclusive to the bottom string side', () => {
		type Side = SheetContentProps['side'];
		expectTypeOf<'bottom' | 'right' | 'center'>().toExtend<SheetSide>();
		expectTypeOf<{ base: 'bottom'; md: 'center' }>().toExtend<Side>();
		expectTypeOf<'left'>().not.toExtend<Side>();
		expectTypeOf<{ md: 'center' }>().not.toExtend<Side>();
		expectTypeOf<{ base: 'bottom'; lg: 'center' }>().not.toExtend<Side>();
		expectTypeOf<{ base: 'bottom'; md: 'left' }>().not.toExtend<Side>();
		expectTypeOf<{ base: 'bottom'; md: undefined }>().not.toExtend<Side>();
		type DetentSide = Extract<SheetContentProps, { handleLabel: string }>['side'];
		expectTypeOf<DetentSide>().toEqualTypeOf<'bottom' | undefined>();
	});

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
