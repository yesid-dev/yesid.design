import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/svelte';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { Card } from './index.js';

const cardPath = resolve('src/primitives/card/card.svelte');
const css = compile(readFileSync(cardPath, 'utf8'), { filename: 'card.svelte', css: 'external' }).css!.code
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

	it('keeps the brand edge, the hover glow and the 14px base by default', () => {
		const element = card();
		expect(element.dataset.edge).toBeUndefined();
		expect(element.dataset.interactive).toBeUndefined();
		expect(element.classList.contains('text-sm')).toBe(true);
		expect(rules.find((rule) => rule.selector === '.card-surface')?.body).toContain('var(--border-brand)');
		const lift = rules.find((rule) => rule.selector.endsWith(":hover") && !rule.selector.includes('neutral'));
		expect(lift?.body).toContain('var(--shadow-section)');
		expect(lift?.body).toContain('var(--border-brand-active)');
	});

	it('draws the neutral edge in --border and never adds the orange glow', () => {
		expect(card({ edge: 'neutral' }).dataset.edge).toBe('neutral');
		expect(rules.find((rule) => rule.selector.includes("[data-edge='neutral']") && !rule.selector.includes(':hover'))?.body)
			.toContain('var(--border)');
		const neutralHover = rules.find((rule) => rule.selector.includes("[data-edge='neutral']:hover"));
		expect(neutralHover?.body).not.toContain('shadow-section');
	});

	it('textSize="inherit" drops the 14px base so fields inside keep the page size', () => {
		const element = card({ textSize: 'inherit', class: 'px-4' });
		expect(element.classList.contains('text-sm')).toBe(false);
		expect(element.classList.contains('px-4')).toBe(true);
	});

	it('keeps the interactive rise and removes it under reduced motion', () => {
		expect(card({ interactive: true }).dataset.interactive).toBe('true');
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\[data-interactive='true'\]:hover[^}]*\{\s*transform: none;/);
	});
});
