import { expect, it } from 'vitest';
import { placeMapLabels } from './placement.js';

const rect = (x: number, y: number, width = 20, height = 10) => ({ x, y, width, height });

it('uses the first whole label that clears the panels, marks, stage bounds and earlier labels', () => {
	const shared = rect(40, 40);
	const next = rect(70, 40);
	const labels = [
		{ id: 'first', candidates: [rect(2, 5), rect(15, 10), rect(70, 10), shared] },
		{ id: 'second', candidates: [shared, next] },
		{ id: 'no room', candidates: [rect(85, 40), next] },
	];
	expect(placeMapLabels({
		bounds: rect(0, 0, 100, 60),
		obstacles: [rect(10, 10, 25, 20), rect(75, 12, 3, 3)],
		labels,
	})).toEqual([
		{ id: 'first', bounds: shared },
		{ id: 'second', bounds: next },
	]);
});
