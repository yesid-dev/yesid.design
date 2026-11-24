<script lang="ts" module>
	export interface RangeMarkProps {
		low: number;
		high: number;
		value: number;
		domain: readonly [number, number];
		reference?: { value: number; label: string };
		label: string;
		caption?: string;
	}
</script>

<script lang="ts">
	import { scale } from './geometry.js';

	let { low, high, value, domain, reference, label, caption }: RangeMarkProps = $props();
	const id = $props.id();
	const toPercent = $derived(scale(domain, 0, 100));
	const position = (point: number) => `${Math.max(0, Math.min(100, toPercent(point)))}%`;
</script>

<div class="range-mark" data-slot="range-mark">
	<div class="mark" role="img" aria-label={label} aria-describedby={reference ? id : undefined} title={reference?.label}>
		<span class="track" aria-hidden="true">
			<span class="interval" style:inset-inline-start={position(low)} style:inset-inline-end={`calc(100% - ${position(high)})`}></span>
			{#if reference}
				<span class="reference" style:inset-inline-start={position(reference.value)}></span>
			{/if}
			<span class="estimate" style:inset-inline-start={position(value)}></span>
		</span>
	</div>
	{#if reference}<span class="sr-only" {id}>{reference.label}</span>{/if}
	{#if caption}<span class="caption">{caption}</span>{/if}
</div>

<style>
	.range-mark { min-inline-size: min(100%, 8rem); }
	.mark {
		display: flex;
		align-items: center;
		box-sizing: border-box;
		inline-size: 100%;
		block-size: 1lh;
		padding-inline: 0.32em;
	}
	.track {
		position: relative;
		inline-size: 100%;
		border-block-start: 1px solid var(--muted-foreground);
	}
	.interval,
	.estimate,
	.reference {
		position: absolute;
		inset-block-start: 0;
		translate: 0 -50%;
	}
	.interval {
		min-inline-size: 2px;
		border-block-start: 0.22em solid currentColor;
		border-radius: var(--radius-pill);
	}
	.estimate {
		inline-size: 0.58em;
		aspect-ratio: 1;
		margin-inline-start: -0.29em;
		border-radius: 50%;
		background: currentColor;
	}
	.reference {
		block-size: 0.9em;
		border-inline-start: 2px dotted var(--muted-foreground);
	}
	.caption {
		display: block;
		color: var(--muted-foreground);
		font-size: var(--text-small);
		overflow-wrap: anywhere;
	}
	@media (forced-colors: active) {
		.estimate { forced-color-adjust: none; background: CanvasText; }
	}
</style>
