import { expect, it } from 'vitest';
import { footerRowMargins } from './footer-balance.js';

it('leaves one fitting row at its natural width', () => {
	expect(footerRowMargins([100, 100, 100, 100], 430, 10)).toEqual([0, 0, 0, 0]);
});

it('prefers two plus two, three plus two, and three plus three', () => {
	expect(footerRowMargins([100, 100, 100, 100], 340, 10)).toEqual([0, 21, 0, 0]);
	expect(footerRowMargins([80, 80, 80, 80, 80], 360, 10)).toEqual([0, 0, 11, 0, 0]);
	expect(footerRowMargins([100, 100, 100, 100, 100, 100], 450, 10)).toEqual([0, 0, 21, 0, 0, 0]);
});

it('leaves an oversized block on its own row and still balances the remaining blocks', () => {
	expect(footerRowMargins([340, 100, 100, 100, 100], 340, 10)).toEqual([0, 0, 21, 0, 0]);
});
