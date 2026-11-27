<script lang="ts">
	import { onMount } from 'svelte';
	import { ProductBrand } from '@yesid/ui/brand';
	import { SiteFooter } from '@yesid/ui/layout';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let railLayout = $state<'paired' | 'compact'>();
	onMount(() => {
		railLayout = document.documentElement.dataset.appFrameRails === 'compact' ? 'compact' : 'paired';
	});
	const groups = $derived(data.lang === 'fr' ? [
		{ label: 'Aide', links: [{ href: '#report', label: 'Aide' }] },
		{ label: 'Rapports', links: [{ href: '#report', label: 'Télécharger les données' }] },
		{ label: 'Données', links: [{ href: '#report', label: 'Alertes et avis de service' }] },
	] : [
		{ label: 'Help', links: [{ href: '#report', label: 'Help' }] },
		{ label: 'Reports', links: [{ href: '#report', label: 'Worst trips and vehicles' }] },
		{ label: 'Data', links: [{ href: '#report', label: 'Service alerts and notices' }] },
	]);
</script>

<!-- Keep the footer above the fold and exercise the compact shell's adoption of the boot state. -->
<div data-slot="app-frame" data-rail-layout={railLayout}>
	<div id="report" class="px-6 py-8"><h1>Service report</h1></div>
	<SiteFooter {groups} tagline="Service records">
		{#snippet brand()}<ProductBrand product="Service" href="#report" houseHref="/" />{/snippet}
	</SiteFooter>
</div>
