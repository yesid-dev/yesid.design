<script lang="ts" module>
	export interface ChartLegendItem {
		label: string;
		kind: 'bar' | 'line' | 'reference';
	}

	export interface ChartLegendProps {
		label: string;
		items: readonly ChartLegendItem[];
	}
</script>

<script lang="ts">
	let { label, items }: ChartLegendProps = $props();
</script>

{#if items.length}
	<ul data-slot="chart-legend" role="list" aria-label={label}>
		{#each items as item}
			<li><span aria-hidden="true" data-kind={item.kind}></span>{item.label}</li>
		{/each}
	</ul>
{/if}

<style>
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	li {
		display: flex;
		align-items: baseline;
		gap: 0.4em;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	[data-kind] {
		flex: none;
		inline-size: 1em;
		border-block-end: 2px solid var(--foreground);
	}
	[data-kind='bar'] { border-block-end-width: 0.6em; }
	[data-kind='reference'] { border-block-end-style: dashed; }
</style>
