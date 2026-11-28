import { afterEach, describe, expect, it, vi } from 'vitest';
import { observeSize } from './observe-size.js';

class StubObserver {
	static instances: StubObserver[] = [];
	readonly targets = new Set<Element>();
	constructor(readonly callback: (entries: { target: Element }[]) => void) {
		StubObserver.instances.push(this);
	}
	observe(target: Element) {
		this.targets.add(target);
	}
	unobserve(target: Element) {
		this.targets.delete(target);
	}
	disconnect() {}
	deliver(...targets: Element[]) {
		this.callback(targets.map((target) => ({ target })));
	}
}

afterEach(() => {
	vi.unstubAllGlobals();
	StubObserver.instances = [];
});

describe('observeSize', () => {
	it('serves every element from one observer and calls each callback for its own element', () => {
		// A new class each time, as the shared observer follows the current ResizeObserver.
		vi.stubGlobal('ResizeObserver', class extends StubObserver {});
		const [first, second] = [document.createElement('div'), document.createElement('div')];
		const firstSize = vi.fn();
		const secondSize = vi.fn();
		const stopFirst = observeSize(first, firstSize);
		const stopSecond = observeSize(second, secondSize);
		expect(StubObserver.instances).toHaveLength(1);
		const [observer] = StubObserver.instances;
		expect(firstSize).not.toHaveBeenCalled();

		observer!.deliver(first, second);
		expect(firstSize).toHaveBeenCalledTimes(1);
		expect(secondSize).toHaveBeenCalledTimes(1);

		stopFirst();
		expect([...observer!.targets]).toEqual([second]);
		observer!.deliver(first);
		expect(firstSize).toHaveBeenCalledTimes(1);
		stopSecond();
		expect(observer!.targets.size).toBe(0);
	});

	it('keeps observing an element until its last callback stops', () => {
		// A new class each time, as the shared observer follows the current ResizeObserver.
		vi.stubGlobal('ResizeObserver', class extends StubObserver {});
		const element = document.createElement('div');
		const stopOne = observeSize(element, vi.fn());
		const other = vi.fn();
		const stopOther = observeSize(element, other);
		stopOne();
		const [observer] = StubObserver.instances;
		observer!.deliver(element);
		expect(other).toHaveBeenCalledTimes(1);
		stopOther();
		expect(observer!.targets.size).toBe(0);
	});

	it('measures immediately without ResizeObserver', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		const size = vi.fn();
		observeSize(document.createElement('div'), size);
		expect(size).toHaveBeenCalledTimes(1);
	});
});
