<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { AppFrame, ControlsRail, NetworkPicker, SiteHeader } from '@yesid/ui/layout';
	import { LABELS } from '#lib/gallery/site-header-fixture.js';

	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const networks = [
		{ id: 'mtl', city: 'Montréal', name: 'STM', shortCode: 'STM' },
		{ id: 'ott', city: 'Ottawa', name: 'OC Transpo', shortCode: 'OC' },
	];
	let selectedNetwork = $state('mtl');
	let viewport = $state(false);
	let chromeHeight = $state<number>();
</script>

<svelte:head><title>Controls rail and network slot</title></svelte:head>

{#snippet serviceControls()}
	<ControlsRail label="Service period">
		<label class="filter">Record period <select class="min-h-11 border border-border"><option>Seven days</option><option>Twenty-eight days</option></select></label>
	</ControlsRail>
{/snippet}

{#snippet evidencePane()}
	<p>Reported service and planned trips.</p>
	<a class="inline-flex min-h-11 items-center" href="#report">Go to report</a>
{/snippet}

<AppFrame fullViewport={viewport} bind:chromeHeight mainLabel="Service workspace" controlsRail={{
	rail: serviceControls, label: 'Controls', summary: 'Seven days', openAria: 'Open controls', closeAria: 'Close controls'
}} evidence={{ rail: evidencePane, label: 'Evidence', openAria: 'Open evidence', closeAria: 'Close evidence' }}>
	{#snippet header()}
		<SiteHeader {navigation} labels={LABELS} home="/app-frame/controls-rail" links={[{ href: '#report', label: 'Report' }]}
			menuItems={[{ href: '#report', label: 'Read the report' }]}>
			{#snippet brand()}<ProductBrand product="Service" href="/app-frame/controls-rail" houseHref="/" />{/snippet}
			{#snippet search()}<input class="search" type="search" aria-label="Search reports" />{/snippet}
			{#snippet network()}
				<NetworkPicker label="Network" {networks} value={selectedNetwork} onValueChange={(id) => (selectedNetwork = id)} />
			{/snippet}
		</SiteHeader>
	{/snippet}
	<div class="report" id="report">
		<h1>Service report</h1>
		<p>Check planned trips and the service that ran.</p>
		<Button variant="outline" wrap aria-pressed={viewport} onclick={() => (viewport = !viewport)}>Full viewport</Button>
		<output data-testid="chrome-size" aria-label="Header height">{chromeHeight ?? 0}</output>
	</div>
</AppFrame>

<style>
	.report { min-block-size: 120dvh; padding: 1rem; overflow-wrap: anywhere; }
	h1 { font-size: var(--text-title); }
	.filter { display: grid; gap: 0.5rem; padding: 1rem; min-inline-size: 0; }
	.filter select { max-inline-size: 100%; }
	.search { inline-size: min(16rem, 22vw); min-block-size: var(--size-tap-min); border: 1px solid var(--border); }
</style>
