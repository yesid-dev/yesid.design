import { render } from '@testing-library/svelte';
import { expect, it } from 'vitest';
import { Skeleton } from './index.js';

it('marks an explicitly busy skeleton while keeping it decorative', async () => {
	const view = render(Skeleton, { props: { class: 'h-6' } });
	const block = view.container.querySelector('[data-slot="skeleton"]')!;
	const initial = block.outerHTML;
	await view.rerender({ busy: true });
	expect(block.getAttribute('aria-hidden')).toBe('true');
	expect(block.hasAttribute('data-skeleton-busy')).toBe(true);
	expect(block.classList.contains('bg-muted')).toBe(true);
	expect(block.classList.contains('rounded-md')).toBe(true);
	await view.rerender({ busy: false });
	expect(block.outerHTML).toBe(initial);
});
