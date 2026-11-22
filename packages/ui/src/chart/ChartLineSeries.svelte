<script lang="ts" module>
	import type { ChartPlot, ChartPoint } from './geometry.js';

	export interface ChartLineSeriesProps {
		plot: ChartPlot;
		points: readonly ChartPoint[];
		/** Distinguishes a comparison line by dashes and muted ink. */
		reference?: boolean;
	}

	function segments(points: readonly ChartPoint[], plot: ChartPlot) {
		const runs: string[][] = [];
		const markers: { x: number; y: number }[] = [];
		let current: string[] | undefined;
		for (const point of points) {
			if (point.y === null || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
				current = undefined;
				continue;
			}
			if (!current) {
				current = [];
				runs.push(current);
			}
			const x = plot.x(point.x);
			const y = plot.y(point.y);
			current.push(`${x},${y}`);
			markers.push({ x, y });
		}
		return { runs, markers };
	}
</script>

<script lang="ts">
	let { plot, points, reference = false }: ChartLineSeriesProps = $props();
	const series = $derived(segments(points, plot));
</script>

<g data-slot="chart-line-series" data-reference={reference || undefined} clip-path="url(#{plot.clipId})">
	{#each series.runs as run}
		<polyline points={run.join(' ')} />
	{/each}
	{#if !reference}
		{#each series.markers as point}
			<circle cx={point.x} cy={point.y} r="2.5" />
		{/each}
	{/if}
</g>

<style>
	polyline {
		fill: none;
		stroke: var(--foreground);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}
	circle { fill: var(--foreground); }
	[data-reference] > polyline {
		stroke: var(--muted-foreground);
		stroke-dasharray: 5 4;
	}
	@media (forced-colors: active) {
		g polyline { stroke: CanvasText; }
		circle { fill: CanvasText; }
	}
</style>
