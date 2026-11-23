<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type StatusMarkStatus = 'early' | 'on_time' | 'late' | 'severe' | 'unknown';

	export interface StatusMarkProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
		status: StatusMarkStatus;
		label: string;
		detail?: string;
	}

	const glyphs = { early: '▼', on_time: '●', late: '▲', severe: '◆', unknown: '○' } as const;
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';

	let { status, label, detail, class: className, ...rest }: StatusMarkProps = $props();
</script>

<span {...rest} class={cn('status-mark', className)} data-slot="status-mark" data-status={status}>
	<span class="status-glyph" aria-hidden="true">{glyphs[status]}</span>
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
		color: var(--dataviz-status-unknown);
		font-family: var(--font-mono);
		font-variant-emoji: text;
		line-height: 1;
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
