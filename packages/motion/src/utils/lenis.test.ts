import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initLenis, destroyLenis, getLenis } from './lenis.js';

// Force a known touch state per test. The global mock defaults to 0 (desktop).
function setTouch(value: number): void {
	(ScrollTrigger as unknown as { isTouch: number }).isTouch = value;
}

// Control prefers-reduced-motion independently in each test.
function mockMatchMedia(matches: boolean): void {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
		value: vi.fn().mockReturnValue({
			matches,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}),
	});
}

describe('motion/utils/lenis', () => {
	beforeEach(() => {
		destroyLenis();
		vi.clearAllMocks();
		setTouch(0);
		mockMatchMedia(false);
	});

	afterEach(() => {
		destroyLenis();
		setTouch(0);
	});

	it('desktop: initLenis creates a Lenis instance', () => {
		setTouch(0);
		initLenis();
		expect(getLenis()).not.toBeNull();
	});

	it('registers ScrollTrigger before reading its touch detection', async () => {
		vi.resetModules();
		const fresh = await import('./lenis.js');
		const { gsap: freshGsap } = await import('gsap');
		const { ScrollTrigger: freshScrollTrigger } = await import('gsap/ScrollTrigger');
		fresh.initLenis();
		expect(freshGsap.registerPlugin).toHaveBeenCalledWith(freshScrollTrigger);
		fresh.destroyLenis();
	});

	it('touch: initLenis does NOT create a Lenis instance', () => {
		setTouch(1);
		initLenis();
		expect(getLenis()).toBeNull();
	});

	it('touch: initLenis does NOT call ScrollTrigger.normalizeScroll', () => {
		setTouch(1);
		initLenis();
		expect(ScrollTrigger.normalizeScroll).not.toHaveBeenCalled();
	});

	it('desktop: initLenis does NOT call ScrollTrigger.normalizeScroll either', () => {
		setTouch(0);
		initLenis();
		expect(ScrollTrigger.normalizeScroll).not.toHaveBeenCalled();
	});

	it('desktop: initLenis scrolls an element when given a wrapper and content', () => {
		const wrapper = document.createElement('div');
		const content = document.createElement('div');
		wrapper.append(content);
		document.body.append(wrapper);
		initLenis({ wrapper, content });
		expect(getLenis()?.options.wrapper).toBe(wrapper);
		expect(getLenis()?.options.content).toBe(content);
		wrapper.remove();
	});

	it('desktop: initLenis is idempotent — second call keeps the same instance', () => {
		setTouch(0);
		initLenis();
		const first = getLenis();
		initLenis();
		expect(getLenis()).toBe(first);
	});

	it('desktop: destroyLenis clears the instance', () => {
		setTouch(0);
		initLenis();
		expect(getLenis()).not.toBeNull();
		destroyLenis();
		expect(getLenis()).toBeNull();
	});

	it('touch: destroyLenis does NOT call ScrollTrigger.normalizeScroll', () => {
		setTouch(1);
		initLenis();
		destroyLenis();
		expect(ScrollTrigger.normalizeScroll).not.toHaveBeenCalled();
	});

	it('desktop: drives Lenis from the GSAP ticker only while a smooth scroll runs', () => {
		initLenis();
		const lenis = getLenis()!;
		// jsdom lays nothing out, so give the scroller room to move.
		Object.defineProperty(lenis, 'limit', { value: 1000 });
		expect(gsap.ticker.add).not.toHaveBeenCalled();

		lenis.scrollTo(120, { immediate: true });
		expect(gsap.ticker.add).not.toHaveBeenCalled();

		lenis.scrollTo(240, { duration: 0.1 });
		expect(lenis.isScrolling).toBe('smooth');
		expect(gsap.ticker.add).toHaveBeenCalledTimes(1);
		const tick = vi.mocked(gsap.ticker.add).mock.calls[0]![0] as (time: number) => void;

		// The first frame after the pause advances one frame, not the whole time since the last raf.
		tick(50);
		expect(lenis.isScrolling).toBe('smooth');
		expect(lenis.animatedScroll).toBeGreaterThan(120);
		expect(lenis.animatedScroll).toBeLessThan(240);
		lenis.scrollTo(300, { duration: 0.1 });
		expect(gsap.ticker.add).toHaveBeenCalledTimes(1);

		for (let frame = 1; frame <= 12; frame++) tick(50 + frame / 60);
		expect(lenis.isScrolling).toBe(false);
		expect(lenis.animatedScroll).toBe(300);
		expect(gsap.ticker.remove).toHaveBeenCalledWith(tick);
	});

	it('does not create a Lenis instance under reduced motion (MOTION-GATED tier)', () => {
		setTouch(0);
		mockMatchMedia(true);
		initLenis();
		expect(getLenis()).toBeNull();
	});

	it('destroyLenis is a safe no-op after a reduced-motion bail', () => {
		setTouch(0);
		mockMatchMedia(true);
		initLenis();
		expect(() => destroyLenis()).not.toThrow();
		expect(getLenis()).toBeNull();
	});
});
