<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { AppFrame, ControlsRail, NetworkPicker, SiteFooter, SiteHeader } from '@yesid/ui/layout';
	import { LABELS, LANGUAGE_NAMES, LOCALES } from '#lib/gallery/site-header-fixture.js';

	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const locale = $derived(browser && page.url.searchParams.get('lang') === 'fr' ? 'fr' : 'en');
	const french = $derived(locale === 'fr');
	const dense = $derived(browser && page.url.searchParams.has('dense'));
	const refresh = $derived(browser && page.url.searchParams.has('refresh'));
	const longCode = $derived(browser && page.url.searchParams.has('long-code'));
	const shortReport = $derived(browser && page.url.searchParams.has('short-report'));
	const labels = $derived(french ? {
		skipToContent: 'Aller au contenu',
		openMenu: 'Ouvrir le menu',
		closeMenu: 'Fermer le menu',
		menu: 'Menu du site',
		menuFooter: 'Toutes les pages',
		theme: 'Thème sombre',
		nav: 'Navigation principale',
	} : LABELS);
	const networks = $derived([
		{ id: 'mtl', city: 'Montréal', name: dense ? 'Société de transport' : 'STM', shortCode: 'STM' },
		{ id: 'ott', city: 'Ottawa', name: 'OC Transpo', shortCode: longCode ? 'OC Transpo' : 'OC' },
	]);
	let selectedNetwork = $state('mtl');
	let viewport = $state(false);
	let chromeHeight = $state<number>();
</script>

<svelte:head><title>Controls rail and network slot</title></svelte:head>

{#snippet serviceControls()}
	<ControlsRail label="Service period" class={shortReport ? 'min-h-[22rem]' : undefined}>
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
		<SiteHeader {navigation} {labels} home="/app-frame/controls-rail"
			links={[{ href: '#report', label: french ? 'Rapport' : 'Report' }]}
			menuItems={[{ href: '#report', label: french ? 'Lire le rapport' : 'Read the report' }]}
			language={{ locale, locales: LOCALES, names: LANGUAGE_NAMES, label: french ? 'Langue' : 'Language',
				href: (lang) => `/app-frame/controls-rail?lang=${lang}` }}>
			{#snippet brand()}<ProductBrand product="Service" href="/app-frame/controls-rail" houseHref="/" />{/snippet}
			{#snippet search()}
				<input class="search" class:dense type="search" aria-label={french ? 'Chercher des rapports' : 'Search reports'} />
			{/snippet}
			{#snippet network()}
				<NetworkPicker label={french ? 'Réseau' : 'Network'} {networks} value={selectedNetwork} onValueChange={(id) => (selectedNetwork = id)} />
			{/snippet}
			{#snippet actions()}
				{#if refresh}
					<Button type="button" variant="ghost" size="icon-tap" aria-label={french ? 'Actualiser les données' : 'Refresh data'}>
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path d="M15 5v4h-4M15 9a6 6 0 1 0-2 4.5" />
						</svg>
					</Button>
				{/if}
				<a class="inline-flex min-h-11 items-center" class:dense-find={dense} href="#report">{french ? 'Chercher' : 'Find'}</a>
			{/snippet}
		</SiteHeader>
	{/snippet}
	{#snippet footer()}
		{#if shortReport}
			<SiteFooter edge="hazard" tagline="Service reports" groups={[]}>
				{#snippet brand()}<ProductBrand product="Service" href="/app-frame/controls-rail" houseHref="/" />{/snippet}
			</SiteFooter>
		{/if}
	{/snippet}
	<div class="report" class:short-report={shortReport} id="report">
		<h1>Service report</h1>
		<p>Check planned trips and the service that ran.</p>
		<Button variant="outline" wrap aria-pressed={viewport} onclick={() => (viewport = !viewport)}>Full viewport</Button>
		<output data-testid="chrome-size" aria-label="Header height">{chromeHeight ?? 0}</output>
	</div>
</AppFrame>

<style>
	.report { min-block-size: 120dvh; padding: 1rem var(--space-page-x); overflow-wrap: anywhere; }
	.short-report { min-block-size: 0; padding-block-end: var(--space-section-y); }
	h1 { font-size: var(--text-title); }
	.filter { display: grid; gap: 0.5rem; padding: 1rem; min-inline-size: 0; }
	.filter select { max-inline-size: 100%; }
	.search { inline-size: min(16rem, 22vw); min-block-size: var(--size-tap-min); border: 1px solid var(--border); }
	.search.dense { inline-size: 14rem; }
	@container site-header (width >= 1024px) {
		.dense-find { display: none; }
	}
</style>
