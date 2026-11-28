// @vitest-environment node
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import Fixture from './test-fixtures/ListingBodySsr.svelte';

it('server markup renders regions in order and omits absent regions', () => {
	const { body } = render(Fixture);
	const slots = [
		'listing-body-header',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-sort',
		'listing-body-results',
		'listing-body-more',
	];

	const positions = slots.map((name) => body.indexOf(`data-slot="${name}"`));
	for (const [index, pos] of positions.entries()) {
		expect(pos, slots[index]).toBeGreaterThan(-1);
		if (index > 0) expect(pos, `${slots[index]} after ${slots[index - 1]}`).toBeGreaterThan(positions[index - 1]!);
	}

	const sections = body.split('data-slot="listing-body"');
	expect(sections).toHaveLength(3);
	const minimal = sections[2]!;
	for (const absent of [
		'listing-body-header',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-sort',
		'listing-body-more',
	]) {
		expect(minimal, absent).not.toContain(`data-slot="${absent}"`);
	}
	expect(minimal).toContain('data-slot="listing-body-results"');
});
