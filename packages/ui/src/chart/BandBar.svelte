<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { StatusMarkStatus } from '../brand/StatusMark.svelte';

	export interface BandBarBand {
		id: string;
		label: string;
		share: number;
		valueLabel: string;
		detail?: string;
		status: StatusMarkStatus;
	}

	export interface BandBarProps {
		label: string;
		bands: readonly BandBarBand[];
		rows?: boolean;
		absent?: Snippet;
	}
</script>

<script lang="ts">
	import StatusMark from '../brand/StatusMark.svelte';

	let { label, bands, rows = true, absent }: BandBarProps = $props();
	const visible = $derived(bands.filter((band) => Number.isFinite(band.share) && band.share > 0));
	const maxShare = $derived(visible.reduce((largest, band) => Math.max(largest, band.share), 0));
</script>

{#if visible.length}
	<div class="band-bar" data-slot="band-bar">
		<div class="track" role="img" aria-label={label} style:--band-count={visible.length}>
			{#each visible as band (band.id)}
				<span
					aria-hidden="true"
					style:--band-share={band.share / maxShare}
					style:--band-ink={`var(--dataviz-status-${band.status.replace('_', '-')})`}
				></span>
			{/each}
		</div>
		{#if rows}
			<dl class="rows">
				{#each bands as band (band.id)}
					<div class="row">
						<dt><StatusMark status={band.status} label={band.label} detail={band.detail} /></dt>
						<dd>{band.valueLabel}</dd>
					</div>
				{/each}
			</dl>
		{/if}
	</div>
{:else}
	{@render absent?.()}
{/if}

<style>
	.band-bar { min-inline-size: 0; }
	.track {
		display: flex;
		gap: 2px;
		block-size: 0.75rem;
		overflow: hidden;
		border-radius: var(--radius-sm);
	}
	.track span {
		flex: var(--band-share) 1 0%;
		min-inline-size: min(2%, max(0px, calc((100% + 2px) / var(--band-count) - 2px)));
		background: var(--band-ink);
	}
	.rows {
		display: grid;
		gap: 0.5rem;
		margin: 0.75rem 0 0;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, max-content);
		gap: 0.75rem;
		overflow-wrap: anywhere;
	}
	dd {
		margin: 0;
		text-align: end;
		font-variant-numeric: tabular-nums;
	}
	@media (forced-colors: active) {
		.track span { forced-color-adjust: none; background: CanvasText; }
	}
</style>
