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
const NETWORK_BELOW = 'data-network-below';
const DOCUMENT_NETWORK_BELOW = 'data-site-header-network-below';
const NETWORK_MEASURING = 'data-network-measuring';
const NETWORK_CODE = 'data-network-code';
const WATCHED = '.nav-wordmark, [data-slot="product-brand"], .nav-links > [data-priority], .nav-network';
const CONTENT_CHANGES = { subtree: true, childList: true, characterData: true };

export interface LinksFitParams {
	/** Keep the current state, for example while the open menu collapses the links. */
	paused: boolean;
	/** Changing links measures again and watches any new link. */
	links?: unknown;
	onNetworkInline?: (inline: boolean) => void;
}

function takeOut(element: HTMLElement, out: boolean): void {
	element.style.position = out ? 'absolute' : '';
	element.style.visibility = out ? 'hidden' : '';
	element.style.pointerEvents = out ? 'none' : '';
}

export function linksFit(pill: HTMLElement, params: LinksFitParams) {
	let paused = params.paused;
	let onNetworkInline = params.onNetworkInline;
	let destroyed = false;
	const document = pill.ownerDocument;
	const root = pill.closest<HTMLElement>('[data-slot="site-header"]') ?? pill.parentElement!;
	const parts = () => [...pill.querySelectorAll<HTMLElement>('.nav-links-part')];
	const items = () => [...pill.querySelectorAll<HTMLElement>('.nav-links > [data-priority]')];

	function contentWidth(): number {
		const style = getComputedStyle(root);
		return root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	}

	function setNetworkBelow(below: boolean): void {
		if (pill.hasAttribute(NETWORK_BELOW) === below) return;
		pill.toggleAttribute(NETWORK_BELOW, below);
		// Document clearance follows measured headers without a document-wide CSS :has().
		document.documentElement.toggleAttribute(
			DOCUMENT_NETWORK_BELOW,
			below || document.querySelector(`[${NETWORK_BELOW}]`) !== null,
		);
	}

	function fitNetwork(width: number, fits: () => boolean): void {
		const network = pill.querySelector('[data-slot="site-header-network"]');
		if (!network?.firstElementChild) {
			pill.removeAttribute(NETWORK_CODE);
			setNetworkBelow(false);
			onNetworkInline?.(false);
			return;
		}

		// Before hiding links, try the full name inline, then the short code inline, and only then
		// the row below the pill, which shows the code already. Measure without moving the focused
		// DOM node. Each pass starts from the full name, so the result depends on the widths alone:
		// the resize a switch causes measures once more and keeps the same state. The mutation
		// observer does not watch attributes.
		let inline = false;
		if (width >= 1024) {
			const wasBelow = pill.hasAttribute(NETWORK_BELOW);
			if (wasBelow) pill.setAttribute(NETWORK_MEASURING, '');
			pill.removeAttribute(NETWORK_CODE);
			inline = fits();
			if (!inline) {
				pill.setAttribute(NETWORK_CODE, '');
				inline = fits();
			}
			if (wasBelow) pill.removeAttribute(NETWORK_MEASURING);
		}
		if (!inline) pill.removeAttribute(NETWORK_CODE);
		setNetworkBelow(!inline);
		onNetworkInline?.(inline);
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
		if (destroyed || paused || folding()) return;
		for (const child of pill.querySelectorAll<HTMLElement>(WATCHED)) observer.observe(child);
		if (onNetworkInline) {
			for (const child of pill.children) {
				if (!child.classList.contains('nav-links-part')) observer.observe(child);
			}
		}
		// Start from every link the width tiers show, then drop whole tiers until the pill fits.
		pill.removeAttribute(OVERFLOW);
		for (const part of parts()) takeOut(part, false);
		for (const item of items()) {
			takeOut(item, false);
			item.removeAttribute(DROPPED);
		}
		const width = contentWidth();
		const fits = () => pill.getBoundingClientRect().width <= width - 2 * MIN_GAP;
		if (onNetworkInline) fitNetwork(width, fits);
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
	const actions = new MutationObserver(measure);
	if (onNetworkInline) actions.observe(pill, CONTENT_CHANGES);
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
			if (!!next.onNetworkInline !== !!onNetworkInline) {
				actions.disconnect();
				if (next.onNetworkInline) actions.observe(pill, CONTENT_CHANGES);
			}
			onNetworkInline = next.onNetworkInline;
			if (!onNetworkInline) {
				pill.removeAttribute(NETWORK_CODE);
				setNetworkBelow(false);
			}
			measure();
			// Without a transition (reduced motion), the parts are full width by the next frame.
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		},
		destroy() {
			destroyed = true;
			observer.disconnect();
			actions.disconnect();
			cancelAnimationFrame(frame);
			pill.removeEventListener('transitionend', settled);
			pill.removeEventListener('transitioncancel', settled);
			pill.removeAttribute(NETWORK_CODE);
			setNetworkBelow(false);
		},
	};
}
