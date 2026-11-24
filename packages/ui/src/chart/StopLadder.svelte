<script lang="ts" module>
	export interface StopLadderStop {
		id: string;
		name: string;
		code?: string;
		href?: string;
		timingPoint?: boolean;
		value: number | null;
		valueLabel: string;
		state?: string;
	}

	export interface StopLadderProps {
		label: string;
		stops: readonly StopLadderStop[];
		max: number;
		threshold?: { value: number; label: string };
		highlight?: { fromId: string; toId: string; label: string };
		columns: { stop: string; value: string };
	}
</script>

<script lang="ts">
	let { label, stops, max, threshold, highlight, columns }: StopLadderProps = $props();
	const range = $derived.by(() => {
		if (!highlight) return undefined;
		const from = stops.findIndex((stop) => stop.id === highlight.fromId);
		const to = stops.findIndex((stop) => stop.id === highlight.toId);
		if (from < 0 || to < 0) return undefined;
		return { start: Math.min(from, to), end: Math.max(from, to), label: highlight.label };
	});
	const width = (value: number) =>
		`${Number.isFinite(value) && Number.isFinite(max) && max > 0 ? 100 * Math.min(1, Math.max(0, value / max)) : 0}%`;
</script>

<div class="stop-ladder" data-slot="stop-ladder">
	<div class="columns" aria-hidden="true"><span>{columns.stop}</span><span>{columns.value}</span></div>
	<ol role="list" aria-label={label}>
		{#each stops as stop, index (stop.id)}
			<li
				data-timing-point={stop.timingPoint || undefined}
				data-highlighted={range && index >= range.start && index <= range.end ? true : undefined}
			>
				<span class="rail" aria-hidden="true"><span class="point"></span></span>
				<div class="stop">
					{#if stop.href}<a href={stop.href}>{stop.name}</a>{:else}{stop.name}{/if}
					{#if stop.code}<span class="code">{stop.code}</span>{/if}
					{#if range?.start === index}<span class="highlight-label">{range.label}</span>{/if}
				</div>
				<div class="reading">
					<span>{stop.value === null ? stop.state ?? stop.valueLabel : stop.valueLabel}</span>
					{#if stop.value !== null}
						<span class="track" aria-hidden="true">
							<span class="bar" style:inline-size={width(stop.value)}></span>
							{#if threshold}<span class="threshold" style:inset-inline-start={width(threshold.value)}></span>{/if}
						</span>
					{/if}
				</div>
			</li>
		{/each}
	</ol>
	{#if threshold}<p class="key"><span aria-hidden="true"></span>{threshold.label}</p>{/if}
</div>

<style>
	.stop-ladder {
		container-type: inline-size;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.columns {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding-inline: 1.75rem 0.5rem;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	ol { list-style: none; margin: 0; padding: 0; }
	li {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		align-items: start;
		gap: 0.35rem 1rem;
		padding: 0.5rem 0.5rem 0.5rem 1.75rem;
	}
	[data-highlighted] { background-color: var(--muted); }
	.rail {
		position: absolute;
		inset-block: 0;
		inset-inline-start: 0.69rem;
		border-inline-start: 2px solid var(--border);
	}
	li:first-child > .rail { inset-block-start: 0.85rem; }
	li:last-child > .rail { inset-block-end: auto; block-size: 0.85rem; }
	li:only-child > .rail { block-size: 0; }
	.point {
		position: absolute;
		inset-block-start: 0.85rem;
		inset-inline-start: -0.3rem;
		inline-size: 0.5rem;
		block-size: 0.5rem;
		border: 2px solid var(--muted-foreground);
		border-radius: 50%;
		background: var(--background);
	}
	li:first-child .point { inset-block-start: 0; }
	[data-timing-point] .point { scale: 1.45; }
	.stop a {
		display: inline-flex;
		align-items: center;
		min-inline-size: var(--size-tap-min);
		min-block-size: var(--size-tap-min);
		max-inline-size: 100%;
	}
	.code,
	.highlight-label {
		display: block;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	.code { font-variant-numeric: tabular-nums; }
	.reading {
		display: grid;
		gap: 0.25rem;
		text-align: end;
		font-variant-numeric: tabular-nums;
	}
	.track {
		position: relative;
		display: block;
		block-size: 0.375rem;
	}
	.bar {
		display: block;
		block-size: 100%;
		border-radius: var(--radius-sm);
		background: var(--foreground);
	}
	.threshold,
	.key > span { border-inline-start: 2px solid var(--muted-foreground); }
	.threshold { position: absolute; inset-block: -0.125rem; }
	.key {
		display: flex;
		gap: 0.4em;
		align-items: center;
		margin: 0.75rem 0 0;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	.key > span { block-size: 0.9em; }
	@container (width < 30rem) {
		li { display: block; }
		.reading { margin-block-start: 0.25rem; text-align: start; }
	}
	@media (forced-colors: active) {
		[data-highlighted] { outline: 1px dashed CanvasText; outline-offset: -1px; }
		.bar { forced-color-adjust: none; background: CanvasText; }
	}
</style>
