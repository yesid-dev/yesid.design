<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ChartPlot } from './geometry.js';

	export interface ChartFrameProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		label: string;
		xDomain: readonly [number, number];
		yDomain: readonly [number, number];
		children: Snippet<[ChartPlot]>;
		legend?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import { scale } from './geometry.js';

	let { label, xDomain, yDomain, children, legend, class: className, ...rest }: ChartFrameProps =
		$props();

	const componentId = $props.id();
	const clipId = `${componentId}-chart-plot`;
	let measuredWidth = $state(0);
	let measuredHeight = $state(0);
	let measuredUnit = $state(0);
	const width = $derived(measuredWidth || 480);
	const height = $derived(measuredHeight || 224);
	const unit = $derived(measuredUnit || 16);

	const plot: ChartPlot = $derived.by(() => {
		const left = Math.min(3.75 * unit, 0.36 * width);
		const right = Math.max(left + 1, width - unit * 0.5);
		const top = unit * 0.75;
		const bottom = Math.max(top + 1, height - unit * 1.75);
		return {
			x: scale(xDomain, left, right),
			y: scale(yDomain, bottom, top),
			left, right, top, bottom, unit, clipId,
		};
	});
</script>

<figure {...rest} class={cn('chart-frame', className)} data-slot="chart-frame" aria-label={label}>
	<div class="chart-area" bind:clientWidth={measuredWidth} bind:clientHeight={measuredHeight} data-slot="chart-area">
		<span class="chart-unit" bind:clientWidth={measuredUnit} aria-hidden="true"></span>
		<svg viewBox="0 0 {width} {height}" aria-hidden="true" focusable="false">
			<defs>
				<clipPath id={clipId}>
					<rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} />
				</clipPath>
			</defs>
			{@render children(plot)}
		</svg>
	</div>
	{@render legend?.()}
</figure>

<style>
	.chart-frame {
		display: flex;
		flex: 1 0 auto;
		flex-direction: column;
		gap: 0.5rem;
		min-inline-size: 0;
		margin: 0;
	}
	.chart-area {
		position: relative;
		flex: 1 0 auto;
		min-block-size: 14rem;
		min-inline-size: 0;
	}
	.chart-unit {
		position: absolute;
		inline-size: 1rem;
	}
	.chart-area > svg {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
	}
</style>
