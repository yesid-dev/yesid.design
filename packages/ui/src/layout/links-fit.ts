// Takes header links out of the pill's row when the pill would not fit its header: the lowest
// priority tier first (3, then 2), and the whole links row only when priority 1 alone does not fit.
// A link taken out keeps its size (it is only taken out of the row), so the observer watches each
// link and the brand rather than the row or the pill, whose sizes this action changes.
// While the open menu folds the links away (`.nav-collapsed`, max-width 0) and while they grow back,
// the pill is not at its real width, so measuring waits for that transition to end.

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

	// True while a folding part is collapsed or still animating its max-width back.
	function folding(): boolean {
		return [...pill.querySelectorAll<HTMLElement>('.nav-collapsible')].some((part) =>
			part.classList.contains('nav-collapsed')
			|| (part.getAnimations?.() ?? []).some((animation) =>
				animation.playState === 'running'
				&& (animation as CSSTransition).transitionProperty === 'max-width'));
	}

	function measure(): void {
		if (paused || folding()) return;
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

	// The links grow back after the menu closes; measure the expanded pill once they have.
	function settled(event: TransitionEvent): void {
		if (event.propertyName !== 'max-width') return;
		if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('nav-collapsible')) return;
		measure();
	}
	pill.addEventListener('transitionend', settled);
	pill.addEventListener('transitioncancel', settled);
	let frame = 0;

	return {
		update(next: LinksFitParams) {
			paused = next.paused;
			measure();
			// Without a transition (reduced motion), the parts are full width by the next frame.
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		},
		destroy() {
			observer.disconnect();
			cancelAnimationFrame(frame);
			pill.removeEventListener('transitionend', settled);
			pill.removeEventListener('transitioncancel', settled);
		},
	};
}
