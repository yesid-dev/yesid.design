import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import PageSectionsFixture from './test-fixtures/PageSectionsFixture.svelte';

type Mode = 'wrapped' | 'masthead' | 'late' | 'frames' | 'outside';
const view = (mode: Mode) => render(PageSectionsFixture, { props: { mode } });
type View = ReturnType<typeof view>;

const all = (v: View, selector: string) => [...v.container.querySelectorAll<HTMLElement>(selector)];
const boundaries = (v: View) => all(v, '[data-slot="page-section-boundary"]');
const byId = (v: View, id: string) => v.container.querySelector<HTMLElement>(`#${id}`)!;
/** What base.css draws: a kit edge rule inside a registered section is hidden. */
const hidden = (node: Element) => Boolean(node.closest('[data-edge-rule]')?.closest('[data-page-section-edges]'));
const strokes = (v: View) => all(v, '.dimension-line, [data-slot="separator"]').filter((node) => !hidden(node));
const precedes = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
/** The ids of the page sections with a boundary between them, in document order. */
const pairs = (v: View) => {
	const sections = all(v, '[data-slot="page-section"]').filter((s) => s.id !== 'nested');
	return boundaries(v).map((line) => {
		const before = sections.filter((s) => precedes(s, line) && !s.contains(line)).at(-1)?.id;
		const after = sections.find((s) => precedes(line, s))?.id;
		return `${before}|${after}`;
	});
};

describe('PageSections and PageSection (D22)', () => {
	it('ends every page section but the last with one boundary, across wrappers', () => {
		const v = view('wrapped');
		expect(pairs(v)).toEqual(['a|b', 'b|c']);
		for (const line of boundaries(v)) {
			expect(line.classList.contains('dimension-line')).toBe(true);
			expect(line.getAttribute('aria-hidden')).toBe('true');
			expect(line.getAttribute('role')).toBe('none');
			// A row of its own, outside every section's box.
			expect(line.closest('section')).toBeNull();
		}
		// Nothing after the last section: the footer never follows a divider.
		const last = byId(v, 'c');
		expect(boundaries(v).some((line) => precedes(last, line))).toBe(false);
		expect(precedes(last, byId(v, 'footer'))).toBe(true);
	});

	it('ignores plain and nested sections', () => {
		const v = view('wrapped');
		expect(byId(v, 'plain').previousElementSibling?.getAttribute('data-slot')).not.toBe('page-section-boundary');
		expect(byId(v, 'nested').previousElementSibling).toBeNull();
		expect(byId(v, 'nested').hasAttribute('data-page-section-edges')).toBe(false);
		expect(boundaries(v)).toHaveLength(2);
	});

	it('draws one stroke between Masthead sections and none before the footer', () => {
		const v = view('masthead');
		// The two boundaries are the only strokes inside PageSections; every Masthead tape there,
		// hazard or dimension, final section included, is an edge rule the section hides.
		expect(strokes(v).filter((line) => !byId(v, 'outside').contains(line))).toEqual(boundaries(v));
		expect(pairs(v)).toEqual(['a|b', 'b|c']);
		for (const id of ['a', 'b', 'c']) {
			const section = byId(v, id);
			expect(section.hasAttribute('data-page-section-edges')).toBe(true);
			expect(section.querySelectorAll('[data-slot="separator"][data-edge-rule]')).toHaveLength(1);
		}
		// Outside PageSections the Masthead still draws the tape it was asked for.
		const outside = byId(v, 'outside').querySelectorAll<HTMLElement>('.dimension-line');
		expect(outside).toHaveLength(1);
		expect(hidden(outside[0])).toBe(false);
	});

	it('keeps document order when a section mounts later, and moves the boundary', async () => {
		const v = view('late');
		expect(pairs(v)).toEqual(['a|b']);
		await fireEvent.click(v.getByRole('button', { name: 'Toggle lead' }));
		await tick();
		expect(pairs(v)).toEqual(['lead|a', 'a|b']);
		await fireEvent.click(v.getByRole('button', { name: 'Toggle lead' }));
		await tick();
		expect(pairs(v)).toEqual(['a|b']);
	});

	it('hides edge rules that would touch a section boundary, and keeps internal ones', () => {
		const v = view('frames');
		const headless = v.getByTestId('headless-frame').querySelector('.dimension-line')!;
		const headed = v.getByTestId('headed-frame').querySelector('.dimension-line')!;
		const errorTape = byId(v, 'c').querySelector('[data-testid="dimension-rule"]')!;
		expect(hidden(headless)).toBe(true);
		expect(hidden(headed)).toBe(false);
		expect(headed.hasAttribute('data-edge-rule')).toBe(false);
		expect(hidden(errorTape)).toBe(true);
		expect(pairs(v)).toEqual(['a|b', 'b|c']);
	});

	it('is a plain section outside PageSections', () => {
		const v = view('outside');
		expect(boundaries(v)).toHaveLength(0);
		expect(byId(v, 'alone').hasAttribute('data-page-section-edges')).toBe(false);
		expect(byId(v, 'alone').querySelectorAll('.dimension-line')).toHaveLength(1);
	});
});
