<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { MapViewport } from './placement.js';

	export interface MapFrameProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		label: string;
		children: Snippet<[MapViewport]>;
		panel?: Snippet;
		legend?: Snippet;
		legendLabel?: string;
		details?: { label: string; content: Snippet };
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import { Card } from '../primitives/card/index.js';
	import type { MapRect } from './placement.js';

	let { label, children, panel, legend, legendLabel, details, class: className, ...rest }: MapFrameProps = $props();
	let stage = $state<HTMLDivElement>();
	let left = $state<HTMLDivElement>();
	let right = $state<HTMLElement>();
	let legendButton = $state<HTMLButtonElement>();
	let legendPanel = $state<HTMLDivElement>();
	let legendOpen = $state(false);
	let compactLegend = $state(false);
	let viewport = $state<MapViewport>({ width: 0, height: 0, exclusions: [] });
	const legendId = $props.id();

	function closeLegendOnEscape(event: KeyboardEvent): void {
		if (event.key !== 'Escape' || !legendOpen) return;
		event.preventDefault();
		event.stopPropagation();
		legendOpen = false;
		legendButton?.focus({ preventScroll: true });
	}

	$effect(() => {
		if (!stage || typeof ResizeObserver === 'undefined') return;
		const canvas = stage;
		// An unmounted bind:this target can be null.
		const overlays = [left, right, legendButton, legendPanel].filter((element) => element != null);

		function measure() {
			// The observed trigger reports the CSS mode, including font changes at a fixed width.
			compactLegend = !!legendButton?.getClientRects().length;
			const root = canvas.getBoundingClientRect();
			const exclusions: MapRect[] = [];
			for (const overlay of overlays) {
				const rect = overlay.getBoundingClientRect();
				const x = Math.max(root.left, rect.left);
				const y = Math.max(root.top, rect.top);
				const width = Math.min(root.right, rect.right) - x;
				const height = Math.min(root.bottom, rect.bottom) - y;
				if (width > 0 && height > 0) exclusions.push({ x: x - root.left, y: y - root.top, width, height });
			}
			viewport = { width: root.width, height: root.height, exclusions };
		}

		const observer = new ResizeObserver(measure);
		observer.observe(canvas);
		for (const overlay of overlays) observer.observe(overlay);
		measure();
		return () => observer.disconnect();
	});
</script>

<section {...rest} class={cn('map-frame', className)} data-slot="map-frame" aria-label={label}>
	<div class="map-content">
		<div class="map-stage" bind:this={stage} data-slot="map-stage">
			{@render children(viewport)}
			{#if legend && legendLabel}
				<div class="legend-dock">
					<button
						class="legend-trigger"
						type="button"
						bind:this={legendButton}
						aria-label={legendLabel}
						aria-expanded={legendOpen}
						aria-controls={legendId}
						onclick={() => (legendOpen = !legendOpen)}
						onkeydown={closeLegendOnEscape}
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path d="M3 5h2m3 0h9M3 10h2m3 0h9M3 15h2m3 0h9" />
						</svg>
					</button>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (the named panel scrolls and Escape returns focus to its trigger) -->
					<div
						class="legend-panel"
						id={legendId}
						bind:this={legendPanel}
						role="region"
						aria-label={legendLabel}
						tabindex="0"
						data-lenis-prevent
						hidden={!legendOpen || !compactLegend}
						onkeydown={closeLegendOnEscape}
					>
						{#if compactLegend}{@render legend()}{/if}
					</div>
				</div>
			{/if}
		</div>
		{#if panel || (legend && !compactLegend)}
			<div class="map-left" bind:this={left} data-slot="map-overlays" data-lenis-prevent>
				{#if panel}
					<Card edge="neutral" textSize="inherit" class="gap-2 p-3">
						{@render panel()}
					</Card>
				{/if}
				{#if legend && !compactLegend}
					{#if legendLabel}
						<div class="legend-desktop">{@render legend()}</div>
					{:else}
						{@render legend()}
					{/if}
				{/if}
			</div>
		{/if}
		{#if details}
			<aside class="map-details" bind:this={right} aria-label={details.label} data-slot="map-details" data-lenis-prevent>
				{@render details.content()}
			</aside>
		{/if}
	</div>
</section>

<style>
	.map-frame {
		container: map-frame / inline-size;
		display: flex;
		flex: 1;
		min-inline-size: 0;
	}
	.map-content {
		position: relative;
		isolation: isolate;
		display: flex;
		flex: 1;
		flex-direction: column;
		min-inline-size: 0;
	}
	.map-stage {
		position: relative;
		flex: 1 0 auto;
		min-block-size: 20rem;
		min-inline-size: 0;
		background: var(--background);
	}
	.map-left,
	.map-details {
		position: absolute;
		inset-block-start: 0.75rem;
		z-index: 1;
		display: grid;
		gap: 0.75rem;
		max-block-size: calc(100% - 1.5rem);
		overflow: auto;
		overscroll-behavior: contain;
	}
	.map-left {
		inset-inline-start: 0.75rem;
		inline-size: min(16rem, 28%);
	}
	.map-details {
		inset-inline-end: 0.75rem;
		inline-size: min(20rem, 31%);
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		overflow-wrap: anywhere;
	}
	.legend-dock { display: none; }
	.legend-trigger,
	.legend-panel { pointer-events: auto; }
	.legend-trigger {
		display: grid;
		flex: none;
		place-items: center;
		inline-size: var(--size-tap-min);
		block-size: var(--size-tap-min);
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		color: var(--foreground);
	}
	.legend-panel {
		inline-size: min(23rem, 100%);
		min-block-size: 0;
		overflow: auto;
		overscroll-behavior: contain;
		border-radius: var(--radius-lg);
	}
	.legend-trigger:focus-visible,
	.legend-panel:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
	@container map-frame (inline-size < 64rem) {
		.legend-desktop { display: none; }
		.legend-dock {
			position: absolute;
			z-index: 2;
			inset: 0.75rem;
			inset-block-end: var(--floating-pill-clearance, 5rem);
			display: flex;
			flex-direction: column-reverse;
			align-items: flex-end;
			gap: 0.5rem;
			pointer-events: none;
		}
	}
	@container map-frame (inline-size < 48rem) {
		.map-left,
		.map-details {
			position: static;
			inline-size: auto;
			max-block-size: none;
			margin-block-start: 0.75rem;
			overflow: visible;
		}
	}
</style>
