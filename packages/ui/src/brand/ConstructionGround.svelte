<!--
  Construction artwork ground above a footer (wraps ConstructionProps).

  The ground opens with the props: its block-size grows from 0 to --construction-ground-height
  (default 240px) as they rise, so no empty gap sits above the footer before scrolling there:
  - an internal reveal marker sits above the ground by max(5vh, 30vh - height) + 120px, so the
    footer stays below the viewport for the entire reveal;
  - the stage is pinned to the ground's top and moves by transform only;
  - focus landing after the ground, End, and Page Down / Space within two screens open the ground
    synchronously via flushSync before the browser scrolls;
  - reduced motion and SSR/no-JS render full height with the props in place.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ConstructionGroundProps {
		/** Original warm spotlight treatment; plain artwork by default. */
		lighting?: boolean;
		/** Spread the group along the ground. */
		layout?: 'original' | 'spread' | 'around-fixture';
		/** Include an unlit fixture in the moving group. */
		floodlight?: boolean;
		/** Active scroll viewport; omit for the window. */
		revealRoot?: Element;
		/** Stationary pieces (such as a lit ConstructionFloodlight and its beam) on the stage outside the moving props group. */
		fixtures?: Snippet;
	}
</script>

<script lang="ts">
	import { flushSync } from 'svelte';
	import ConstructionProps from './ConstructionProps.svelte';

	let {
		lighting = false,
		layout = 'original',
		floodlight = false,
		revealRoot,
		fixtures,
	}: ConstructionGroundProps = $props();

	let marker = $state<HTMLElement>();
	let ground = $state<HTMLElement>();
	// Full until ConstructionProps measures: SSR and no-JS keep full height and show the props.
	let progress = $state(1);
	let opened = $state(false);

	function open(): boolean {
		if (opened) return false;
		flushSync(() => (opened = true));
		return true;
	}

	function openForFocus(event: FocusEvent) {
		const target = event.target;
		if (!ground || !(target instanceof Node)) return;
		if (ground.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) {
			if (open() && target instanceof HTMLElement && typeof target.scrollIntoView === 'function') {
				const rect = target.getBoundingClientRect();
				if (rect.top < 0 || rect.bottom > window.innerHeight) {
					target.scrollIntoView({ block: 'center', behavior: 'instant' });
				}
			}
		}
	}

	function openForPageKeys(event: KeyboardEvent) {
		if (event.key === 'End') open();
		else if (event.key === 'PageDown' || event.key === ' ') {
			const viewportHeight = revealRoot?.clientHeight ?? window.innerHeight;
			const rootTop = revealRoot?.getBoundingClientRect().top ?? 0;
			if (ground && ground.getBoundingClientRect().top - rootTop < 2 * viewportHeight) open();
		}
	}
</script>

<svelte:document onfocusin={openForFocus} onkeydown={openForPageKeys} />

<div class="construction-ground" data-slot="construction-ground">
	<div
		bind:this={marker}
		class="construction-ground-anchor"
		data-slot="construction-ground-anchor"
		aria-hidden="true"
	></div>
	<div
		bind:this={ground}
		class="construction-ground-floor"
		data-slot="construction-ground-floor"
		style:--ground-progress={opened ? 1 : progress}
		data-opened={opened || undefined}
	>
		<div class="construction-ground-stage" data-slot="construction-ground-stage">
			<ConstructionProps
				{layout}
				{floodlight}
				{lighting}
				{revealRoot}
				revealAt={opened ? undefined : marker}
				bind:progress
			/>
			{#if fixtures}
				<div class="construction-ground-fixtures" data-slot="construction-ground-fixtures">
					{@render fixtures()}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.construction-ground {
		flex-shrink: 0;
	}
	.construction-ground-anchor {
		position: relative;
		inset-block-start: calc(
			-1 * (max(5vh, 30vh - var(--construction-ground-height, 240px)) + 120px)
		);
		block-size: 0;
		inline-size: 1px;
		pointer-events: none;
	}
	.construction-ground-floor {
		position: relative;
		block-size: calc(var(--construction-ground-height, 240px) * var(--ground-progress, 1));
		overflow: clip;
	}
	.construction-ground-stage {
		position: absolute;
		inset-inline: 0;
		inset-block-start: 0;
		block-size: var(--construction-ground-height, 240px);
		transform: translateY(
			calc((var(--ground-progress, 1) - 1) * var(--construction-ground-height, 240px))
		);
	}
	.construction-ground-fixtures {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.construction-ground-floor {
			block-size: var(--construction-ground-height, 240px);
		}
		.construction-ground-stage {
			transform: none;
		}
	}
</style>
