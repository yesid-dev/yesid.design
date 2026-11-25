<script lang="ts" module>
	export interface HourGridCell {
		text: string;
		level: 0 | 1 | 2 | 3 | 4 | null;
		state?: 'few' | 'none' | 'unmeasured';
		name: string;
	}

	export interface HourGridProps {
		label: string;
		columns: readonly { id: string; label: string }[];
		rows: readonly { id: string; label: string; cells: readonly HourGridCell[] }[];
		scale: { label: string; steps: readonly string[] };
		stateLabels: { few: string; none: string; unmeasured: string };
	}
</script>

<script lang="ts">
	let { label, columns, rows, scale, stateLabels }: HourGridProps = $props();
	const captionId = $props.id();
	const scaleId = `${captionId}-scale`;
	const states = ['few', 'none', 'unmeasured'] as const;
	const hasScaleLabel = $derived(scale.label.trim().length > 0);
	const scaleSteps = $derived(scale.steps.flatMap((label, level) => label.trim() ? [{ label, level }] : []));
	const cellState = (cell: HourGridCell | undefined) =>
		cell?.state ?? (cell?.level == null ? 'unmeasured' : undefined);
	const visibleStates = $derived.by(() => {
		const present = new Set<NonNullable<HourGridCell['state']>>();
		for (const row of rows) {
			for (let index = 0; index < columns.length; index++) {
				const state = cellState(row.cells[index]);
				if (state) present.add(state);
			}
		}
		return states.filter((state) => present.has(state) && stateLabels[state].trim());
	});
</script>

<div class="hour-grid" data-slot="hour-grid">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls horizontally at narrow widths) -->
	<div class="scroll" role="region" aria-labelledby={captionId} tabindex="0" data-lenis-prevent>
		<table>
			<caption id={captionId} class="sr-only">{label}</caption>
			<thead>
				<tr>
					<td></td>
					{#each columns as column (column.id)}
						<th scope="col">{column.label}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.id)}
					<tr>
						<th scope="row">{row.label}</th>
						{#each columns as column, index (column.id)}
							{@const cell = row.cells[index]}
							{@const state = cellState(cell)}
							<td
								aria-label={cell?.name ?? stateLabels.unmeasured}
								title={cell?.name ?? stateLabels.unmeasured}
							>
								<span class="cell swatch" aria-hidden="true" data-state={state} data-level={state ? undefined : cell?.level}>
									{cell?.text || (state ? stateLabels[state] : '')}
								</span>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if hasScaleLabel || scaleSteps.length || visibleStates.length}
		<div class="legend">
			{#if hasScaleLabel}<span id={scaleId}>{scale.label}</span>{/if}
			{#if scaleSteps.length || visibleStates.length}
				<ul role="list" aria-labelledby={hasScaleLabel ? scaleId : undefined}>
					{#each scaleSteps as step (step.level)}
						<li><span class="key swatch" data-level={step.level} aria-hidden="true"></span>{step.label}</li>
					{/each}
					{#each visibleStates as state}
						<li><span class="key swatch" data-state={state} aria-hidden="true"></span>{stateLabels[state]}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.hour-grid { min-inline-size: 0; }
	.scroll {
		overflow-x: auto;
		max-inline-size: 100%;
		min-block-size: var(--size-tap-min);
	}
	.scroll:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	table {
		inline-size: 100%;
		border-collapse: separate;
		border-spacing: 0.125rem 0.25rem;
		font-size: var(--text-small);
		text-align: center;
	}
	th {
		padding: 0.25rem;
		color: var(--muted-foreground);
		white-space: nowrap;
		font-weight: 500;
	}
	thead th, td { padding-inline: 0; }
	tbody th {
		position: sticky;
		z-index: 1;
		inset-inline-start: 0;
		background: var(--background);
		text-align: start;
	}
	:global([data-slot='card']) tbody th { background: var(--surface-2); }
	.cell {
		display: grid;
		min-block-size: 1.75em;
		min-inline-size: 2em;
		place-items: center;
		padding-inline: 0.25em;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.cell[data-state='few'] { padding-inline: 0.125em; }
	.swatch {
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background-color: var(--heat-fill, transparent);
		color: var(--heat-ink, var(--foreground));
	}
	[data-level='0'] { --heat-fill: var(--dataviz-heatmap-neutral-0); --heat-ink: var(--dataviz-heatmap-neutral-ink-0); }
	[data-level='1'] { --heat-fill: var(--dataviz-heatmap-neutral-1); --heat-ink: var(--dataviz-heatmap-neutral-ink-1); }
	[data-level='2'] { --heat-fill: var(--dataviz-heatmap-neutral-2); --heat-ink: var(--dataviz-heatmap-neutral-ink-2); }
	[data-level='3'] { --heat-fill: var(--dataviz-heatmap-neutral-3); --heat-ink: var(--dataviz-heatmap-neutral-ink-3); }
	[data-level='4'] { --heat-fill: var(--dataviz-heatmap-neutral-4); --heat-ink: var(--dataviz-heatmap-neutral-ink-4); }
	[data-state] { border-color: var(--muted-foreground); color: var(--muted-foreground); }
	[data-state='few'] {
		--hatch-ink: color-mix(in srgb, var(--muted-foreground) 33%, transparent);
		color: var(--foreground);
		background-image: repeating-linear-gradient(
			135deg,
			transparent 0 4px,
			var(--hatch-ink) 4px 5px
		);
	}
	[data-state='unmeasured'] { border-style: dashed; }
	.legend, .legend ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem 0.875rem;
	}
	.legend {
		align-items: baseline;
		margin: 0.75rem 0 0;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}
	.legend ul {
		flex: 1 1 20rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.legend li { display: flex; align-items: baseline; gap: 0.375em; overflow-wrap: anywhere; }
	.key { flex: none; inline-size: 0.8em; block-size: 0.8em; }
	@media (forced-colors: active) {
		[data-level], [data-state] { border-color: CanvasText; }
		[data-state='few'] {
			--hatch-ink: color-mix(in srgb, CanvasText 45%, Canvas);
			forced-color-adjust: none;
			background-color: Canvas;
			color: CanvasText;
		}
	}
</style>
