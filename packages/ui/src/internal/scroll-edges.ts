export type InitialScroll = 'start' | 'end';

export interface ScrollEdgeState {
	readonly scrollable: boolean;
	readonly start: boolean;
	readonly end: boolean;
}

export const EMPTY_SCROLL_EDGES: ScrollEdgeState = {
	scrollable: false,
	start: false,
	end: false,
};

const EDGE_TOLERANCE = 1;

function isRtl(element: HTMLElement): boolean {
	return typeof getComputedStyle === 'function' && getComputedStyle(element).direction === 'rtl';
}

/** Measures whether a horizontal scroll container overflows and whether content is hidden on either edge. */
export function measureScrollEdges(element: HTMLElement): ScrollEdgeState {
	const max = element.scrollWidth - element.clientWidth;
	if (max <= EDGE_TOLERANCE) {
		return EMPTY_SCROLL_EDGES;
	}
	const fromStart = Math.abs(element.scrollLeft);
	const fromEnd = max - fromStart;
	return {
		scrollable: true,
		start: fromStart > EDGE_TOLERANCE,
		end: fromEnd > EDGE_TOLERANCE,
	};
}

/** Scrolls a horizontal scroll container to its inline end (or `offsetFromEnd` before it). */
export function scrollToInlineEnd(element: HTMLElement, offsetFromEnd = 0): boolean {
	const max = element.scrollWidth - element.clientWidth;
	if (max <= EDGE_TOLERANCE) return false;
	const target = Math.max(0, max - offsetFromEnd);
	element.scrollLeft = isRtl(element) ? -target : target;
	return true;
}

/**
 * Observes horizontal scroll overflow, edge availability, and optional `initialScroll="end"`
 * handoff from the pre-hydration `flex-direction: row-reverse` layout to standard `scrollLeft`.
 */
export function attachScrollEdges(
	element: HTMLElement,
	options: {
		readonly initialScroll: InitialScroll;
		readonly onUpdate: (state: ScrollEdgeState) => void;
		readonly onResize?: () => void;
	},
): { readonly onScroll: () => void; readonly destroy: () => void } {
	let pendingEnd = options.initialScroll === 'end';
	let userScrolled = false;

	const applyInitialEnd = (offsetFromEnd = 0): void => {
		if (!pendingEnd || userScrolled) return;
		if (scrollToInlineEnd(element, offsetFromEnd)) {
			pendingEnd = false;
		}
	};

	const sync = (): void => {
		applyInitialEnd();
		options.onResize?.();
		options.onUpdate(measureScrollEdges(element));
	};

	if (options.initialScroll === 'end') {
		// Preserve any pre-hydration scroll offset taken while `row-reverse` was active, then hand off
		// synchronously to standard `scrollLeft` before the browser paints the hydrated frame.
		const offsetFromEnd = element.hasAttribute('data-scroll-hydrated')
			? 0
			: Math.abs(element.scrollLeft);
		element.setAttribute('data-scroll-hydrated', '');
		applyInitialEnd(offsetFromEnd);
	} else {
		element.removeAttribute('data-scroll-hydrated');
	}

	options.onResize?.();
	options.onUpdate(measureScrollEdges(element));

	let observer: ResizeObserver | undefined;
	if (typeof ResizeObserver !== 'undefined') {
		observer = new ResizeObserver(sync);
		observer.observe(element);
		if (element.firstElementChild) observer.observe(element.firstElementChild);
	}

	return {
		onScroll(): void {
			if (!pendingEnd) {
				userScrolled = true;
			}
			options.onUpdate(measureScrollEdges(element));
		},
		destroy(): void {
			observer?.disconnect();
		},
	};
}
