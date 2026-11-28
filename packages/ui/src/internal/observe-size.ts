const observed = new Map<Element, { observer: ResizeObserver; callbacks: Set<() => void> }>();
let shared: { observer: ResizeObserver; type: typeof ResizeObserver } | undefined;

/**
 * Call `callback` whenever `element` changes size, starting with its first layout. One observer
 * serves every element, so a frame that mounts many of them reads all their sizes in one callback,
 * after layout, without the state updates of one forcing another layout before the next reads.
 */
export function observeSize(element: Element, callback: () => void): () => void {
	if (typeof ResizeObserver === 'undefined') {
		callback();
		return () => {};
	}
	// A ResizeObserver replaced later, such as a polyfill, gets its own shared observer.
	if (shared?.type !== ResizeObserver) {
		shared = {
			type: ResizeObserver,
			observer: new ResizeObserver((entries) => {
				for (const { target } of entries) for (const listener of observed.get(target)?.callbacks ?? []) listener();
			}),
		};
	}
	let entry = observed.get(element);
	if (!entry) {
		entry = { observer: shared.observer, callbacks: new Set() };
		observed.set(element, entry);
		entry.observer.observe(element);
	}
	const { observer, callbacks } = entry;
	callbacks.add(callback);
	return () => {
		callbacks.delete(callback);
		if (callbacks.size) return;
		observed.delete(element);
		observer.unobserve(element);
	};
}
