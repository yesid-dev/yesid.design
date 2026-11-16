import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SeparatorContractFixture from './test-fixtures/SeparatorContractFixture.svelte';
import SeparatorDimensionFixture from './test-fixtures/SeparatorDimensionFixture.svelte';
import SeparatorHandDrawnFixture from './test-fixtures/SeparatorHandDrawnFixture.svelte';

afterEach(() => cleanup());

describe('Separator variant contracts', () => {
	it('keeps native custom variants honest and ref-capable', async () => {
		render(SeparatorContractFixture);
		const hazard = screen.getByTestId('hazard');
		const gradient = screen.getByTestId('gradient');

		expect(hazard.getAttribute('data-slot')).toBe('custom-hazard');
		expect(hazard.hasAttribute('orientation')).toBe(false);
		expect(hazard.hasAttribute('decorative')).toBe(false);
		expect(hazard.getAttribute('style')).toContain('max-width: 100%');
		expect(gradient.getAttribute('data-slot')).toBe('custom-gradient');
		expect(screen.getByTestId('delegated-default').tagName).toBe('HR');
		await waitFor(() => expect(screen.getByTestId('hazard-ref').textContent).toBe('DIV'));
	});
});


describe('Separator hand-drawn variant (D22, 16 November 2026)', () => {
	it('draws one static pen stroke in currentColor, decorative, horizontal and ref-capable', async () => {
		render(SeparatorHandDrawnFixture);
		const line = screen.getByTestId('hand-drawn');

		expect(line.tagName).toBe('DIV');
		expect(line.classList.contains('hand-drawn-line')).toBe(true);
		expect(line.classList.contains('custom-stroke')).toBe(true);
		expect(line.getAttribute('data-variant')).toBe('hand-drawn');
		expect(line.getAttribute('data-slot')).toBe('separator');
		expect(line.getAttribute('aria-hidden')).toBe('true');
		expect(line.getAttribute('role')).toBe('none');
		expect(line.hasAttribute('orientation')).toBe(false);
		expect(line.hasAttribute('data-orientation')).toBe(false);
		expect(line.getAttribute('style')).toBeNull();
		expect(screen.getByTestId('hand-drawn-attrs').getAttribute('data-extra')).toBe('kept');

		const paths = line.querySelectorAll('svg path');
		expect(paths).toHaveLength(1);
		const svg = line.querySelector('svg')!;
		expect(svg.getAttribute('viewBox')).toBe('0 0 1000 8');
		expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
		const path = paths[0]!;
		expect(path.getAttribute('fill')).toBe('none');
		expect(path.getAttribute('stroke')).toBe('currentColor');
		expect(path.getAttribute('stroke-width')).toBe('1.25');
		expect(path.getAttribute('stroke-linecap')).toBe('round');
		expect(path.getAttribute('vector-effect')).toBe('non-scaling-stroke');
		expect(path.hasAttribute('stroke-dasharray')).toBe(false);
		// Decoration only: no stamps, ticks, filters, glow or animation.
		expect(line.querySelectorAll('animate, animateTransform, filter, line, circle, rect')).toHaveLength(0);

		expect(screen.getByTestId('hand-drawn-slot').getAttribute('data-slot')).toBe('custom-hand-drawn');
		await waitFor(() => expect(screen.getByTestId('hand-drawn-ref').textContent).toBe('DIV'));
	});
});

describe('Separator dimension variant (D22)', () => {
	it('draws the shared dimension line: decorative, static, horizontal and ref-capable', async () => {
		render(SeparatorDimensionFixture);
		const line = screen.getByTestId('dimension');

		expect(line.tagName).toBe('DIV');
		expect(line.classList.contains('dimension-line')).toBe(true);
		expect(line.classList.contains('custom-rule')).toBe(true);
		expect(line.getAttribute('data-variant')).toBe('dimension');
		expect(line.getAttribute('data-slot')).toBe('separator');
		expect(line.getAttribute('aria-hidden')).toBe('true');
		expect(line.getAttribute('role')).toBe('none');
		expect(line.hasAttribute('orientation')).toBe(false);
		expect(line.hasAttribute('data-orientation')).toBe(false);
		expect(line.getAttribute('style')).toBeNull();
		expect(line.childElementCount).toBe(0);
		expect(screen.getByTestId('dimension-slot').getAttribute('data-slot')).toBe('custom-dimension');
		await waitFor(() => expect(screen.getByTestId('dimension-ref').textContent).toBe('DIV'));
	});
});
