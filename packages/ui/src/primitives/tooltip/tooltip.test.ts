import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import TooltipFixture from './test-fixtures/TooltipFixture.svelte';

afterEach(() => cleanup());

it.each(['number', 'textarea'] as const)('preserves navigation keys on a %s trigger', async (field) => {
	render(TooltipFixture, { props: { field } });
	const trigger = screen.getByRole(field === 'number' ? 'spinbutton' : 'textbox');
	trigger.focus();
	const tooltip = await screen.findByRole('tooltip');
	const scrollTo = vi.fn();
	Object.defineProperties(tooltip, {
		clientHeight: { value: 100 },
		scrollHeight: { value: 300 },
		scrollTo: { value: scrollTo },
	});
	const press = (key: string) => fireEvent.keyDown(trigger, { key });
	for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
		expect(await press(key)).toBe(true);
	}
	for (const key of ['PageUp', 'PageDown']) {
		expect(await press(key)).toBe(field === 'textarea');
	}
	expect(scrollTo).toHaveBeenCalledTimes(field === 'textarea' ? 0 : 2);
});

it('describes the focused trigger and dismisses on Escape without moving focus', async () => {
	render(TooltipFixture);
	const trigger = screen.getByRole('button', { name: 'Export results' });
	expect(trigger.hasAttribute('aria-describedby')).toBe(false);
	trigger.focus();
	const tooltip = await screen.findByRole('tooltip');
	expect(tooltip.textContent?.trim()).toBe('Downloads a CSV file.');
	await waitFor(() => expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id));
	expect(screen.getByRole('button', { name: 'Export results', description: 'Downloads a CSV file.' })).toBe(trigger);
	await fireEvent.keyDown(trigger, { key: 'Escape' });
	await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
	expect(document.activeElement).toBe(trigger);
	expect(trigger.hasAttribute('aria-describedby')).toBe(false);
});

it('keeps existing descriptions when the hint opens and is dismissed', async () => {
	render(TooltipFixture, { describedBy: 'export-help export-format' });
	const description = 'Includes filtered results only. Dates use UTC.';
	const trigger = screen.getByRole('button', { name: 'Export results', description });
	trigger.focus();
	const tooltip = await screen.findByRole('tooltip');
	await waitFor(() => {
		expect(trigger.getAttribute('aria-describedby')).toBe(`export-help export-format ${tooltip.id}`);
		expect(screen.getByRole('button', { name: 'Export results', description: `${description} Downloads a CSV file.` })).toBe(trigger);
	});
	await fireEvent.keyDown(trigger, { key: 'Escape' });
	await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
	expect(document.activeElement).toBe(trigger);
	expect(screen.getByRole('button', { name: 'Export results', description })).toBe(trigger);
});
