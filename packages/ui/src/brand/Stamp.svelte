<script lang="ts" module>
	export interface StampProps {
		kind: 'record' | 'live';
		label: string;
		updatedAt?: Date;
		agoLabel?: (seconds: number) => string;
		late?: boolean;
		paused?: boolean;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { clock } from '../state/index.js';

	// Sample the usual zero, singular, plural and upper-end age labels before the clock starts.
	const sizingAges = [0, 1, 59, 60, 120, 3_599, 3_600, 7_200, 86_399, 86_400, 172_800, 604_799];

	let { kind, label, updatedAt, agoLabel, late = false, paused = false }: StampProps = $props();
	let mounted = $state(false);
	const isPaused = $derived(kind === 'live' && paused);
	const timestamp = $derived(updatedAt?.getTime() ?? Number.NaN);
	const liveAge = $derived(kind === 'live' && !late && !isPaused && Number.isFinite(timestamp) && !!agoLabel);
	const ticking = $derived(mounted && liveAge);
	const sizingLabels = $derived(liveAge && agoLabel
		? new Set([label, ...sizingAges.map((seconds) => agoLabel(seconds))])
		: null);
	const text = $derived(ticking && agoLabel
		? agoLabel(Math.max(0, Math.floor((clock.serverNow - timestamp) / 1000)))
		: label);

	onMount(() => { mounted = true; });
	$effect(() => {
		if (ticking) return clock.subscribe();
	});
</script>

<span class="stamp" data-slot="stamp" data-kind={kind} data-late={kind === 'live' && late && !isPaused}
	data-paused={isPaused || undefined}>
	{#if isPaused}
		<span class="stamp-pause" aria-hidden="true"></span>
	{:else}
		<span class="stamp-mark" aria-hidden="true"></span>
	{/if}
	{#if sizingLabels}
		<span class="stamp-age">
			<span>{text}</span>
			{#each sizingLabels as sizingLabel (sizingLabel)}
				<span class="stamp-age-size" aria-hidden="true" inert data-label={sizingLabel}></span>
			{/each}
		</span>
	{:else}
		<span>{text}</span>
	{/if}
</span>

<style>
	.stamp {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5em;
		max-inline-size: 100%;
		padding: 0.2em 0.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--muted);
		color: var(--muted-foreground);
		font-size: var(--text-small);
		overflow-wrap: anywhere;
	}
	.stamp-age {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		min-inline-size: 0;
		font-variant-numeric: tabular-nums;
	}
	.stamp-age > span { grid-area: 1 / 1; }
	.stamp-age-size {
		visibility: hidden;
		white-space: nowrap;
		overflow: clip;
	}
	.stamp-age-size::before { content: attr(data-label); }
	.stamp-mark, .stamp-pause {
		flex: none;
		inline-size: 0.5em;
		block-size: 0.5em;
	}
	.stamp-mark {
		border: 1px solid currentColor;
		background: currentColor;
	}
	[data-kind='live'] .stamp-mark { border-radius: 50%; color: var(--signal-proceed); }
	[data-late='true'] .stamp-mark { background: transparent; color: currentColor; }
	.stamp-pause { border-inline: 2px solid currentColor; }
	@media (forced-colors: active) {
		.stamp[data-kind] .stamp-mark {
			forced-color-adjust: none;
			color: CanvasText;
		}
	}
</style>
