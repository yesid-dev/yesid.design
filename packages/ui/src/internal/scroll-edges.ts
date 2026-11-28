import { observeSize } from './observe-size.js';

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
		readonly observeContent?: boolean;
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

	const view = element.ownerDocument.defaultView;
	let pendingFrame: number | undefined;
	const scheduleSync = (): void => {
		if (!view) {
			sync();
			return;
		}
		if (pendingFrame !== undefined) return;
		pendingFrame = view.requestAnimationFrame(() => {
			pendingFrame = undefined;
			sync();
		});
	};

	const start = (): void => {
		if (options.initialScroll === 'end') {
			// Preserve any pre-hydration scroll offset taken while `row-reverse` was active, then hand
			// off to standard `scrollLeft` before the browser paints the hydrated frame.
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
	};

	const content = element.firstElementChild;
	// The first size callback runs after layout and before paint, so the first measurement reads a
	// laid-out frame instead of forcing a layout while the page is still mounting.
	let started = false;
	const onSize = (): void => {
		if (started) return scheduleSync();
		started = true;
		start();
	};
	const stopObserving = [observeSize(element, onSize), ...(content ? [observeSize(content, onSize)] : [])];

	// A reflowed table can gain overflow without changing its own border box or DOM.
	let contentObserver: MutationObserver | undefined;
	if (options.observeContent && content) {
		if (typeof MutationObserver !== 'undefined') {
			contentObserver = new MutationObserver(scheduleSync);
			contentObserver.observe(content, { attributes: true, characterData: true, childList: true, subtree: true });
		}
		content.addEventListener('load', scheduleSync, true);
		content.addEventListener('focusin', scheduleSync);
		content.addEventListener('focusout', scheduleSync);
		view?.addEventListener('resize', scheduleSync);
	}

	return {
		onScroll(): void {
			if (!pendingEnd) {
				userScrolled = true;
			}
			options.onUpdate(measureScrollEdges(element));
		},
		destroy(): void {
			for (const stop of stopObserving) stop();
			contentObserver?.disconnect();
			if (pendingFrame !== undefined) view?.cancelAnimationFrame(pendingFrame);
			if (options.observeContent && content) {
				content.removeEventListener('load', scheduleSync, true);
				content.removeEventListener('focusin', scheduleSync);
				content.removeEventListener('focusout', scheduleSync);
				view?.removeEventListener('resize', scheduleSync);
			}
		},
	};
}
