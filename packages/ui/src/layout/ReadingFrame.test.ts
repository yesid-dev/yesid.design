import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import ReadingFrame from './ReadingFrame.svelte';

const body = createRawSnippet(() => ({
	render: () => '<section><h2 id="data">Data we keep</h2><p>Only what the form sends.</p></section>',
}));
const props = {
	title: 'Privacy policy',
	sections: [{ id: 'data', title: 'Data we keep' }],
	contentsLabel: 'Contents',
	children: body,
};
const updated = (datetime: string, text: string) => ({ datetime, label: 'Last updated', text });

describe('ReadingFrame update row', () => {
	it('drops and restores the update row without a stale time', async () => {
		const view = render(ReadingFrame, {
			props: { ...props, updated: updated('2026-11-02', 'November 2, 2026') },
		});
		const row = () => view.container.querySelector('[data-slot="reading-frame-updated"]');
		const time = () => view.container.querySelector('[data-slot="reading-frame-updated"] time');
		expect(time()?.getAttribute('datetime')).toBe('2026-11-02');

		await view.rerender({ ...props, updated: undefined });
		expect(row()).toBeNull();
		expect(time()).toBeNull();
		expect(view.container.textContent).not.toContain('November 2, 2026');
		expect(view.container.textContent).toContain('Only what the form sends.');

		await view.rerender({ ...props, updated: updated('2027-01-15T10:00:00Z', 'January 15, 2027') });
		expect(time()?.getAttribute('datetime')).toBe('2027-01-15T10:00:00Z');
		expect(time()?.textContent).toBe('January 15, 2027');
		expect(view.container.textContent).not.toContain('November 2, 2026');
	});

	it('validates a date supplied after the update row was omitted', async () => {
		const view = render(ReadingFrame, { props: { ...props, updated: undefined } });
		await expect(view.rerender({ ...props, updated: updated('2027-02-30', 'February 30, 2027') })).rejects.toThrow(
			/updated\.datetime/,
		);
	});
});
