<!--
  StopLadder's threshold rule near the start, middle and end of the track, at full width and in a
  32rem card whose bar column is narrower than the longest label.
-->
<script lang="ts">
	import { StopLadder } from '@yesid/ui/chart';

	let { data } = $props();

	const copy = {
		en: {
			title: 'Stop ladder threshold',
			stop: 'Stop',
			delay: 'Median delay',
			threshold: 'Late beyond 5 min',
			reading: (value: number) => `${value} min late`,
		},
		fr: {
			title: 'Seuil de l’échelle des arrêts',
			stop: 'Arrêt',
			delay: 'Retard médian',
			threshold: 'En retard au-delà de 5 min',
			reading: (value: number) => `${value} min de retard`,
		},
	};
	const c = $derived(copy[data.lang]);
	const stops = $derived(
		[2, 7, 4].map((value, index) => ({
			id: String(index),
			name: ['Main Street', 'City Library', 'Riverside Station'][index]!,
			value,
			valueLabel: c.reading(value),
		})),
	);
	const positions = [
		{ id: 'start', value: 0.5 },
		{ id: 'middle', value: 5 },
		{ id: 'end', value: 10 },
	];
</script>

<svelte:head><title>{c.title} · yesid.design</title></svelte:head>

<div class="examples" lang={data.lang}>
	<h1>{c.title}</h1>
	{#each ['full', 'compact'] as size (size)}
		{#each positions as position (position.id)}
			<div class={size} data-testid={`ladder-${size}-${position.id}`}>
				<StopLadder
					label={`${c.title}: ${size} ${position.id}`}
					{stops}
					max={10}
					threshold={{ value: position.value, label: c.threshold }}
					columns={{ stop: c.stop, value: c.delay }}
				/>
			</div>
		{/each}
	{/each}
</div>

<style>
	.examples {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2rem;
	}

	h1 {
		margin: 0;
		font-size: var(--text-title);
	}

	.compact {
		inline-size: min(100%, 32rem);
	}
</style>
