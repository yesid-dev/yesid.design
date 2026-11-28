/** Preserve block order and the fewest rows, then keep the link groups together when possible. */
export function footerRowMargins(widths: readonly number[], available: number, gap: number): number[] {
	const count = widths.length;
	const margins = Array<number>(count).fill(0);
	if (count >= 6) {
		const linksWidth = widths.slice(1).reduce((total, width) => total + width, (count - 2) * gap);
		const brandWithGap = widths[0]! + gap;
		if (brandWithGap + linksWidth <= available) return margins;
		if (linksWidth <= available) {
			// The links can share a full row after the brand. Force a break only if flex needs one.
			margins[0] = Math.max(0, available - brandWithGap - widths[1]! + 1);
			return margins;
		}
	}

	const scores = Array<number>(count + 1).fill(Infinity);
	const starts = Array<number>(count + 1).fill(0);
	scores[0] = 0;
	// A new row costs more than any change in the sum of squared row lengths.
	const rowCost = count ** 2 + 1;
	for (let end = 1; end <= count; end++) {
		let span = 0;
		for (let start = end - 1; start >= 0; start--) {
			span += widths[start]!;
			if (span > available) break;
			const score = scores[start]! + rowCost + (end - start) ** 2;
			if (score < scores[end]!) {
				scores[end] = score;
				starts[end] = start;
			}
			span += gap;
		}
	}

	for (let end = starts[count]!; end > 0; end = starts[end]!) {
		const start = starts[end]!;
		const withNext = widths.slice(start, end + 1).reduce((width, block) => width + block, (end - start) * gap);
		// Let flex wrap naturally if the next block already falls outside the row.
		if (withNext <= available) margins[end - 1] = available - withNext + 1;
	}
	return margins;
}

export const FOOTER_BALANCE_READY = 'yesid:footer-balance-ready';

/** Measure synchronously on connection, then follow later size changes. */
export function observeFooterBalance(columns: HTMLElement, balanced: boolean): () => void {
	if (typeof matchMedia !== 'function') return () => {};
	const desktop = matchMedia('(min-width: 64rem)');
	const blocks = Array.from(columns.children) as HTMLElement[];
	const balance = () => {
		let margins: number[] = [];
		if (balanced && desktop.matches && blocks.length && columns.clientWidth) {
			const style = getComputedStyle(columns);
			const available = columns.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
			const gap = parseFloat(style.columnGap);
			const basis = parseFloat(getComputedStyle(blocks[0]!).flexBasis);
			if (style.display === 'flex' && available > 0 && Number.isFinite(gap) && Number.isFinite(basis)) {
				const widths = blocks.map((block, index) => Math.min(available,
					index === 0 ? basis : block.getBoundingClientRect().width));
				margins = footerRowMargins(widths, available, gap);
			}
		}
		for (const [index, block] of blocks.entries()) {
			const margin = margins[index] ? `${margins[index]}px` : '';
			if (block.style.marginInlineEnd !== margin) block.style.marginInlineEnd = margin;
		}
	};
	balance();
	if (!balanced || typeof ResizeObserver === 'undefined') return () => {};
	const observer = new ResizeObserver(balance);
	observer.observe(columns);
	for (const block of blocks) observer.observe(block);
	desktop.addEventListener('change', balance);
	return () => {
		observer.disconnect();
		desktop.removeEventListener('change', balance);
	};
}

/** Watch initial server-rendered footers as the parser adds them, before the client takes over. */
export function bootFooterBalance(root: HTMLElement): () => void {
	if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return () => {};
	const observed = new WeakSet<HTMLElement>();
	const discover = () => {
		for (const columns of root.querySelectorAll<HTMLElement>('footer[data-balanced-blocks] > .footer-columns')) {
			if (observed.has(columns) || columns.hasAttribute('data-footer-balance-ready')) continue;
			if (columns.children.length !== Number(columns.parentElement?.dataset.balancedBlocks)) continue;
			observed.add(columns);
			const stop = observeFooterBalance(columns, true);
			columns.addEventListener(FOOTER_BALANCE_READY, stop, { once: true });
		}
	};
	if (document.readyState === 'loading') {
		const parser = new MutationObserver(discover);
		parser.observe(root, { childList: true, subtree: true });
		document.addEventListener('DOMContentLoaded', () => {
			discover();
			parser.disconnect();
		}, { once: true });
	}
	return discover;
}
