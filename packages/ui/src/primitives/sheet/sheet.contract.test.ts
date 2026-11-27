import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import SheetContractFixture from './test-fixtures/SheetContractFixture.svelte';
import type { SheetContentProps, SheetSide } from './index.js';
import { sheetVariants } from './sheet-content.svelte';

afterEach(() => cleanup());

it('preserves the published rc.2 Sheet variant strings', () => {
	const base = 'bg-popover text-popover-foreground shadow-sheet fixed flex flex-col gap-4 transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out motion-reduce:transition-none';
	const right = `${base} data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border`;
	const bottom = `${base} data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 max-h-[90svh] w-full rounded-t-xl border-t border-border`;

	expect(sheetVariants.base).toBe(base);
	expect(sheetVariants()).toBe(bottom);
	expect(sheetVariants({ side: 'right' })).toBe(right);
	expect(sheetVariants({ side: 'bottom' })).toBe(bottom);
});

it('replaces the edge sheet surface and long motion in the center variant', () => {
	const center = sheetVariants({ side: 'center' });
	for (const token of ['bg-popover', 'shadow-sheet', 'duration-300', 'duration-500']) {
		expect(center).not.toContain(token);
	}
});

describe('Sheet content contract', () => {
	it.each([
		['bottom', 'bottom-0'],
		['right', 'right-0'],
		['center', 'sheet-center'],
	] as const)('applies the presentation for %j', (side, className) => {
		render(SheetContractFixture, { props: { showCloseButton: false, side } });
		expect(screen.getByRole('dialog').classList.contains(className)).toBe(true);
	});

	it('renders both responsive presentations on the same dialog', () => {
		render(SheetContractFixture, {
			props: { showCloseButton: false, side: { base: 'right', md: 'center' } },
		});
		const dialog = screen.getByRole('dialog');
		expect(dialog.getAttribute('data-sheet-base')).toBe('right');
		expect(dialog.getAttribute('data-sheet-md')).toBe('center');
		expect(dialog.classList.contains('bottom-0')).toBe(false);
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
