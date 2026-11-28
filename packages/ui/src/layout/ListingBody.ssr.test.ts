// @vitest-environment node
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import RegionsFixture from './test-fixtures/ListingBodyRegionsSsr.svelte';
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

it('server markup for regions keeps the order, omits absent regions and has no frame class', () => {
	const { body } = render(RegionsFixture);
	const rendered = (markup: string) =>
		[...markup.matchAll(/data-slot="(listing-body-[a-z-]+)"/g)].map((match) => match[1]);
	const [, full, minimal, ...rest] = body.split('data-slot="listing-body"');

	expect(rest).toHaveLength(0);
	expect(rendered(full!)).toEqual([
		'listing-body-header',
		'listing-body-title',
		'listing-body-aside',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-sort',
		'listing-body-results',
		'listing-body-more',
	]);
	expect(rendered(minimal!)).toEqual(['listing-body-results']);
	expect(body.match(/class="listing-body-regions[ "]/g)).toHaveLength(2);
	expect(body).not.toMatch(/class="listing-body[ "]/);
});
