<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { AppFrame, SiteFooter, SiteHeader } from '@yesid/ui/layout';
	import { LABELS } from '#lib/gallery/site-header-fixture.js';

	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const here = '/app-frame/short-page';
	const groups = ['About', 'Reports', 'Data', 'Help', 'Sources'].map((label) => ({
		label,
		links: [{ href: '#alerts', label: `${label} and notices` }],
	}));
</script>

<svelte:head><title>Service alerts</title></svelte:head>

<!-- A page shorter than the viewport, so the frame stretches main and the footer sits in view. -->
<AppFrame mainLabel="Service alerts">
	{#snippet header()}
		<SiteHeader {navigation} labels={LABELS} home={here} links={[]} menuItems={[{ href: '#alerts', label: 'Service alerts' }]}>
			{#snippet brand()}<ProductBrand product="Service" href={here} houseHref="/" />{/snippet}
		</SiteHeader>
	{/snippet}
	{#snippet footer()}
		<SiteFooter {groups} tagline="Service records" statusPrefix="Updated" liveLabel="Live">
			{#snippet brand()}<ProductBrand product="Service" href={here} houseHref="/" />{/snippet}
		</SiteFooter>
	{/snippet}

	<section id="alerts" class="px-6 py-8">
		<h1>Service alerts</h1>
		<p>No alerts right now.</p>
	</section>
</AppFrame>
