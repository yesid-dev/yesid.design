<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface MapLegendItem {
		label: string;
		symbol: Snippet;
	}

	export interface MapLegendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
		title: string;
		items: readonly MapLegendItem[];
	}
</script>

<script lang="ts">
	import { Card } from '../primitives/card/index.js';
	import { cn } from '../cn/index.js';
	let { title, items, class: className, ...rest }: MapLegendProps = $props();
</script>

<Card {...rest} edge="neutral" textSize="inherit" class={cn('gap-2 p-3', className)}>
	<p class="map-legend-title">{title}</p>
	<ul role="list" aria-label={title} data-slot="map-legend">
		{#each items as { label, symbol }}
			<li><span class="map-legend-symbol" aria-hidden="true">{@render symbol()}</span>{label}</li>
		{/each}
	</ul>
</Card>

<style>
	.map-legend-title {
		font-size: var(--text-control);
		font-weight: 600;
	}
	ul {
		display: grid;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		overflow-wrap: anywhere;
	}
	.map-legend-symbol {
		display: inline-grid;
		flex: none;
		place-items: center;
		inline-size: 1.5em;
	}
</style>
