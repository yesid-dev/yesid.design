// Keep the existing page branches out of the accessibility tree while the rail is modal.
const references = ['aria-controls', 'aria-owns', 'aria-describedby'] as const;
const popupSelector = '[role="dialog"], [role="listbox"], [role="menu"], [role="tree"], [role="grid"], [role="tooltip"], [popover]';

export function hideRailBackground(carrier: HTMLElement): () => void {
	const { ownerDocument } = carrier;
	const background: Element[] = [];
	for (let branch: Element = carrier; branch !== ownerDocument.body && branch.parentElement; branch = branch.parentElement) {
		for (const sibling of branch.parentElement.children) {
			if (sibling !== branch && !sibling.matches('script, style, link, template')) background.push(sibling);
		}
	}

	const hidden = new Map<Element, string | null>();

	function restore(element: Element, original: string | null) {
		if (original === null) element.removeAttribute('aria-hidden');
		else element.setAttribute('aria-hidden', original);
	}

	function update() {
		const popups = new Set<Element>();
		for (const control of carrier.querySelectorAll('[aria-controls], [aria-owns], [aria-describedby]')) {
			for (const attribute of references) {
				for (const id of (control.getAttribute(attribute) ?? '').split(/\s+/)) {
					const popup = id && ownerDocument.getElementById(id);
					if (popup && !carrier.contains(popup) && popup.matches(popupSelector)) popups.add(popup);
				}
			}
		}

		const next = new Set<Element>();
		function isolate(branch: Element) {
			if (popups.has(branch)) return;
			for (const popup of popups) {
				if (branch.contains(popup)) {
					for (const child of branch.children) isolate(child);
					return;
				}
			}
			next.add(branch);
		}
		for (const branch of background) isolate(branch);

		for (const [element, original] of hidden) {
			if (next.has(element)) continue;
			restore(element, original);
			hidden.delete(element);
		}
		for (const element of next) {
			if (element.getAttribute('aria-hidden') === 'true') continue;
			if (!hidden.has(element)) hidden.set(element, element.getAttribute('aria-hidden'));
			element.setAttribute('aria-hidden', 'true');
		}
	}

	update();
	// Body portals mounted later are outside the original background. For a popup
	// in an existing portal host, release only its branch when the rail owns it.
	const observer = new MutationObserver(update);
	observer.observe(ownerDocument.body, { subtree: true, childList: true });
	observer.observe(carrier, { subtree: true, attributes: true, attributeFilter: [...references] });
	return () => {
		observer.disconnect();
		for (const [element, original] of hidden) restore(element, original);
	};
}
