/** Shared pixel scales and bounds for the SVG parts rendered by ChartFrame. */
export interface ChartPlot {
	readonly x: (value: number) => number;
	readonly y: (value: number) => number;
	readonly left: number;
	readonly right: number;
	readonly top: number;
	readonly bottom: number;
	readonly unit: number;
	readonly clipId: string;
}

export interface ChartPoint {
	readonly x: number;
	/** Missing observations interrupt a line and omit a bar. */
	readonly y: number | null;
}

export function scale(domain: readonly [number, number], start: number, end: number) {
	const span = domain[1] - domain[0];
	return Number.isFinite(domain[0]) && Number.isFinite(span) && span !== 0
		? (value: number) => start + ((value - domain[0]) / span) * (end - start)
		: () => (start + end) / 2;
}
