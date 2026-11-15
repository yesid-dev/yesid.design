<script lang="ts">
	import { getContext } from 'svelte';
	import type { NavigationLifecycle } from '@yesid/ui/brand';
	import { SiteHeader } from '@yesid/ui/layout';
	import { LABELS, LANGUAGE_NAMES } from '#lib/gallery/site-header-fixture.ts';

	// Priority 2 raised to 1280px while priority 3 keeps its 1024px default: priority 3 shows alone
	// from 1024px, then both from 1280px.
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const links = [
		{ href: '/site-header-mixed#guides', label: 'Guides', priority: 2 as const },
		{ href: '/site-header-mixed#reference', label: 'Reference', priority: 3 as const },
	];
</script>

<svelte:head>
	<title>yesid.design | Mixed link tiers</title>
</svelte:head>

<SiteHeader
	{navigation}
	home="/site-header-mixed"
	{links}
	menuItems={links}
	linkTiers={{ priority2: 1280 }}
	labels={LABELS}
	language={{ locale: 'en', locales: ['en', 'fr'], href: (next) => `/site-header-mixed?lang=${next}`, label: 'Language', names: LANGUAGE_NAMES }}
/>

<main id="main" class="mx-auto max-w-5xl px-6 pb-10" style="padding-top: var(--nav-clearance);">
	<h1 class="font-heading text-display font-bold">Mixed link tiers</h1>
	<h2 id="guides" class="mt-8 font-heading text-heading font-bold">Guides</h2>
	<h2 id="reference" class="mt-8 font-heading text-heading font-bold">Reference</h2>
</main>
