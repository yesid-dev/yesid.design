<script lang="ts">
	import { Stamp } from '@yesid/ui/brand';
	import { StopLadder, type StopLadderStop } from '@yesid/ui/chart';
	import { Switch } from '@yesid/ui/switch';

	let paused = $state(false);

	const stops: readonly StopLadderStop[] = [
		{ id: 'main', name: 'Main Street', code: '201', href: '#main-street', timingPoint: true, value: 0, valueLabel: 'On time' },
		{ id: 'second', name: 'Second stop', value: 7, valueLabel: '7 minutes late' },
		{ id: 'river', name: 'Riverside Station', value: null, valueLabel: 'No value', state: 'Too few trips' },
	];
</script>

<svelte:head><title>Live controls · yesid.design</title></svelte:head>

<h1>Live controls</h1>

<section aria-labelledby="freshness">
	<h2 id="freshness">Service updates</h2>
	<Switch label="Pause live updates" stateLabels={{ on: 'Paused', off: 'Live' }} bind:checked={paused} />
	<p><Stamp kind="live" {paused} label={paused ? 'Paused · last updated at 2 p.m.' : 'Live · last updated at 2 p.m.'} /></p>
</section>

<section>
	<h2>Delay by stop</h2>
	<StopLadder label="Stops along route 24" {stops} max={10}
		threshold={{ value: 5, label: 'Five-minute threshold' }}
		highlight={{ fromId: 'second', toId: 'river', label: 'Where delay builds' }}
		columns={{ stop: 'Stop', value: 'Delay' }} />
	<p id="main-street">Main Street is the first stop.</p>
</section>

<style>
	h1 { font-size: var(--text-title); }
	h2 { margin-block-end: 0.75rem; font-size: var(--text-heading); }
	section { margin-block: 1.5rem; min-inline-size: 0; }
	p { margin-block-start: 0.75rem; }
</style>
