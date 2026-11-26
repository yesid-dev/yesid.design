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
		/** Which horizontal edge starts in view when the grid overflows. Defaults to `'start'`. */
		initialScroll?: 'start' | 'end';
	}
</script>

<script lang="ts">
	import {
		attachScrollEdges,
		EMPTY_SCROLL_EDGES,
		type ScrollEdgeState,
	} from '../internal/scroll-edges.js';

	let {
		label,
		columns,
		rows,
		scale,
		stateLabels,
		initialScroll = 'start',
	}: HourGridProps = $props();

	let scrollElement = $state<HTMLDivElement | null>(null);
	let scrollEdges = $state<ScrollEdgeState>(EMPTY_SCROLL_EDGES);
	let stickyOffset = $state(0);
	let handleScroll = $state<(() => void) | undefined>(undefined);

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

	function measureStickyOffset(element: HTMLElement): void {
		const header = element.querySelector('tbody th');
		if (!header || element.clientWidth <= 0) {
			stickyOffset = 0;
			return;
		}
		const width = Math.round(header.getBoundingClientRect().width);
		stickyOffset = Math.min(Math.max(0, width), Math.floor(element.clientWidth * 0.5));
	}

	$effect(() => {
		const element = scrollElement;
		if (!element) {
			scrollEdges = EMPTY_SCROLL_EDGES;
			stickyOffset = 0;
			handleScroll = undefined;
			return;
		}
		const controller = attachScrollEdges(element, {
			initialScroll,
			onUpdate(next) {
				scrollEdges = next;
			},
			onResize() {
				measureStickyOffset(element);
			},
		});
		handleScroll = controller.onScroll;
		return () => {
			controller.destroy();
			handleScroll = undefined;
		};
	});
</script>

<div class="hour-grid" data-slot="hour-grid">
	<div
		class="scroll-wrap"
		data-scroll-start={scrollEdges.start || undefined}
		data-scroll-end={scrollEdges.end || undefined}
		style:--scroll-fade-start-offset={`${stickyOffset}px`}
	>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls horizontally at narrow widths) -->
		<div
			bind:this={scrollElement}
			class="scroll"
			role="region"
			aria-labelledby={captionId}
			tabindex="0"
			data-lenis-prevent
			data-initial-scroll={initialScroll === 'end' ? 'end' : undefined}
			onscroll={() => handleScroll?.()}
		>
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
		<span class="scroll-fade scroll-fade-start" data-slot="scroll-fade-start" aria-hidden="true"></span>
		<span class="scroll-fade scroll-fade-end" data-slot="scroll-fade-end" aria-hidden="true"></span>
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
	.hour-grid {
		--scroll-fade-surface: var(--background);
		min-inline-size: 0;
	}
	:global([data-slot='card']) .hour-grid {
		--scroll-fade-surface: var(--surface-2);
	}
	.scroll-wrap {
		position: relative;
		min-inline-size: 0;
		max-inline-size: 100%;
	}
	.scroll {
		overflow-x: auto;
		max-inline-size: 100%;
		min-block-size: var(--size-tap-min);
	}
	.scroll[data-initial-scroll='end']:not([data-scroll-hydrated]) {
		display: flex;
		flex-direction: row-reverse;
	}
	.scroll[data-initial-scroll='end']:not([data-scroll-hydrated]) > table {
		flex: 0 0 auto;
		min-inline-size: 100%;
		inline-size: auto;
	}
	.scroll:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	.scroll-fade {
		display: none;
		position: absolute;
		inset-block: 0;
		z-index: 2;
		box-sizing: border-box;
		pointer-events: none;
	}
	.scroll-wrap[data-scroll-start='true'] > .scroll-fade-start {
		display: block;
		inset-inline-start: var(--scroll-fade-start-offset, 0px);
		inline-size: min(2rem, 18%, max(0px, calc(100% - var(--scroll-fade-start-offset, 0px))));
		border-inline-start: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
		background-image:
			linear-gradient(
				to right,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to right,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}
	.scroll-wrap[data-scroll-end='true'] > .scroll-fade-end {
		display: block;
		inset-inline-end: 0;
		inline-size: min(2rem, 18%);
		border-inline-end: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
		background-image:
			linear-gradient(
				to left,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to left,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}
	.scroll-wrap[data-scroll-start='true']:dir(rtl) > .scroll-fade-start {
		background-image:
			linear-gradient(
				to left,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to left,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}
	.scroll-wrap[data-scroll-end='true']:dir(rtl) > .scroll-fade-end {
		background-image:
			linear-gradient(
				to right,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to right,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
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
	.cell[data-state='few'] { padding-inline: 0; }
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
		.scroll-fade { display: none !important; }
		[data-level], [data-state] { border-color: CanvasText; }
		[data-state='few'] {
			--hatch-ink: color-mix(in srgb, CanvasText 45%, Canvas);
			forced-color-adjust: none;
			background-color: Canvas;
			color: CanvasText;
		}
	}
</style>
