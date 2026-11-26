import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, it, vi } from 'vitest';
import { Switch } from './index.js';

const label = 'Pause live updates';
const stateLabels = { on: 'Paused', off: 'Live' };

it('toggles the checked state and visible word while keeping its name', async () => {
	const onCheckedChange = vi.fn();
	render(Switch, { props: { label, stateLabels, onCheckedChange } });
	const control = screen.getByRole('switch', { name: label });
	expect(control.getAttribute('aria-checked')).toBe('false');
	expect(control.textContent).toContain('Live');

	await fireEvent.click(control);
	expect(screen.getByRole('switch', { name: label })).toBe(control);
	expect(control.getAttribute('aria-checked')).toBe('true');
	expect(control.textContent).toContain('Paused');
	await fireEvent.click(control);
	expect(control.getAttribute('aria-checked')).toBe('false');
	expect(onCheckedChange.mock.calls).toEqual([[true], [false]]);
});

it.each([' ', 'Enter'])('uses the native button click for %j activation', async (key) => {
	const onCheckedChange = vi.fn();
	render(Switch, { props: { label, stateLabels, onCheckedChange } });
	const control = screen.getByRole<HTMLButtonElement>('switch', { name: label });
	expect(control.tagName).toBe('BUTTON');
	expect(control.type).toBe('button');
	await fireEvent.keyDown(control, { key });
	if (key === 'Enter') await fireEvent.click(control);
	await fireEvent.keyUp(control, { key });
	if (key === ' ') await fireEvent.click(control);
	// Happy DOM omits the browser's synthesized click, supplied here at its native timing.
	expect(onCheckedChange.mock.calls).toEqual([[true]]);
	expect(control.getAttribute('aria-checked')).toBe('true');
});

it('keeps a disabled switch in its supplied state', async () => {
	const onCheckedChange = vi.fn();
	render(Switch, { props: { label, stateLabels, onCheckedChange, checked: true, disabled: true } });
	const control = screen.getByRole<HTMLButtonElement>('switch', { name: label });
	expect(control.disabled).toBe(true);
	await fireEvent.click(control);
	expect(control.getAttribute('aria-checked')).toBe('true');
	expect(onCheckedChange).not.toHaveBeenCalled();
});
