// @vitest-environment node
import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import PageSectionsFixture from './test-fixtures/PageSectionsFixture.svelte';

// The suite resolves svelte's browser build, whose context and lifecycle functions throw outside a
// client component; a server render (SvelteKit SSR) resolves the server build, as here.
vi.mock('svelte', async (importOriginal) => {
	const server = '../../node_modules/svelte/src/index-server.js';
	return { ...(await importOriginal<typeof import('svelte')>()), ...(await import(/* @vite-ignore */ server)) };
});

const order = (body: string) =>
	[...body.matchAll(/data-slot="page-section-boundary"|<section[^>]*\bid="(\w+)"/g)].map((match) => match[1] ?? '|');

it('server markup puts the boundary between page sections, never after the last', () => {
	const { body } = render(PageSectionsFixture, { props: { mode: 'wrapped' } });
	expect(order(body)).toEqual(['a', 'plain', '|', 'b', 'nested', '|', 'c']);
	expect(body.match(/data-page-section-edges/g)).toHaveLength(3);
});

it('server markup marks every Masthead tape inside page sections as an edge rule', () => {
	const { body } = render(PageSectionsFixture, { props: { mode: 'masthead' } });
	expect(order(body)).toEqual(['a', '|', 'b', '|', 'c']);
	const sections = body.slice(0, body.indexOf('id="footer"'));
	expect(sections.match(/data-slot="separator"[^>]*data-edge-rule|data-edge-rule[^>]*data-slot="separator"/g)).toHaveLength(3);
});

it.each(['hand-drawn', 'hazard'] as const)('server markup draws the supplied %s divider between sections only', (divider) => {
	const { body } = render(PageSectionsFixture, { props: { mode: 'wrapped', divider } });
	expect(order(body)).toEqual(['a', 'plain', '|', 'b', 'nested', '|', 'c']);
	expect(body.match(/data-slot="page-section-boundary"/g)).toHaveLength(2);
	if (divider === 'hand-drawn') {
		expect(body.match(/data-variant="hand-drawn"/g)).toHaveLength(2);
		expect(body.match(/vector-effect="non-scaling-stroke"/g)).toHaveLength(2);
	} else {
		expect(body.match(/data-variant="hand-drawn"/g)).toBeNull();
		expect(body.match(/repeating-linear-gradient/g)?.length).toBe(2);
	}
	expect(body.slice(body.indexOf('id="c"'))).not.toContain('page-section-boundary');
});

it('alternates the built-in article edge with the later page edges before hydration', () => {
	const { body } = render(PageSectionsFixture, { props: { mode: 'editorial' } });
	const edges = [...body.matchAll(/data-slot="(article-header-boundary|page-section-boundary)"[^>]*data-stroke-segments="([45])"/g)];
	expect(edges.map(match => [match[1], match[2]])).toEqual([
		['article-header-boundary', '4'],
		['page-section-boundary', '5'],
		['page-section-boundary', '4'],
	]);
	expect(body.slice(body.indexOf('id="c"'))).not.toContain('page-section-boundary');
});
