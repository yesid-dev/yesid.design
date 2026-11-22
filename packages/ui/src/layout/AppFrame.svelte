<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { SurfaceRailProps } from './SurfaceRail.svelte';

	export interface AppFrameProps {
		header: Snippet;
		controls?: Snippet;
		children: Snippet;
		evidence?: Pick<SurfaceRailProps, 'rail' | 'label' | 'openAria' | 'closeAria'>;
		fullViewport?: boolean;
		/** Measured header and controls height in CSS pixels. Bind to use outside the frame. */
		chromeHeight?: number;
	}
</script>

<script lang="ts">
	import SurfaceRail from './SurfaceRail.svelte';

	let { header, controls, children, evidence, fullViewport = false, chromeHeight = $bindable() }: AppFrameProps =
		$props();
</script>

<div
	class="app-frame"
	class:full-viewport={fullViewport}
	data-slot="app-frame"
	style:--app-frame-chrome-height={chromeHeight === undefined ? undefined : `${chromeHeight}px`}
>
	<div class="app-frame-chrome" data-slot="app-frame-chrome" bind:offsetHeight={chromeHeight}>
		<div data-slot="app-frame-header">{@render header()}</div>
		{#if controls}
			<div class="app-frame-controls" data-slot="app-frame-controls">{@render controls()}</div>
		{/if}
	</div>
	<div class="app-frame-body" class:with-evidence={!!evidence}>
		<main id="main" class="app-frame-main" tabindex="-1">{@render children()}</main>
		{#if evidence}<SurfaceRail {...evidence} class="app-frame-evidence" />{/if}
	</div>
</div>

<style>
	.app-frame {
		--chrome-offset: var(--app-frame-chrome-height, var(--nav-clearance, 0px));
		display: flex;
		flex-direction: column;
		min-block-size: 100dvh;
		min-inline-size: 0;
	}
	.app-frame-chrome {
		position: sticky;
		inset-block-start: 0;
		z-index: var(--z-rail);
		flex: none;
		background: var(--background);
	}
	.app-frame-chrome:has(:global([aria-modal='true'])) {
		z-index: var(--z-menu);
	}
	.app-frame-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em 1em;
		padding: 0.5em min(var(--space-page-x), 4vw);
		border-block-end: 1px solid var(--border);
	}
	.app-frame-body, .app-frame-main {
		min-block-size: 0;
		min-inline-size: 0;
	}
	.app-frame-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		flex: 1;
	}
	.full-viewport {
		block-size: 100dvh;
		overflow: clip;
	}
	.full-viewport .app-frame-main { overflow: auto; }

	@media (min-width: 1024px) {
		.with-evidence {
			grid-template-columns: minmax(0, 1fr) minmax(0, min(28rem, 30%));
			gap: 1rem;
		}
		.full-viewport :global(.app-frame-evidence) {
			inset-block-start: 0;
			max-block-size: 100%;
		}
	}
</style>
