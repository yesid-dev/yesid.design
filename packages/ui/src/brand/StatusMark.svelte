<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type StatusMarkStatus = 'early' | 'on_time' | 'late' | 'severe' | 'unknown';

	export interface StatusMarkProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
		status: StatusMarkStatus;
		label: string;
		detail?: string;
	}

</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import { statusGlyph } from './status-glyph.js';

	let { status, label, detail, class: className, ...rest }: StatusMarkProps = $props();
	const glyph = $derived(statusGlyph(status));
</script>

<span {...rest} class={cn('status-mark', className)} data-slot="status-mark" data-status={status}>
	<svg class="status-glyph" viewBox={glyph.viewBox} aria-hidden="true" focusable="false">
		<path d={glyph.path} fill="currentColor" fill-rule="evenodd" />
	</svg>
	<span class="status-word">{label}</span>
	{#if detail}<span class="status-detail">{detail}</span>{/if}
</span>

<style>
	.status-mark {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 0.4em;
		max-inline-size: 100%;
		color: var(--foreground);
		overflow-wrap: anywhere;
	}
	.status-glyph {
		flex: none;
		inline-size: 1em;
		block-size: 1em;
		/* A baseline-aligned SVG sits entirely above the baseline. Centre it on the capitals. */
		position: relative;
		inset-block-start: calc(0.5em - 0.5cap);
		color: var(--dataviz-status-unknown);
	}
	[data-status='early'] > .status-glyph { color: var(--dataviz-status-early); }
	[data-status='on_time'] > .status-glyph { color: var(--dataviz-status-on-time); }
	[data-status='late'] > .status-glyph { color: var(--dataviz-status-late); }
	[data-status='severe'] > .status-glyph { color: var(--dataviz-status-severe); }
	.status-word { font-weight: 600; }
	.status-detail {
		color: var(--muted-foreground);
		font-variant-numeric: tabular-nums;
	}

	@media (forced-colors: active) {
		.status-mark > .status-glyph { color: CanvasText; }
	}
</style>
