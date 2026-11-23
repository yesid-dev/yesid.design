<script lang="ts" module>
	import type { ChartPlot, ChartPoint } from './geometry.js';

	export interface ChartBarSeriesProps {
		plot: ChartPlot;
		points: readonly ChartPoint[];
		/** Width of one band in the x domain. Leave space at the domain ends for the end bars. */
		bandWidth: number;
		baseline?: number;
	}
</script>

<script lang="ts">
	let { plot, points, bandWidth, baseline = 0 }: ChartBarSeriesProps = $props();
	const width = $derived(Number.isFinite(bandWidth) && bandWidth > 0
		? Math.abs(plot.x(bandWidth) - plot.x(0)) * 0.8
		: 0);
	const base = $derived(plot.y(baseline));
</script>

<g data-slot="chart-bar-series" clip-path="url(#{plot.clipId})">
	{#each points as point}
		{#if point.y !== null && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(base)}
			{@const y = plot.y(point.y)}
			<rect x={plot.x(point.x) - width / 2} y={Math.min(y, base)} {width} height={Math.abs(base - y)} />
		{/if}
	{/each}
</g>

<style>
	rect { fill: var(--foreground); }
	@media (forced-colors: active) {
		rect { fill: CanvasText; }
	}
</style>
