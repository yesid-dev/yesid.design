<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { AppFrame, NetworkPicker, SiteHeader } from '@yesid/ui/layout';
	import { LABELS, LANGUAGE_NAMES, LOCALES } from '#lib/gallery/site-header-fixture.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const french = $derived(data.lang === 'fr');
	const labels = $derived(french ? {
		skipToContent: 'Aller au contenu',
		openMenu: 'Ouvrir le menu',
		closeMenu: 'Fermer le menu',
		menu: 'Menu du site',
		menuFooter: 'Toutes les pages',
		theme: 'Thème sombre',
		nav: 'Navigation principale',
	} : LABELS);
	const links = $derived([
		{ href: '#overview', label: french ? 'Aperçu du réseau' : 'Overview', priority: 2 as const },
		{ href: '#map', label: french ? 'Carte du réseau' : 'Map', priority: 2 as const },
	]);
	const networks = $derived([
		{ id: 'stm', city: french ? 'Montréal' : 'Montreal', name: 'STM', shortCode: 'STM' },
		{ id: 'ott', city: 'Ottawa', name: 'OC Transpo', shortCode: 'OC Transpo' },
	]);
	let selected = $state('stm');
	const href = (lang: string) => `/app-frame/network-paint/${lang}/${data.refresh ? 'refresh' : 'quiet'}`;
</script>

<svelte:head><title>Network header first paint</title></svelte:head>

<AppFrame mainLabel={french ? 'Espace de service' : 'Service workspace'}>
	{#snippet header()}
		<SiteHeader {navigation} {labels} home={href(data.lang)} {links}
			linkTiers={{ priority2: 1280, priority3: 1280 }}
			menuItems={[{ href: '#overview', label: french ? 'Lire le rapport' : 'Read the report' }]}
			language={{ locale: data.lang, locales: LOCALES, names: LANGUAGE_NAMES, label: french ? 'Langue' : 'Language', href }}>
			{#snippet brand()}<ProductBrand product="Transit" href={href(data.lang)} houseHref="/" />{/snippet}
			{#snippet search()}
				<input class="search" type="search" aria-label={french ? 'Chercher dans le réseau' : 'Search the network'} />
			{/snippet}
			{#snippet network()}
				<NetworkPicker label={french ? 'Réseau' : 'Network'} {networks} value={selected} onValueChange={(id) => (selected = id)} />
			{/snippet}
			{#snippet actions()}
				{#if data.refresh}
					<Button type="button" variant="ghost" size="icon-tap" aria-label={french ? 'Actualiser les données' : 'Refresh data'}>
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
							<path d="M15 5v4h-4M15 9a6 6 0 1 0-2 4.5" />
						</svg>
					</Button>
				{/if}
			{/snippet}
		</SiteHeader>
	{/snippet}
	<h1 id="overview">{french ? 'Aperçu du réseau' : 'Service overview'}</h1>
	<p id="map">{french ? 'Les derniers relevés du service.' : 'The latest service report.'}</p>
</AppFrame>

<style>
	.search { inline-size: clamp(11rem, 22cqi, 20rem); min-block-size: var(--size-tap-min); border: 1px solid var(--border); }
</style>
