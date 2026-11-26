import { expect, type Locator } from '@playwright/test';

interface Box { left: number; right: number; top: number; bottom: number; width: number }

export interface RowGeometry {
	/** The row's content box, inside its inline padding. */
	readonly content: Box;
	readonly primary: Box;
	/** The union of the primary's text, which can extend past the primary box. */
	readonly text: Box;
	readonly value: Box;
	readonly figure: Box;
	readonly label: Box;
	readonly firstDetailTop: number | null;
	/** Words in the primary on more than one line. Lines may break between hyphenated parts. */
	readonly splitWords: readonly string[];
	readonly plates: readonly { text: string; lines: number }[];
}

/** Geometry of each body row in a `rows` DataTable, and the table's container width in rem. */
export function rowsGeometry(table: Locator): Promise<{ frameRem: number; rows: RowGeometry[] }> {
	return table.evaluate((element) => {
		const box = ({ left, right, top, bottom, width }: DOMRect) => ({ left, right, top, bottom, width });
		const lines = (range: Range) => [...range.getClientRects()].filter((rect) => rect.width > 0);
		const frame = element.closest('[data-responsive="rows"]')!;
		const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
		const rows = [...element.querySelectorAll(':scope > tbody > tr')].map((row) => {
			const primary = row.querySelector('[data-row-position="primary"]')!;
			const value = row.querySelector('[data-row-position="value"]')!;
			const style = getComputedStyle(row);
			const outer = row.getBoundingClientRect();
			const left = outer.left + Number.parseFloat(style.paddingInlineStart);
			const right = outer.right - Number.parseFloat(style.paddingInlineEnd);
			const splitWords: string[] = [];
			const text = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity, width: 0 };
			const walker = document.createTreeWalker(primary, NodeFilter.SHOW_TEXT);
			for (let node = walker.nextNode(); node; node = walker.nextNode()) {
				for (const word of node.textContent!.matchAll(/[^\s-]+/g)) {
					const range = document.createRange();
					range.setStart(node, word.index);
					range.setEnd(node, word.index + word[0].length);
					const rects = lines(range);
					if (rects.length > 1) splitWords.push(word[0]);
					for (const rect of rects) {
						text.left = Math.min(text.left, rect.left);
						text.right = Math.max(text.right, rect.right);
						text.top = Math.min(text.top, rect.top);
						text.bottom = Math.max(text.bottom, rect.bottom);
					}
				}
			}
			text.width = text.right - text.left;
			const plates = [...primary.querySelectorAll('[data-slot="route-plate"]')].map((plate) => {
				const range = document.createRange();
				range.selectNodeContents(plate);
				return { text: plate.textContent!.trim(), lines: lines(range).length };
			});
			const detail = row.querySelector(':scope > :is(th, td):not([data-row-position])');
			return {
				content: { left, right, top: outer.top, bottom: outer.bottom, width: right - left },
				primary: box(primary.getBoundingClientRect()),
				text,
				value: box(value.getBoundingClientRect()),
				figure: box(value.querySelector('.data-table-cell-content')!.getBoundingClientRect()),
				label: box(value.querySelector('.data-table-stack-label')!.getBoundingClientRect()),
				firstDetailTop: detail ? detail.getBoundingClientRect().top : null,
				splitWords,
				plates,
			};
		});
		return { frameRem: frame.clientWidth / rem, rows };
	});
}

const apart = (a: Box, b: Box) => a.right <= b.left + 0.5 || b.right <= a.left + 0.5
	|| a.bottom <= b.top + 0.5 || b.bottom <= a.top + 0.5;

/** The wider compact layout: the value sits at the end of the primary's first line, figure over label. */
export function expectBeside(row: RowGeometry, gap: number, context: string): void {
	expect(row.value.left - row.primary.right, `${context}: column gap`).toBeCloseTo(gap, 0);
	expect(row.value.right, `${context}: value at the row end`).toBeCloseTo(row.content.right, 0);
	expect(row.value.top, `${context}: value on the primary's line`).toBeLessThan(row.primary.bottom);
	expect(row.figure.right, `${context}: figure and label end-aligned`).toBeCloseTo(row.label.right, 0);
	expect(row.label.top, `${context}: label under its figure`).toBeGreaterThanOrEqual(row.figure.bottom - 0.5);
	expect(apart(row.text, row.value), `${context}: primary text clear of the value`).toBe(true);
}

/** The narrowest layout: the primary takes the row, then the value, then the details. */
export function expectStacked(row: RowGeometry, context: string): void {
	expect(apart(row.primary, row.value), `${context}: primary and value boxes apart`).toBe(true);
	expect(apart(row.text, row.value), `${context}: primary text clear of the value`).toBe(true);
	expect(row.splitWords, `${context}: words in the primary`).toEqual([]);
	for (const plate of row.plates) expect(plate.lines, `${context}: plate ${plate.text}`).toBe(1);
	expect(row.primary.width, `${context}: primary takes the row`).toBeCloseTo(row.content.width, 0);
	expect(row.value.top, `${context}: value under the primary`).toBeGreaterThanOrEqual(row.primary.bottom - 0.5);
	expect(row.value.left, `${context}: value at the row start`).toBeCloseTo(row.content.left, 0);
	expect(row.value.right, `${context}: value inside the row`).toBeLessThanOrEqual(row.content.right + 0.5);
	expect(row.value.bottom, `${context}: value inside the row`).toBeLessThanOrEqual(row.content.bottom + 0.5);
	if (row.firstDetailTop !== null) {
		expect(row.firstDetailTop, `${context}: details after the value`).toBeGreaterThanOrEqual(row.value.bottom - 0.5);
	}
}
