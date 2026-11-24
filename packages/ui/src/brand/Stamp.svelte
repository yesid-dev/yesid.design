<script lang="ts" module>
	export interface StampProps {
		kind: 'record' | 'live';
		label: string;
		updatedAt?: Date;
		agoLabel?: (seconds: number) => string;
		late?: boolean;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { clock } from '../state/index.js';

	let { kind, label, updatedAt, agoLabel, late = false }: StampProps = $props();
	let mounted = $state(false);
	const timestamp = $derived(updatedAt?.getTime() ?? Number.NaN);
	const ticking = $derived(mounted && kind === 'live' && !late && Number.isFinite(timestamp) && !!agoLabel);
	const text = $derived(ticking && agoLabel
		? agoLabel(Math.max(0, Math.floor((clock.serverNow - timestamp) / 1000)))
		: label);

	onMount(() => { mounted = true; });
	$effect(() => {
		if (ticking) return clock.subscribe();
	});
</script>

<span class="stamp" data-slot="stamp" data-kind={kind} data-late={kind === 'live' && late}>
	<span class="stamp-mark" aria-hidden="true"></span>
	<span>{text}</span>
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
	.stamp-mark {
		flex: none;
		inline-size: 0.5em;
		block-size: 0.5em;
		border: 1px solid currentColor;
		background: currentColor;
	}
	[data-kind='live'] .stamp-mark { border-radius: 50%; color: var(--signal-proceed); }
	[data-late='true'] .stamp-mark { background: transparent; color: currentColor; }
	@media (forced-colors: active) {
		.stamp[data-kind] .stamp-mark {
			forced-color-adjust: none;
			color: CanvasText;
		}
	}
</style>
