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
	expect(stamp.querySelector('.stamp-age-size')).toBeNull();
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

it('keeps localized sizing labels out of the rendered text', () => {
	const label = 'Live service';
	const agoLabel = (seconds: number) => `Updated ${seconds} s ago`;
	const { container } = render(Stamp, {
		props: { kind: 'live', label, updatedAt: new Date(Date.now() + 60_000), agoLabel },
	});
	const stamp = container.querySelector('[data-slot="stamp"]')!;
	const sizingCopies = [...stamp.querySelectorAll('.stamp-age-size')];
	expect(sizingCopies.map((copy) => copy.getAttribute('data-label'))).toContain(agoLabel(59));
	expect(sizingCopies.map((copy) => copy.getAttribute('data-label'))).toContain(label);
	for (const copy of sizingCopies) {
		expect(copy.getAttribute('aria-hidden')).toBe('true');
		expect(copy.hasAttribute('inert')).toBe(true);
	}
	expect(stamp.textContent?.trim()).toBe(agoLabel(0));
	expect(stamp.hasAttribute('aria-live')).toBe(false);
});
