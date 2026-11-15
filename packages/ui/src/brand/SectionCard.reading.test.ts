import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import CollapsibleSection, { type CollapsibleSectionProps } from './CollapsibleSection.svelte';

const css = compile(readFileSync(resolve('src/brand/SectionCard.svelte'), 'utf8'), {
	filename: 'SectionCard.svelte',
	css: 'external',
}).css!.code
	.replace(/\/\*[\s\S]*?\*\//g, '')
	.replace(/:where\(\.svelte-[\w-]+\)|\.svelte-[\w-]+/g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));

const children = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));
const card = (props: Partial<CollapsibleSectionProps> = {}) =>
	render(CollapsibleSection, { props: { title: 'Section', children, ...props } }).container.querySelector<HTMLElement>(
		'[data-slot="card"]',
	)!;

describe('SectionCard reading surfaces', () => {
	it('emphasises a hovered section title in orange, never in yellow (owner answer B1 2A)', () => {
		const titleHover = rules.filter((rule) => /\.section-header[^,]*:hover[^,]*\.section-title/.test(rule.selector));
		expect(titleHover.length).toBeGreaterThan(0);
		for (const rule of titleHover) {
			expect(rule.body).toContain('var(--primary)');
			expect(rule.body).not.toContain('accent-text');
		}
		expect(css).not.toContain('accent-text');
	});

	it('keeps the brand edge, 3px weight and the 14px base by default', () => {
		const element = card();
		expect(element.dataset.edge).toBeUndefined();
		expect(element.dataset.edgeWeight).toBeUndefined();
		expect(element.classList.contains('text-sm')).toBe(true);
		expect(rules.find((rule) => rule.selector === "[data-slot='card'].section-card" && rule.body.includes('border-width'))?.body)
			.toContain('border-width: 3px');
	});

	it('passes the neutral edge, a lighter weight and the inherited text size to the card', () => {
		const element = card({ edge: 'neutral', edgeWeight: 'thin', textSize: 'inherit' });
		expect(element.dataset.edge).toBe('neutral');
		expect(element.dataset.edgeWeight).toBe('thin');
		expect(element.classList.contains('text-sm')).toBe(false);
		expect(card({ edgeWeight: 'regular' }).dataset.edgeWeight).toBe('regular');
		expect(rules.find((rule) => rule.selector.endsWith("[data-edge-weight='regular']"))?.body).toContain('border-width: 2px');
		expect(rules.find((rule) => rule.selector.endsWith("[data-edge-weight='thin']"))?.body).toContain('border-width: 1px');
	});

	it('firms a neutral edge from its heading without the orange glow', () => {
		const neutralHeading = rules.find((rule) => rule.selector.includes("[data-edge='neutral']") && rule.selector.includes(':hover'));
		expect(neutralHeading?.body).not.toContain('shadow-section');
		const brandHeading = rules.find((rule) => !rule.selector.includes('neutral') && rule.selector.includes('.section-header:hover') && rule.body.includes('border-color'));
		expect(brandHeading?.body).toContain('var(--shadow-section)');
	});
});
