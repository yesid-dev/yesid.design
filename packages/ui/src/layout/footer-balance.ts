/** Preserve block order and the fewest rows, then minimize the difference in row counts. */
export function footerRowMargins(widths: readonly number[], available: number, gap: number): number[] {
	const count = widths.length;
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

	const margins = Array<number>(count).fill(0);
	for (let end = starts[count]!; end > 0; end = starts[end]!) {
		const start = starts[end]!;
		const withNext = widths.slice(start, end + 1).reduce((width, block) => width + block, (end - start) * gap);
		// Let flex wrap naturally if the next block already falls outside the row.
		if (withNext <= available) margins[end - 1] = available - withNext + 1;
	}
	return margins;
}
