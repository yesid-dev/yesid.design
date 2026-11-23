<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { MapViewport } from './placement.js';

	export interface MapFrameProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		label: string;
		children: Snippet<[MapViewport]>;
		panel?: Snippet;
		legend?: Snippet;
		details?: { label: string; content: Snippet };
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import { Card } from '../primitives/card/index.js';
	import type { MapRect } from './placement.js';

	let { label, children, panel, legend, details, class: className, ...rest }: MapFrameProps = $props();
	let stage = $state<HTMLDivElement>();
	let left = $state<HTMLDivElement>();
	let right = $state<HTMLElement>();
	let viewport = $state<MapViewport>({ width: 0, height: 0, exclusions: [] });

	$effect(() => {
		if (!stage || typeof ResizeObserver === 'undefined') return;
		const canvas = stage;
		const overlays = [left, right].filter((element) => element !== undefined);

		function measure() {
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
		</div>
		{#if panel || legend}
			<div class="map-left" bind:this={left} data-slot="map-overlays" data-lenis-prevent>
				{#if panel}
					<Card edge="neutral" textSize="inherit" class="gap-2 p-3">
						{@render panel()}
					</Card>
				{/if}
				{@render legend?.()}
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
		container-type: inline-size;
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
	@container (width < 48rem) {
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
