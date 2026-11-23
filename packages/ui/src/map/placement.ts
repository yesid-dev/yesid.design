export interface MapRect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export interface MapViewport {
	readonly width: number;
	readonly height: number;
	/** Measured panel bounds in CSS pixels relative to the map surface. */
	readonly exclusions: readonly MapRect[];
}

export interface MapLabel {
	readonly id: string;
	/** Bounds of the whole label at each proposed placement, in preference order. */
	readonly candidates: readonly MapRect[];
}

export interface MapLabelPlacement {
	readonly id: string;
	readonly bounds: MapRect;
}

export interface MapLabelLayout {
	readonly bounds: MapRect;
	readonly labels: readonly MapLabel[];
	/** Panel, mark, and any other bounds the labels must avoid. */
	readonly obstacles: readonly MapRect[];
	readonly gap?: number;
}

function inside(rect: MapRect, bounds: MapRect, gap: number): boolean {
	return rect.width > 0 && rect.height > 0
		&& rect.x >= bounds.x + gap && rect.x + rect.width <= bounds.x + bounds.width - gap
		&& rect.y >= bounds.y + gap && rect.y + rect.height <= bounds.y + bounds.height - gap;
}

function overlaps(a: MapRect, b: MapRect, gap: number): boolean {
	return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
		&& a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

/** Keep the first clear candidate for each label, processing labels in priority order. */
export function placeMapLabels({ bounds, labels, obstacles, gap = 4 }: MapLabelLayout): MapLabelPlacement[] {
	const padding = Number.isFinite(gap) ? Math.max(0, gap) : 4;
	const occupied = [...obstacles];
	const placed: MapLabelPlacement[] = [];

	for (const label of labels) {
		const candidate = label.candidates.find(
			(rect) => inside(rect, bounds, padding) && !occupied.some((other) => overlaps(rect, other, padding)),
		);
		if (candidate) {
			occupied.push(candidate);
			placed.push({ id: label.id, bounds: candidate });
		}
	}

	return placed;
}
