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
	const fraction = (value: number) =>
		Number.isFinite(value) && Number.isFinite(max) && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
</script>

<div class="stop-ladder" data-slot="stop-ladder">
	<div class="columns">
		<span class="column-stop" aria-hidden="true">{columns.stop}</span>
		{#if threshold}<span class="threshold-label">{threshold.label}</span>{/if}
		<span class="column-value" aria-hidden="true">{columns.value}</span>
	</div>
	<ol role="list" aria-label={label} style:--stop-count={Math.max(1, stops.length)}
		style:--stop-threshold={threshold && stops.length ? fraction(threshold.value) : undefined}
		data-threshold={!!(threshold && stops.length) || undefined}>
		{#each stops as stop, index (stop.id)}
			<li
				data-timing-point={stop.timingPoint || undefined}
				data-highlighted={range && index >= range.start && index <= range.end ? true : undefined}
			>
				<span class="rail" aria-hidden="true"><span class="point"></span></span>
				<div class="stop">
					{#if stop.href}<a class="stop-name" href={stop.href}>{stop.name}</a>{:else}<span class="stop-name">{stop.name}</span>{/if}
					{#if stop.code}<span class="code">{stop.code}</span>{/if}
					{#if range?.start === index}<span class="highlight-label">{range.label}</span>{/if}
				</div>
				{#if stop.value !== null}
					<span class="track" aria-hidden="true">
						<span class="bar" style:inline-size={`${100 * fraction(stop.value)}%`}></span>
					</span>
				{/if}
				<span class="reading">{stop.value === null ? stop.state ?? stop.valueLabel : stop.valueLabel}</span>
			</li>
		{/each}
	</ol>
</div>

<style>
	.stop-ladder {
		--stop-indent: 1.75rem;
		--stop-axis: calc(var(--size-tap-min) / 2);
		container-type: inline-size;
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(0, 2fr) fit-content(25%);
		column-gap: 1rem;
		min-inline-size: 0;
		overflow-wrap: break-word;
		word-break: normal;
	}
	.columns, ol, li {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
	}
	.columns {
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	.column-stop { grid-column: 1; padding-inline-start: var(--stop-indent); }
	.threshold-label { grid-column: 2; text-align: center; }
	.column-value { grid-column: 3; text-align: end; }
	.column-value, .reading {
		/* Let the value track grow for whole words, with a limit for unusually long values. */
		max-inline-size: 50cqi;
	}
	ol {
		position: relative;
		grid-template-rows: repeat(var(--stop-count), auto);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	ol[data-threshold]::after {
		content: '';
		position: absolute;
		grid-area: 1 / 2 / -1 / 3;
		inset-block: 0;
		inset-inline-start: calc(100% * var(--stop-threshold));
		border-inline-start: 1px solid var(--muted-foreground);
		pointer-events: none;
	}
	li {
		position: relative;
		align-items: baseline;
	}
	[data-highlighted] { background-color: var(--muted); }
	.rail {
		position: absolute;
		inset-block: 0;
		inset-inline-start: 0.69rem;
		border-inline-start: 2px solid var(--border);
	}
	li:first-child > .rail { inset-block-start: var(--stop-axis); }
	li:last-child > .rail { inset-block-end: auto; block-size: var(--stop-axis); }
	li:only-child > .rail { block-size: 0; }
	.point {
		position: absolute;
		inset-block-start: var(--stop-axis);
		inset-inline-start: -0.3rem;
		translate: 0 -50%;
		inline-size: 0.5rem;
		block-size: 0.5rem;
		border: 2px solid var(--muted-foreground);
		border-radius: 50%;
		background: var(--background);
	}
	li:first-child .point { inset-block-start: 0; }
	[data-timing-point] .point { scale: 1.45; }
	.stop {
		grid-area: 1 / 1;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.5rem;
		min-inline-size: 0;
		padding-inline-start: var(--stop-indent);
	}
	.stop-name {
		display: block;
		align-content: center;
		min-block-size: var(--size-tap-min);
		max-inline-size: 100%;
	}
	.column-stop, .threshold-label, .stop-name, .code, .highlight-label {
		min-inline-size: 0;
	}
	a.stop-name {
		min-inline-size: var(--size-tap-min);
		color: var(--primary);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}
	a.stop-name:hover { text-decoration-thickness: 2px; }
	.code,
	.highlight-label {
		display: block;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	.code { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
	.highlight-label { flex-basis: 100%; padding-block-end: 0.5rem; }
	.reading {
		grid-area: 1 / 3;
		display: block;
		align-content: center;
		min-block-size: var(--size-tap-min);
		text-align: end;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.track {
		grid-area: 1 / 2;
		align-self: start;
		display: block;
		block-size: 0.375rem;
		margin-block-start: calc(var(--stop-axis) - 0.1875rem);
	}
	.bar {
		display: block;
		block-size: 100%;
		border-radius: var(--radius-sm);
		background: var(--foreground);
	}
	@container (width < 30rem) {
		/* Reclaim label space at large text sizes while keeping clearance for the rail. */
		.columns, ol { --stop-indent: clamp(1.25rem, 14cqi, 1.75rem); }
		.columns { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.25rem 0.5rem; }
		.threshold-label { order: 1; flex-basis: 100%; text-align: start; padding-inline-start: var(--stop-indent); }
		ol { display: block; }
		ol[data-threshold]::after {
			inset-inline-start: calc(var(--stop-indent) + (100% - var(--stop-indent)) * var(--stop-threshold));
		}
		li {
			--stop-column-min: calc(var(--stop-indent) + var(--size-tap-min));
			--stop-column-gap: min(0.5rem, 2.5cqi);
			grid-template-columns: minmax(var(--stop-column-min), 1fr) fit-content(35%);
			column-gap: var(--stop-column-gap);
		}
		.reading {
			grid-column: 2;
			/* A long reading can grow its track after reserving space for the stop link. */
			max-inline-size: min(50cqi, 100cqi - var(--stop-column-min) - var(--stop-column-gap));
		}
		.track {
			grid-area: 2 / 1 / auto / -1;
			margin-block: 0 0.5rem;
			margin-inline-start: var(--stop-indent);
		}
	}
	@media (forced-colors: active) {
		[data-highlighted] { outline: 1px dashed CanvasText; outline-offset: -1px; }
		.bar { forced-color-adjust: none; background: CanvasText; }
	}
</style>
