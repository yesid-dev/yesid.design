import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { expect, it, vi } from 'vitest';
import { desktop } from '../state/desktop.js';
import SurfaceRail from './SurfaceRail.svelte';

it('exposes the compact dialog only while the sheet is present', async () => {
	const viewport = vi.spyOn(desktop, 'current', 'get').mockReturnValue(false);
	try {
		const view = render(SurfaceRail, {
			rail: createRawSnippet(() => ({ render: () => '<p>Service filters</p>' })),
			label: 'Controls',
			openAria: 'Open controls',
			closeAria: 'Close controls',
		});
		expect(view.getByRole('dialog', { hidden: true })).toBeTruthy();
		expect(view.queryByRole('dialog')).toBeNull();

		await fireEvent.click(view.getByRole('button', { name: /Open controls/ }));
		expect(view.getByRole('dialog', { name: 'Controls' }).textContent).toContain('Service filters');
	} finally {
		viewport.mockRestore();
	}
});
