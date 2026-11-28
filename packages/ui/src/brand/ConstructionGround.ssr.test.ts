// @vitest-environment node
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import Fixture from './test-fixtures/ConstructionGroundSsr.svelte';

it('server markup renders full height, visible static props and fixtures on the stage', () => {
	const { body } = render(Fixture);

	expect(body).toContain('data-slot="construction-ground"');
	expect(body).toContain('data-slot="construction-ground-floor"');
	expect(body).toContain('--ground-progress: 1');
	expect(body).toContain('data-slot="construction-ground-stage"');
	expect(body).toContain('data-slot="construction-props"');
	expect(body).toContain('data-state="static"');
	expect(body).toContain('data-progress="1"');
	expect(body).toContain('data-slot="construction-ground-fixtures"');
	// Without JavaScript the reveal is finished, so the clip above the ground is fully open.
	expect(body).toContain('data-fixtures="true"');
	expect(body).toContain('data-testid="ssr-fixture"');
	expect(body).toContain('data-lit="true"');
});
