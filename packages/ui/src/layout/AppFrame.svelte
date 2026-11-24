<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SurfaceRailProps } from './SurfaceRail.svelte';

	export interface AppFrameProps {
		header: Snippet;
		controls?: Snippet;
		controlsRail?: Pick<SurfaceRailProps, 'rail' | 'label' | 'summary' | 'openAria' | 'closeAria' | 'mobileVisible'>;
		children: Snippet;
		footer?: Snippet;
		mainLabel?: string;
		evidence?: Pick<SurfaceRailProps, 'rail' | 'label' | 'openAria' | 'closeAria' | 'summary' | 'mobileVisible'>;
		fullViewport?: boolean;
		/** Measured header and controls height in CSS pixels. Bind to use outside the frame. */
		chromeHeight?: number;
	}
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import Button from '../primitives/button/button.svelte';
	import SurfaceRail from './SurfaceRail.svelte';
	import type { SurfaceRailContext } from './SurfaceRail.svelte';
	import { frameRailLayout } from './frame-rail-layout.js';

	let { header, controls, controlsRail, children, footer, mainLabel, evidence, fullViewport = false, chromeHeight = $bindable() }: AppFrameProps = $props();
	let headerHeight = $state<number>();
	let tallChrome = $state(false);
	let pairedRails = $state<boolean>();
	let frameBody = $state<HTMLDivElement>();
	setContext(frameRailLayout, () => pairedRails ?? false);

	function observeRailLayout(marker: HTMLElement) {
		const frame = marker.parentElement!;
		// The CSS media query uses the browser's initial text size. Observe one rem to catch
		// page-level font-size overrides without putting fixed descendants in a size container.
		const measure = () => {
			const rem = marker.getBoundingClientRect().width;
			if (rem > 0) pairedRails = frame.getBoundingClientRect().width >= 64 * rem;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(marker);
		observer.observe(frame);
		measure();
		return { destroy: () => observer.disconnect() };
	}

	function measureChrome(chrome: HTMLElement) {
		const headerRow = chrome.querySelector(':scope > [data-slot="app-frame-header"]')!;
		const measure = () => {
			headerHeight = Math.ceil(headerRow.getBoundingClientRect().height);
			chromeHeight = Math.ceil(chrome.getBoundingClientRect().height);
			tallChrome = chromeHeight > document.documentElement.clientHeight * 0.75;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(headerRow);
		observer.observe(chrome);
		window.addEventListener('resize', measure);
		measure();
		return { destroy() {
			observer.disconnect();
			window.removeEventListener('resize', measure);
		} };
	}

	$effect(() => {
		if (fullViewport || chromeHeight === undefined) return;
		const scroller = document.documentElement;
		const property = '--chrome-clearance-top';
		const previous = scroller.style.getPropertyValue(property);
		const priority = scroller.style.getPropertyPriority(property);
		const hadClass = scroller.classList.contains('chrome-clearance');
		const clearance = tallChrome ? '0px' : `${chromeHeight}px`;
		scroller.classList.add('chrome-clearance');
		scroller.style.setProperty(property, clearance);
		const bottomProperty = 'scroll-padding-block-end';
		const previousBottom = scroller.style.getPropertyValue(bottomProperty);
		const bottomPriority = scroller.style.getPropertyPriority(bottomProperty);
		const hasMobileRail = (controlsRail && controlsRail.mobileVisible !== false)
			|| (evidence && evidence.mobileVisible !== false);
		const compactPadding = pairedRails === false && hasMobileRail && frameBody
			? getComputedStyle(frameBody).getPropertyValue('--app-frame-compact-clearance').trim()
			: '';
		const currentBottom = compactPadding ? getComputedStyle(scroller).scrollPaddingBlockEnd : '';
		const bottom = compactPadding
			? `max(${currentBottom && currentBottom !== 'auto' ? currentBottom : '0px'}, ${compactPadding})`
			: '';
		if (bottom) scroller.style.setProperty(bottomProperty, bottom);
		const installedBottom = scroller.style.getPropertyValue(bottomProperty);
		return () => {
			if (!hadClass) scroller.classList.remove('chrome-clearance');
			if (scroller.style.getPropertyValue(property) === clearance) {
				if (previous) scroller.style.setProperty(property, previous, priority);
				else scroller.style.removeProperty(property);
			}
			if (bottom && scroller.style.getPropertyValue(bottomProperty) === installedBottom) {
				if (previousBottom) scroller.style.setProperty(bottomProperty, previousBottom, bottomPriority);
				else scroller.style.removeProperty(bottomProperty);
			}
		};
	});
</script>

<div
	class="app-frame"
	class:full-viewport={fullViewport}
	data-slot="app-frame"
	data-rail-layout={pairedRails === undefined ? undefined : pairedRails ? 'paired' : 'compact'}
	data-lenis-prevent={fullViewport ? '' : undefined}
	style:--app-frame-header-height={headerHeight === undefined ? undefined : `${headerHeight}px`}
	style:--app-frame-chrome-height={chromeHeight === undefined ? undefined : `${chromeHeight}px`}
>
	<span class="app-frame-rail-breakpoint" aria-hidden="true" use:observeRailLayout></span>
	<div class="app-frame-chrome" class:tall-chrome={tallChrome} data-slot="app-frame-chrome" use:measureChrome>
		<div data-slot="app-frame-header">{@render header()}</div>
		{#if controls}
			<div class="app-frame-controls" data-slot="app-frame-controls" data-lenis-prevent>{@render controls()}</div>
		{/if}
	</div>
	<div bind:this={frameBody} class="app-frame-body" class:with-evidence={!!evidence} class:with-controls-rail={!!controlsRail}>
		{#if controlsRail}
			<SurfaceRail {...controlsRail} class="app-frame-controls-rail">
				{#snippet rail(context: SurfaceRailContext)}
					<div class="app-frame-close-controls">
						<Button variant="outline" wrap onclick={context.closeSheet}>{controlsRail.closeAria}</Button>
					</div>
					{@render controlsRail.rail(context)}
				{/snippet}
			</SurfaceRail>
		{/if}
		<main id="main" class="app-frame-main" aria-label={mainLabel} tabindex="-1" data-lenis-prevent={fullViewport ? '' : undefined}>
			{@render children()}
		</main>
		{#if evidence}<SurfaceRail {...evidence} class="app-frame-evidence" />{/if}
	</div>
	{@render footer?.()}
</div>

<style>
	.app-frame {
		--app-frame-header-height: var(--app-frame-header-height-ssr, var(--nav-clearance, 0px));
		--chrome-offset: var(--app-frame-chrome-height, var(--app-frame-chrome-height-ssr, var(--app-frame-header-height)));
		--app-frame-main-min: var(--size-tap-min);
		--app-frame-paired: 0;
		--app-frame-compact: calc(1 - var(--app-frame-paired));
		--app-frame-rail-display: none;
		--app-frame-pill-display: block;
		display: flex;
		flex-direction: column;
		min-block-size: 100dvh;
		min-inline-size: 0;
	}
	@media (min-width: 64rem) {
		.app-frame:not([data-rail-layout]) {
			--app-frame-paired: 1;
			--app-frame-rail-display: flex;
			--app-frame-pill-display: none;
		}
	}
	.app-frame[data-rail-layout='paired'] {
		--app-frame-paired: 1;
		--app-frame-rail-display: flex;
		--app-frame-pill-display: none;
	}
	.app-frame-rail-breakpoint {
		position: absolute;
		inset-inline-start: 0;
		inline-size: 1rem;
		block-size: 1px;
		visibility: hidden;
		pointer-events: none;
	}
	.app-frame-close-controls { display: none; }
	:global(.surface-rail-sheet) .app-frame-close-controls { display: flex; justify-content: flex-end; }
	.app-frame-chrome {
		position: sticky;
		inset-block-start: 0;
		z-index: var(--z-sheet);
		flex: none;
		background: var(--background);
	}
	.app-frame-chrome:has(:global([aria-modal='true'])) {
		z-index: var(--z-menu);
	}
	.app-frame-chrome:has(:global(.skip-link:focus)) {
		z-index: var(--z-overlay);
	}
	.app-frame-chrome.tall-chrome { position: relative; }
	.app-frame:has(> .tall-chrome) { --chrome-offset: 0px; }
	.app-frame-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em 1em;
		padding: 0.5em min(var(--space-page-x), 4vw);
		border-block-end: 1px solid var(--border);
		max-block-size: max(
			var(--size-tap-min),
			min(44dvh, calc(100dvh - var(--app-frame-header-height) - var(--app-frame-main-min)))
		);
		overflow: auto;
		overscroll-behavior: contain;
	}
	.app-frame-body, .app-frame-main {
		min-block-size: 0;
		min-inline-size: 0;
	}
	.app-frame-body {
		--app-frame-controls-track: minmax(0, calc(var(--app-frame-paired) * min(17rem, 27%)));
		--app-frame-evidence-track: minmax(0, calc(var(--app-frame-paired) * min(28rem, 30%)));
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		flex: 1;
	}
	.with-controls-rail,
	.with-evidence { gap: calc(var(--app-frame-paired) * 1rem); }
	.with-controls-rail {
		grid-template-columns: var(--app-frame-controls-track) minmax(0, 1fr);
	}
	.with-controls-rail > .app-frame-main { grid-column: 2; }
	.with-evidence {
		grid-template-columns: minmax(0, 1fr) var(--app-frame-evidence-track);
	}
	.with-controls-rail.with-evidence {
		grid-template-columns: var(--app-frame-controls-track) minmax(0, 1fr) var(--app-frame-evidence-track);
	}
	.full-viewport {
		block-size: 100dvh;
		overflow: auto;
	}
	.full-viewport .app-frame-body { min-block-size: var(--app-frame-main-min); }
	.full-viewport .app-frame-main { overflow: auto; }
	.full-viewport .with-controls-rail {
		position: relative;
		grid-template-columns: minmax(0, 1fr);
	}
	.full-viewport .with-controls-rail > .app-frame-main { grid-column: 1; }
	.full-viewport .with-controls-rail.with-evidence {
		grid-template-columns: minmax(0, 1fr) var(--app-frame-evidence-track);
	}
	.full-viewport :global(.app-frame-controls-rail:not(.surface-rail--mobile)) {
		position: absolute;
		inset-block-start: 1rem;
		inset-inline-start: 1rem;
		inline-size: min(17rem, 36%);
		max-block-size: calc(100% - 2rem);
	}
	.full-viewport :global(.app-frame-evidence:not(.surface-rail--mobile)) {
		inset-block-start: 0;
		max-block-size: 100%;
	}
	.app-frame-body > :global([data-slot='surface-rail-mobile']) {
		--surface-rail-sheet-clearance: var(--app-frame-header-height);
	}
	/* Keep the evidence sheet above the chrome until its exit animation unmounts it. */
	.app-frame-body > :global([data-slot='surface-rail-mobile']:not([data-open='true']):not(:has(.surface-rail-sheet))) {
		z-index: calc(var(--z-sheet) - 1);
	}
	.app-frame:has(.app-frame-body > :global([data-slot='surface-rail-mobile'])) > :is(.app-frame-chrome, .app-frame-body) {
		--app-frame-compact-clearance: var(--floating-pill-clearance);
		--app-frame-main-min: max(var(--size-tap-min), calc(var(--app-frame-compact) * var(--app-frame-compact-clearance)));
	}
	.app-frame:has(.app-frame-body > :global([data-slot='surface-rail-mobile']) ~ :global([data-slot='surface-rail-mobile'])) > :is(.app-frame-chrome, .app-frame-body) {
		--app-frame-compact-clearance: calc(var(--floating-pill-clearance) + max(3.25rem, 52px));
	}
	.app-frame-body > :global([data-slot='surface-rail-mobile']) ~ :global([data-slot='surface-rail-mobile']) {
		--surface-rail-stack-offset: calc(var(--app-frame-compact) * max(3.25rem, 52px));
	}
	.full-viewport .app-frame-body:has(> :global([data-slot='surface-rail-mobile'])) .app-frame-main {
		scroll-padding-block-end: calc(var(--app-frame-compact) * var(--app-frame-main-min));
	}
</style>
