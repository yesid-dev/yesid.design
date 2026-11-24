<!-- Big number with its label. An empty value renders `absent` instead, such as "no data" copy. -->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface MetricDisplayProps extends HTMLAttributes<HTMLDivElement> {
		value: string | null | undefined;
		label: string;
		/** Rendered in place of the value when it is null, undefined or empty. */
		absent?: Snippet;
		/** Rendered after the label, such as an info tooltip trigger. */
		info?: Snippet;
		sublabel?: string;
		size?: 'sm' | 'md' | 'lg';
		labelBelow?: boolean;
		/** Reading ink for ordinary figures; accent for the screen's one highlight. */
		tone?: 'accent' | 'reading';
		/** Sentence-case reading typography or the default compact metric label. Independent of value tone. */
		labelRole?: 'metric' | 'reading';
		/** Label beside value on phones, stacked from 640px. */
		layout?: 'stacked' | 'phone-row';
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import MetricValue from './MetricValue.svelte';

	let {
		value,
		label,
		absent,
		info,
		sublabel,
		size = 'md',
		labelBelow = false,
		tone = 'accent',
		labelRole = 'metric',
		layout = 'stacked',
		class: className,
		...restProps
	}: MetricDisplayProps = $props();

</script>

{#snippet labelRow(extra: string)}
	<div class={cn('flex items-center gap-1', extra)}>
		<span class={labelRole === 'reading' ? 'label-reading' : 'label-metric'}>{label}</span>
		{@render info?.()}
	</div>
{/snippet}

<div class={cn('flex flex-col', layout === 'phone-row' && 'metric-phone-row', className)} data-slot="metric-display" {...restProps}>
	{#if !labelBelow}
		{@render labelRow('')}
	{/if}
	{#if value == null || value === ''}
		{@render absent?.()}
	{:else}
		<MetricValue {value} {size} {tone} />
	{/if}
	{#if labelBelow}
		{@render labelRow('mt-2')}
	{/if}
	{#if sublabel}
		<span class="metric-sublabel mt-1 font-mono text-caption text-[var(--muted-foreground)]">{sublabel}</span>
	{/if}
</div>

<style>
	@media (max-width: 639px) {
		.metric-phone-row { display: flex; flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1rem; }
		.metric-phone-row > :global(.metric-sublabel) { flex-basis: 100%; }
		.metric-phone-row > :global(div) { margin-top: 0; min-width: 0; overflow-wrap: anywhere; flex: 1; }
		.metric-phone-row > :global(.metric-value) { overflow-wrap: anywhere; }
	}
</style>
