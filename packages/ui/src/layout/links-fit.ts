// Takes header links out of the pill's row when the pill would not fit its header: the lowest
// priority tier first (3, then 2), and the whole links row only when priority 1 alone does not fit.
// A link taken out keeps its size (it is only taken out of the row), so the observer watches each
// link and the brand rather than the row or the pill, whose sizes this action changes.

/** The smallest gap kept between the pill and each side of the header. */
const MIN_GAP = 4;
const OVERFLOW = 'data-links-overflow';
const DROPPED = 'data-links-dropped';
const WATCHED = '.nav-wordmark, [data-slot="product-brand"], .nav-links > [data-priority]';

export interface LinksFitParams {
	/** Keep the current state, for example while the open menu collapses the links. */
	paused: boolean;
	/** Changing links measures again and watches any new link. */
	links?: unknown;
}

function takeOut(element: HTMLElement, out: boolean): void {
	element.style.position = out ? 'absolute' : '';
	element.style.visibility = out ? 'hidden' : '';
	element.style.pointerEvents = out ? 'none' : '';
}

export function linksFit(pill: HTMLElement, params: LinksFitParams) {
	let paused = params.paused;
	const root = pill.closest<HTMLElement>('[data-slot="site-header"]') ?? pill.parentElement!;
	const parts = () => [...pill.querySelectorAll<HTMLElement>('.nav-links-part')];
	const items = () => [...pill.querySelectorAll<HTMLElement>('.nav-links > [data-priority]')];

	function fits(): boolean {
		const style = getComputedStyle(root);
		const room = root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 2 * MIN_GAP;
		return pill.getBoundingClientRect().width <= room;
	}

	function measure(): void {
		if (paused) return;
		for (const child of pill.querySelectorAll<HTMLElement>(WATCHED)) observer.observe(child);
		// Start from every link the width tiers show, then drop whole tiers until the pill fits.
		pill.removeAttribute(OVERFLOW);
		for (const part of parts()) takeOut(part, false);
		for (const item of items()) {
			takeOut(item, false);
			item.removeAttribute(DROPPED);
		}
		if (fits()) return;
		// Links the width tiers hide (display: none) have no width and stay as they are.
		let shown = items().filter((item) => item.offsetWidth > 0);
		for (const priority of ['3', '2']) {
			const tier = shown.filter((item) => item.dataset.priority === priority);
			if (!tier.length) continue;
			for (const item of tier) {
				takeOut(item, true);
				item.setAttribute(DROPPED, '');
			}
			shown = shown.filter((item) => !tier.includes(item));
			if (!shown.length || fits()) break;
		}
		if (shown.length && fits()) return;
		pill.setAttribute(OVERFLOW, '');
		for (const part of parts()) takeOut(part, true);
	}

	// The first notification for the header measures once the pill is laid out.
	const observer = new ResizeObserver(measure);
	observer.observe(root);
	void document.fonts?.ready.then(measure);

	return {
		update(next: LinksFitParams) {
			paused = next.paused;
			measure();
		},
		destroy() {
			observer.disconnect();
		},
	};
}
