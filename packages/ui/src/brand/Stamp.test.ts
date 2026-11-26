import { render, screen } from '@testing-library/svelte';
import { expect, it, vi } from 'vitest';
import Stamp from './Stamp.svelte';

it('shows a neutral pause mark and holds the supplied wording until live resumes', async () => {
	const agoLabel = vi.fn(() => 'Live · updated just now');
	const label = 'Paused · last updated at 2 p.m.';
	const { container, rerender } = render(Stamp, {
		props: { kind: 'live', label, paused: true, updatedAt: new Date(), agoLabel },
	});
	const stamp = container.querySelector('[data-slot="stamp"]')!;
	expect(stamp.getAttribute('data-paused')).toBe('true');
	expect(stamp.getAttribute('data-late')).toBe('false');
	expect(stamp.querySelector('.stamp-pause[aria-hidden="true"]')).not.toBeNull();
	expect(stamp.querySelector('.stamp-mark')).toBeNull();
	expect(screen.getByText(label)).toBeInTheDocument();
	expect(agoLabel).not.toHaveBeenCalled();

	await rerender({ late: true });
	expect(stamp.getAttribute('data-late')).toBe('false');
	expect(stamp.querySelector('.stamp-pause')).not.toBeNull();

	await rerender({ paused: false, late: false });
	expect(stamp.hasAttribute('data-paused')).toBe(false);
	expect(stamp.querySelector('.stamp-mark[aria-hidden="true"]')).not.toBeNull();
	expect(stamp.querySelector('.stamp-pause')).toBeNull();
	expect(screen.getByText('Live · updated just now')).toBeInTheDocument();
});
