import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConstructionGround, { type ConstructionGroundProps } from './ConstructionGround.svelte';

const html = (markup: string) => createRawSnippet(() => ({ render: () => markup }));

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('ConstructionGround structure and prop passthrough', () => {
	it('passes layout, floodlight and lighting through to ConstructionProps', () => {
		vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
		const view = render(ConstructionGround, {
			props: { layout: 'spread', floodlight: true, lighting: true },
		});

		const propsEl = view.container.querySelector('[data-slot="construction-props"]')!;
		expect(propsEl).not.toBeNull();
		expect(propsEl.classList.contains('spread')).toBe(true);
		expect(propsEl.querySelector('[data-construction-fixture]')).not.toBeNull();
		expect(propsEl.querySelector('feDiffuseLighting')).not.toBeNull();
		expect(view.container.querySelector('[data-slot="construction-ground-fixtures"]')).toBeNull();
	});

	it('renders fixtures on the same stage outside the moving ConstructionProps group', () => {
		vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
		const fixtures = html('<div data-testid="stationary-lamp">Lit lamp</div>');
		const view = render(ConstructionGround, { props: { fixtures } });

		const stage = view.container.querySelector('[data-slot="construction-ground-stage"]')!;
		const propsEl = view.container.querySelector('[data-slot="construction-props"]')!;
		const fixturesSlot = view.container.querySelector('[data-slot="construction-ground-fixtures"]')!;
		const lamp = view.getByTestId('stationary-lamp');

		expect(stage.contains(propsEl)).toBe(true);
		expect(stage.contains(fixturesSlot)).toBe(true);
		expect(fixturesSlot.contains(lamp)).toBe(true);
		expect(propsEl.contains(lamp)).toBe(false);
	});

	it('owns revealAt and progress internally rather than accepting caller passthrough', async () => {
		vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
		// Type-level check: ConstructionGroundProps excludes revealAt and progress.
		// @ts-expect-error ConstructionGround owns revealAt internally
		const _badRevealAt: ConstructionGroundProps = { revealAt: document.createElement('div') };
		// @ts-expect-error ConstructionGround owns progress internally
		const _badProgress: ConstructionGroundProps = { progress: 0.5 };
		expect(_badRevealAt).toBeDefined();
		expect(_badProgress).toBeDefined();

		const root = document.createElement('div');
		Object.defineProperties(root, { clientHeight: { value: 800 }, clientTop: { value: 2 } });
		root.getBoundingClientRect = () => new DOMRect(0, 100, 1200, 804);

		const externalMarker = document.createElement('div');
		externalMarker.getBoundingClientRect = () => new DOMRect(0, 0, 1, 1);

		const view = render(ConstructionGround, {
			props: {
				revealRoot: root,
				// Even if forced at runtime, revealAt and progress do not control the ground.
				...({ revealAt: externalMarker, progress: 0 } as Record<string, unknown>),
			},
		});

		const floor = view.container.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;
		const stage = view.container.querySelector('[data-slot="construction-ground-stage"]')!;
		stage.getBoundingClientRect = () => new DOMRect(0, 0, 1200, 240);

		for (const [top, progress] of [[903, 0], [902, 0], [901, 1 / 240], [782, 0.5], [662, 1], [782, 0.5]]) {
			floor.getBoundingClientRect = () => new DOMRect(0, top, 1200, 0);
			root.dispatchEvent(new Event('scroll'));
			await tick();
			expect(Number(floor.style.getPropertyValue('--ground-progress'))).toBe(progress);
		}
	});
});

describe('ConstructionGround focus and keyboard opening', () => {
	it('opens synchronously when focus lands after the ground, but not before it', () => {
		vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
		const beforeBtn = document.createElement('button');
		beforeBtn.textContent = 'Before';
		const host = document.createElement('div');
		const afterBtn = document.createElement('button');
		afterBtn.textContent = 'Footer link';
		document.body.append(beforeBtn, host, afterBtn);

		try {
			const view = render(ConstructionGround, { target: host });
			const floor = view.container.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;
			expect(floor.dataset.opened).toBeUndefined();

			fireEvent.focusIn(beforeBtn);
			expect(floor.dataset.opened).toBeUndefined();

			fireEvent.focusIn(afterBtn);
			expect(floor.dataset.opened).toBe('true');
			expect(floor.style.getPropertyValue('--ground-progress')).toBe('1');
		} finally {
			beforeBtn.remove();
			host.remove();
			afterBtn.remove();
		}
	});

	it('opens on End always, and on PageDown or Space only when within two viewports', () => {
		vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
		vi.stubGlobal('innerHeight', 900);

		const first = render(ConstructionGround);
		const firstFloor = first.container.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;
		firstFloor.getBoundingClientRect = () => new DOMRect(0, 2200, 1200, 0);

		fireEvent.keyDown(document, { key: 'PageDown' });
		expect(firstFloor.dataset.opened).toBeUndefined();
		fireEvent.keyDown(document, { key: ' ' });
		expect(firstFloor.dataset.opened).toBeUndefined();

		// End opens regardless of distance.
		fireEvent.keyDown(document, { key: 'End' });
		expect(firstFloor.dataset.opened).toBe('true');
		first.unmount();

		const second = render(ConstructionGround);
		const secondFloor = second.container.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;
		secondFloor.getBoundingClientRect = () => new DOMRect(0, 1500, 1200, 0);
		fireEvent.keyDown(document, { key: 'PageDown' });
		expect(secondFloor.dataset.opened).toBe('true');
		second.unmount();

		const third = render(ConstructionGround);
		const thirdFloor = third.container.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;
		thirdFloor.getBoundingClientRect = () => new DOMRect(0, 1200, 1200, 0);
		fireEvent.keyDown(document, { key: ' ' });
		expect(thirdFloor.dataset.opened).toBe('true');
		third.unmount();
	});
});

describe('ConstructionGround fixtures marker', () => {
	const floorOf = (container: Element) =>
		container.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;

	it('marks only a ground with fixtures, whatever the reveal state', () => {
		vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
		const bare = render(ConstructionGround, { props: { layout: 'spread', floodlight: true } });
		expect(floorOf(bare.container).hasAttribute('data-fixtures')).toBe(false);
		fireEvent.keyDown(document, { key: 'End' });
		expect(floorOf(bare.container).hasAttribute('data-fixtures')).toBe(false);
		bare.unmount();

		const view = render(ConstructionGround, { props: { fixtures: html('<div>Lit lamp</div>') } });
		const floor = floorOf(view.container);
		expect(floor.dataset.fixtures).toBe('true');
		fireEvent.keyDown(document, { key: 'End' });
		expect(floor.dataset.fixtures).toBe('true');
	});
});
