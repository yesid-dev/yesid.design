<script lang="ts" module>
	import type { ChartPlot } from './geometry.js';

	export interface ChartTick {
		value: number;
		label: string;
	}

	export interface ChartAxisProps {
		plot: ChartPlot;
		axis: 'x' | 'y';
		ticks: readonly ChartTick[];
		grid?: boolean;
	}

	/** Keep a legible gap as the label grows or the available width shrinks. */
	function xLabels(ticks: readonly ChartTick[], plot: ChartPlot): Set<ChartTick> {
		const visible = new Set<ChartTick>();
		let previousRight = -Infinity;
		for (const tick of [...ticks].sort((a, b) => plot.x(a.value) - plot.x(b.value))) {
			const right = plot.x(tick.value);
			const left = right - tick.label.length * plot.unit * 0.48;
			if (left < 0 || left < previousRight + plot.unit * 0.35) continue;
			visible.add(tick);
			previousRight = right;
		}
		return visible;
	}
</script>

<script lang="ts">
	let { plot, axis, ticks, grid }: ChartAxisProps = $props();
	const horizontal = $derived(axis === 'x');
	const scale = $derived(horizontal ? plot.x : plot.y);
	const shown = $derived(ticks.filter(({ value }) => {
		const pixel = scale(value);
		return Number.isFinite(pixel) && (horizontal
			? pixel >= plot.left && pixel <= plot.right
			: pixel >= plot.top && pixel <= plot.bottom);
	}));
	const labels = $derived(horizontal ? xLabels(shown, plot) : new Set(shown));
</script>

<g data-slot="chart-axis" data-axis={axis}>
	{#each shown as tick}
		{@const pixel = scale(tick.value)}
		{#if grid ?? !horizontal}
			<line
				x1={horizontal ? pixel : plot.left} x2={horizontal ? pixel : plot.right}
				y1={horizontal ? plot.top : pixel} y2={horizontal ? plot.bottom : pixel}
			/>
		{/if}
		{#if labels.has(tick)}
			<text
				x={horizontal ? pixel : plot.left - plot.unit * 0.4}
				y={horizontal ? plot.bottom + plot.unit * 0.65 : pixel}
				text-anchor="end"
				dominant-baseline={horizontal ? 'hanging' : 'central'}
			>{tick.label}</text>
		{/if}
	{/each}
</g>

<style>
	line { stroke: var(--border-strong); }
	text {
		fill: var(--muted-foreground);
		font-family: var(--font-mono);
		font-size: var(--text-caption);
	}
	@media (forced-colors: active) {
		line { stroke: GrayText; }
		text { fill: CanvasText; }
	}
</style>
