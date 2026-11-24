<script lang="ts" module>
	export interface ShowMoreLabels {
		showing: (shown: number, total: number) => string;
		more: (count: number) => string;
	}

	export interface ShowMoreProps {
		shown: number;
		total: number;
		pageSize: number;
		labels: ShowMoreLabels;
		onMore: (count: number) => void;
	}
</script>

<script lang="ts">
	import Button from '../primitives/button/button.svelte';

	let { shown, total, pageSize, labels, onMore }: ShowMoreProps = $props();
	const remaining = $derived(Math.min(pageSize, total - shown));
</script>

<div class="show-more" data-slot="show-more">
	<p role="status" aria-atomic="true">{labels.showing(shown, total)}</p>
	{#if Number.isFinite(remaining) && remaining > 0}
		<Button variant="outline" wrap onclick={() => onMore(remaining)}>{labels.more(remaining)}</Button>
	{/if}
</div>

<style>
	.show-more {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		padding-block: 0.5rem;
	}
	p {
		margin: 0;
		min-inline-size: 0;
		color: var(--muted-foreground);
		font-size: var(--text-small);
		overflow-wrap: anywhere;
	}
</style>
