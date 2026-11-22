<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { Combobox } from '@yesid/ui/combobox';
	import * as Sheet from '@yesid/ui/sheet';
	import { AppFrame, DateRangePicker, NetworkPicker, SiteHeader, type DateRangeSelection } from '@yesid/ui/layout';
	import { LABELS, LANGUAGE_LABEL, LANGUAGE_NAMES, LOCALES } from '#lib/gallery/site-header-fixture.js';

	let { fullViewport = false, overlays = false }: { fullViewport?: boolean; overlays?: boolean } = $props();
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
	const frenchLabels = {
		legend: 'Dates du bilan', presets: 'Plages prédéfinies', custom: 'Autres dates',
		start: 'Date de début', end: 'Date de fin', apply: 'Appliquer les dates',
		missing: 'Entrez deux dates valides.', bounds: 'Choisissez des dates dans la période disponible.',
		order: 'La date de fin doit suivre la date de début.',
	};
	const frenchPresetLabels = ['Les sept derniers jours', 'Les 30 derniers jours', 'Dates impossibles', 'Année à cinq chiffres'];
	const frenchPresets = presets.map((preset, index) => ({ ...preset, label: frenchPresetLabels[index] }));
	const choices = [{ value: 'north', label: 'North corridor', search: 'north corridor' }];
	const fold = (text: string) => text.toLowerCase();
	let network = $state('mtl');
	let range = $state<DateRangeSelection>({ start: presets[0].start, end: presets[0].end, presetId: 'week' });
	let min = $state('2026-01-01');
	let deferNetwork = $state(false);
	let pendingNetwork = $state<string>();
	let chromeHeight = $state<number>();
	let french = $state(false);
	let submissions = $state(0);

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

{#snippet datePicker()}
	<DateRangePicker
		presets={french ? frenchPresets : presets} labels={french ? frenchLabels : labels}
		value={range} {min} max="2027-12-31" onValueChange={(next) => (range = next)}
	/>
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
				{#if overlays}
					<Combobox options={choices} {fold} label="Header search" clearLabel="Clear search" emptyLabel="No matches" />
				{:else}
					<input type="search" aria-label="Search the record" />
				{/if}
			{/snippet}
		</SiteHeader>
	{/snippet}
	{#snippet controls()}
		<NetworkPicker label="Transit network" {networks} value={network} onValueChange={selectNetwork} />
		{#if fullViewport}
			<form onsubmit={(event) => { event.preventDefault(); submissions += 1; }}>
				{@render datePicker()}
				<button type="submit" class="min-h-11">Save workspace</button>
				<span hidden data-testid="outer-submissions">{submissions}</span>
			</form>
		{:else}
			{@render datePicker()}
		{/if}
		{#if overlays}
			<Combobox options={choices} {fold} label="Control search" clearLabel="Clear filter" emptyLabel="No matches" />
			<Sheet.Root>
				<Sheet.Trigger class="min-h-11">Open workspace settings</Sheet.Trigger>
				<Sheet.Content side="right" closeLabel="Close workspace settings">
					<Sheet.Title>Workspace settings</Sheet.Title>
				</Sheet.Content>
			</Sheet.Root>
		{/if}
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
		<a class="inline-flex min-h-11 items-center underline" href="/">Gallery home</a>
		<a class="inline-flex min-h-11 items-center underline" href="/app-frame/overlays">Test workspace overlays</a>
		<button type="button" class="min-h-11" onclick={() => (french = true)}>Use French date labels</button>
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
	form { min-inline-size: 0; max-inline-size: 100%; }
</style>
