<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { AppFrame, DateRangePicker, NetworkPicker, SiteHeader, type DateRangeSelection } from '@yesid/ui/layout';
	import { LABELS, LANGUAGE_LABEL, LANGUAGE_NAMES, LOCALES } from '#lib/gallery/site-header-fixture.js';

	let { fullViewport = false }: { fullViewport?: boolean } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const networks = [
		{ id: 'mtl', city: 'Montréal', name: 'STM', shortCode: 'STM' },
		{ id: 'ott', city: 'Ottawa', name: 'OC Transpo', shortCode: 'OC' },
	];
	const presets = [
		{ id: 'week', label: 'Last seven days', start: '2026-10-25', end: '2026-10-31' },
		{ id: 'month', label: 'October', start: '2026-10-01', end: '2026-10-31' },
		{ id: 'impossible', label: 'Impossible dates', start: '2026-02-30', end: '2026-03-02' },
		{ id: 'five-digit', label: 'Five-digit year', start: '20260-10-25', end: '20260-10-31' },
	];
	const labels = {
		legend: 'Dates', presets: 'Ready ranges', custom: 'Other dates', start: 'Start date',
		end: 'End date', apply: 'Apply dates', missing: 'Enter two valid dates.',
		bounds: 'Choose dates within the record.', order: 'End date must follow the start date.',
	};
	let network = $state('mtl');
	let range = $state<DateRangeSelection>({ start: presets[0].start, end: presets[0].end, presetId: 'week' });
	let min = $state('2026-01-01');
	let deferNetwork = $state(false);
	let pendingNetwork = $state<string>();
	let chromeHeight = $state<number>();

	function selectNetwork(id: string) {
		if (deferNetwork) pendingNetwork = id;
		else network = id;
	}
</script>

<svelte:head><title>App frame with network and date controls</title></svelte:head>

{#snippet evidencePane()}
	<p>Scheduled trips and reported arrivals.</p>
	<a class="inline-flex min-h-11 items-center underline" href="#record">Read the record</a>
{/snippet}

<AppFrame {fullViewport} bind:chromeHeight mainLabel="Service workspace" evidence={{
	rail: evidencePane, label: 'Evidence', summary: 'Service data', openAria: 'Open evidence', closeAria: 'Close evidence'
}}>
	{#snippet header()}
		<SiteHeader
			{navigation} home="/app-frame" links={[{ href: '/app-frame', label: 'Record' }]} labels={LABELS}
			menuItems={[{ href: '/app-frame/viewport', label: 'Full viewport' }]}
			language={{ locale: 'en', locales: LOCALES, href: () => '/app-frame', label: LANGUAGE_LABEL, names: LANGUAGE_NAMES }}
		>
			{#snippet brand()}
				<ProductBrand product="Transit" href="/app-frame" houseHref="/" />
			{/snippet}
			{#snippet search()}
				<input type="search" aria-label="Search the record" />
			{/snippet}
		</SiteHeader>
	{/snippet}
	{#snippet controls()}
		<NetworkPicker label="Transit network" {networks} value={network} onValueChange={selectNetwork} />
		<DateRangePicker
			{presets} {labels} value={range} {min} max="2027-12-31"
			onValueChange={(next) => (range = next)}
		/>
	{/snippet}
	{#snippet footer()}
		{#if !fullViewport}<footer class="px-6 py-4">Service record</footer>{/if}
	{/snippet}
	<section id="record" class="record" class:full={fullViewport}>
		<h1 class="font-heading text-title font-bold">{fullViewport ? 'Map workspace' : 'Service record'}</h1>
		<p>Showing service from {range.start} to {range.end}.</p>
		<a class="inline-flex min-h-11 items-center underline" href={fullViewport ? '/app-frame' : '/app-frame/viewport'}>
			{fullViewport ? 'Open the record' : 'Open the map workspace'}
		</a>
		<a class="inline-flex min-h-11 items-center underline" href="#details">Jump to details</a>
		<button type="button" class="min-h-11" onclick={() => (range = { ...range })}>Refresh date data</button>
		<button type="button" class="min-h-11" onclick={() => (min = '2025-01-01')}>Extend the date bounds</button>
		<button type="button" class="min-h-11" onclick={() => (deferNetwork = true)}>Defer network changes</button>
		{#if pendingNetwork}
			<button type="button" class="min-h-11" onclick={() => { if (pendingNetwork) network = pendingNetwork; }}>Confirm network change</button>
		{/if}
		<h2 id="details" class="details font-heading text-subheading">Service details</h2>
		<span hidden data-testid="chrome-height">{chromeHeight}</span>
	</section>
</AppFrame>

<style>
	.record { min-block-size: 140vh; padding: 1rem var(--space-page-x); }
	.record.full { background: var(--muted); }
	.details { margin-block: 80vh 30vh; }
</style>
