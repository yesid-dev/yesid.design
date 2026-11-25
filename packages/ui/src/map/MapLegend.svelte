<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface MapLegendItem {
		label: string;
		symbol: Snippet;
		detail?: string;
	}

	export interface MapLegendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
		title: string;
		items?: readonly MapLegendItem[];
		groups?: readonly { title: string; items: readonly MapLegendItem[] }[];
		scale?: {
			title: string;
			steps: readonly { label: string; swatch: string }[];
			states?: readonly MapLegendItem[];
		};
		collapsible?: boolean;
		open?: boolean;
		persistKey?: string;
	}
</script>

<script lang="ts">
	import { Card } from '../primitives/card/index.js';
	import { cn } from '../cn/index.js';
	let {
		title, items = [], groups = [], scale, collapsible = false, open = $bindable(true),
		persistKey, class: className, ...rest
	}: MapLegendProps = $props();
	const contentId = $props.id();

	$effect(() => {
		if (!collapsible || !persistKey) return;
		try {
			const saved = localStorage.getItem(persistKey);
			if (saved === 'true' || saved === 'false') open = saved === 'true';
		} catch {
			// The current disclosure state remains usable when storage is unavailable.
		}
	});

	function toggle(): void {
		open = !open;
		if (!persistKey) return;
		try { localStorage.setItem(persistKey, String(open)); } catch { /* The in-memory state still applies. */ }
	}
</script>

{#snippet legendRows(groupTitle: string, groupItems: readonly MapLegendItem[])}
	<ul class="items" role="list" aria-label={groupTitle} data-slot="map-legend">
		{#each groupItems as { label, symbol, detail }}
			<li>
				<span class="map-legend-symbol" aria-hidden="true">{@render symbol()}</span>
				<span>
					{label}
					{#if detail}<span class="detail">{detail}</span>{/if}
				</span>
			</li>
		{/each}
	</ul>
{/snippet}

<Card {...rest} edge="neutral" textSize="inherit" class={cn('gap-2 p-3', className)}>
	{#if collapsible}
		<button type="button" class="map-legend-title legend-toggle" aria-controls={contentId} aria-expanded={open} onclick={toggle}>
			{title}<span class="chevron" aria-hidden="true"></span>
		</button>
	{:else}
		<p class="map-legend-title">{title}</p>
	{/if}
	<div id={contentId} hidden={collapsible && !open}>
		{#if items.length}{@render legendRows(title, items)}{/if}
		{#each groups as group}
			<p class="group-title">{group.title}</p>
			{@render legendRows(group.title, group.items)}
		{/each}
		{#if scale}
			<p class="group-title">{scale.title}</p>
			{#if scale.steps.length}
				<ol class="ramp" role="list" aria-label={scale.title} style:--legend-steps={scale.steps.length}>
					{#each scale.steps as step}
						<li><span class="step" style:background-color={step.swatch} aria-hidden="true"></span>{step.label}</li>
					{/each}
				</ol>
			{/if}
			{#if scale.states?.length}{@render legendRows(scale.title, scale.states)}{/if}
		{/if}
	</div>
</Card>

<style>
	.map-legend-title {
		margin: 0;
		font-size: var(--text-control);
		font-weight: 600;
	}
	.legend-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		inline-size: 100%;
		min-block-size: var(--size-tap-min);
		text-align: start;
		overflow-wrap: anywhere;
	}
	.legend-toggle:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
	.chevron {
		flex: none;
		inline-size: 0.5em;
		block-size: 0.5em;
		border: solid currentColor;
		border-width: 0 2px 2px 0;
		rotate: 45deg;
	}
	[aria-expanded='true'] .chevron { rotate: 225deg; }
	.group-title {
		margin-block: 0.75rem 0.375rem;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.items {
		display: grid;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-small);
	}
	.items li {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr);
		align-items: start;
		gap: 0.5em;
		overflow-wrap: anywhere;
	}
	.map-legend-symbol {
		display: inline-grid;
		place-items: center;
		min-inline-size: 0;
	}
	.detail {
		display: block;
		color: var(--muted-foreground);
	}
	.ramp {
		display: grid;
		grid-template-columns: repeat(var(--legend-steps), minmax(0, 1fr));
		margin: 0 0 0.625rem;
		padding: 0;
		list-style: none;
		font-size: var(--text-small);
		text-align: center;
		overflow-wrap: anywhere;
	}
	.step {
		display: block;
		block-size: 0.65rem;
		margin-block-end: 0.375rem;
	}
	.ramp li:first-child .step {
		border-start-start-radius: var(--radius-sm);
		border-end-start-radius: var(--radius-sm);
	}
	.ramp li:last-child .step {
		border-start-end-radius: var(--radius-sm);
		border-end-end-radius: var(--radius-sm);
	}
	@media (forced-colors: active) {
		.step { border: 1px solid CanvasText; }
	}
</style>
