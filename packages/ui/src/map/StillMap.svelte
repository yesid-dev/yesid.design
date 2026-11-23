<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface StillMapProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		label: string;
		/** The schematic's x, y, width and height. */
		viewBox: readonly [number, number, number, number];
		children: Snippet;
		overlay?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	let { label, viewBox, children, overlay, class: className, ...rest }: StillMapProps = $props();
</script>

<figure {...rest} class={cn('still-map', className)} data-slot="still-map" aria-label={label}>
	<svg viewBox={viewBox.join(' ')} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
		{@render children()}
	</svg>
	{#if overlay}<div class="still-map-overlay">{@render overlay()}</div>{/if}
</figure>

<style>
	.still-map {
		position: relative;
		flex: 1 1 auto;
		min-inline-size: 0;
		min-block-size: 13rem;
		margin: 0;
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--background);
	}
	svg {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
	}
	.still-map-overlay {
		position: absolute;
		inset-block-start: 0.5rem;
		inset-inline-start: 0.5rem;
		max-inline-size: calc(100% - 1rem);
	}
</style>
