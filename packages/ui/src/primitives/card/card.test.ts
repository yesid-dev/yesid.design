import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/svelte';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { Card } from './index.js';

const cardPath = resolve('src/primitives/card/card.svelte');
const compiled = compile(readFileSync(cardPath, 'utf8'), { filename: 'card.svelte', css: 'external' }).css!.code;
const css = compiled
	.replace(/\/\*[\s\S]*?\*\//g, '')
	.replace(/:where\(\.svelte-[\w-]+\)|\.svelte-[\w-]+/g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));

const card = (props: Record<string, unknown> = {}) =>
	render(Card, { props }).container.querySelector<HTMLElement>('[data-slot="card"]')!;

describe('Card', () => {
	it('reacts to hover only when interactive: a static card never suggests an action', () => {
		const hover = rules.filter((rule) => rule.selector.includes(':hover'));
		expect(hover.length).toBeGreaterThan(0);
		for (const rule of hover) expect(rule.selector, rule.selector).toContain("[data-interactive='true']");
	});

	it('keeps the brand edge, the hover border and the 14px base by default', () => {
		const element = card();
		expect(element.dataset.edge).toBeUndefined();
		expect(element.dataset.interactive).toBeUndefined();
		expect(element.classList.contains('text-sm')).toBe(true);
		expect(rules.find((rule) => rule.selector === '.card-surface')?.body).toContain('var(--border-brand)');
		const lift = rules.find((rule) => rule.selector.includes(':hover') && rule.body.includes('border-color'));
		expect(lift?.body).toContain('var(--border-brand-active)');
		expect(lift?.body).toContain('translateY(-1px)');
	});

	it('draws the neutral edge in --border', () => {
		expect(card({ edge: 'neutral' }).dataset.edge).toBe('neutral');
		expect(rules.find((rule) => rule.selector.includes("[data-edge='neutral']") && !rule.selector.includes(':hover'))?.body)
			.toContain('var(--border)');
	});

	it('hovers identically in light and dark: lift and edge, no shadow (owner rulings, 15 November 2026)', () => {
		for (const rule of rules.filter((candidate) => candidate.selector.includes(':hover'))) {
			expect(rule.body, rule.selector).not.toMatch(/box-shadow|text-shadow|drop-shadow/);
			expect(rule.selector, rule.selector).not.toMatch(/data-theme|theme-light|theme-dark/);
		}
	});

	it('textSize="inherit" drops the 14px base so fields inside keep the page size', () => {
		const element = card({ textSize: 'inherit', class: 'px-4' });
		expect(element.classList.contains('text-sm')).toBe(false);
		expect(element.classList.contains('px-4')).toBe(true);
	});

	it('keeps the interactive rise and removes it under reduced motion', () => {
		expect(card({ interactive: true }).dataset.interactive).toBe('true');
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\[data-interactive='true'\]:is\(:hover[^}]*\{\s*transform: none;/);
	});

	it('gives keyboard focus the same lift and edge as hover (D21)', () => {
		const lift = rules.find((rule) => rule.body.includes('translateY(-1px)'));
		expect(lift?.selector).toContain(':focus-visible');
		expect(lift?.selector).toContain(':has(:focus-visible)');
		expect(lift?.selector).toMatch(/:focus-visible\s*>\s*\.card-surface\[data-interactive='true'\]/);
		expect(lift?.body).toContain('var(--border-brand-active)');
	});

	it('matches a focused descendant from any component, not only kit-owned markup', () => {
		// A consumer link passed as children has no component hash; Svelte's scoped `:has(...)` would
		// require one and the card would never lift on that link's keyboard focus.
		expect(compiled).not.toMatch(/:has\(:where\(\.svelte-[\w-]+\):focus-visible\)/);
		expect(compiled).toMatch(/:has\(:focus-visible\)/);
	});
});
