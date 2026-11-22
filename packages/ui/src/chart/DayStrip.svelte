<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export interface DayStripCell {
		id: string;
		label: string;
		/** Use a full localized date or period if the visible label is abbreviated. */
		dateLabel?: string;
		report: { value: string; fraction: number } | null;
	}

	export interface DayStripProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		label: string;
		cells: readonly DayStripCell[];
		reportedLabel: string;
		missingLabel: string;
	}

	function height(fraction: number): string {
		return `${Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) * 100 : 0}%`;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';

	let { label, cells, reportedLabel, missingLabel, class: className, ...rest }: DayStripProps = $props();
</script>

<div {...rest} class={cn('day-strip', className)} data-slot="day-strip">
	<ol class="day-strip-cells" role="list" aria-label={label}>
		{#each cells as { id, label: day, dateLabel, report } (id)}
			<li data-slot="day-strip-cell" data-reported={report !== null}>
				<span class="day-strip-date" aria-hidden={dateLabel ? 'true' : undefined}>{day}</span>
				{#if dateLabel}<span class="sr-only">{dateLabel}</span>{/if}
				<span class="day-strip-track" aria-hidden="true">
					{#if report}<span class="day-strip-bar" style:block-size={height(report.fraction)}></span>{/if}
				</span>
				{#if report}
					<span class="day-strip-value">{report.value}</span>
				{:else}
					<span aria-hidden="true">○</span><span class="sr-only">{missingLabel}</span>
				{/if}
			</li>
		{/each}
	</ol>
	<p class="day-strip-key">
		<span><i class="key-reported" aria-hidden="true"></i>{reportedLabel}</span>
		<span><i aria-hidden="true">○</i>{missingLabel}</span>
	</p>
</div>

<style>
	.day-strip {
		min-inline-size: 0;
		--day-strip-ink: var(--foreground);
	}
	.day-strip-cells {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, max(2.3rem, calc((100% - 1.5rem) / 7))), 1fr));
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.day-strip-cells > li {
		display: grid;
		grid-template-rows: auto 3rem auto;
		gap: 0.25rem;
		justify-items: center;
		min-inline-size: 0;
		padding: 0.375rem 0.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		text-align: center;
		overflow-wrap: anywhere;
	}
	.day-strip-date {
		color: var(--muted-foreground);
		font-size: var(--text-caption);
	}
	.day-strip-track {
		display: flex;
		align-items: end;
		inline-size: min(72%, 3rem);
	}
	[data-reported='false'] > .day-strip-track {
		border: 1px dashed var(--muted-foreground);
		border-radius: var(--radius-sm);
		background: repeating-linear-gradient(
			135deg,
			transparent 0 5px,
			color-mix(in srgb, var(--muted-foreground) 40%, transparent) 5px 6px
		);
	}
	.day-strip-bar,
	.key-reported {
		inline-size: 100%;
		background: var(--day-strip-ink);
	}
	.day-strip-value {
		font-size: var(--text-small);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.day-strip-key {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		margin-block: 0.875rem 0;
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}
	.day-strip-key span {
		display: inline-flex;
		align-items: baseline;
		gap: 0.375em;
	}
	.day-strip-key i {
		flex: none;
		inline-size: 0.8em;
		block-size: 0.8em;
		font-style: normal;
		text-align: center;
	}
	@media (forced-colors: active) {
		.day-strip-bar, .key-reported {
			forced-color-adjust: none;
			background: CanvasText;
		}
	}
</style>
