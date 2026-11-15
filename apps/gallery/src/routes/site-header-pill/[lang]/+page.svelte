<script lang="ts">
	import { getContext } from 'svelte';
	import type { NavigationLifecycle } from '@yesid/ui/brand';
	import { SiteHeader } from '@yesid/ui/layout';
	import { PRODUCT_COPY, PRODUCT_LANGS, PRODUCT_LANGUAGE_NAMES, productLinks } from '#lib/gallery/product-header-fixture.ts';

	let { data } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const copy = $derived(PRODUCT_COPY[data.lang]);
	const links = $derived(productLinks('/site-header-pill', data.lang));
</script>

<svelte:head>
	<title>yesid.design | {copy.title}</title>
</svelte:head>

<SiteHeader
	{navigation}
	home="/site-header-pill/{data.lang}"
	{links}
	menuItems={links}
	labels={copy.labels}
	language={{ locale: data.lang, locales: PRODUCT_LANGS, href: (next) => `/site-header-pill/${next}`, label: copy.language, names: PRODUCT_LANGUAGE_NAMES }}
/>

<main id="main" lang={data.lang} class="mx-auto max-w-5xl px-6 pb-10" style="padding-top: var(--nav-clearance);">
	<h1 class="font-heading text-display font-bold">{copy.title}</h1>
	<p class="mt-4 max-w-prose text-reading lg:text-reading-desktop leading-[1.7] text-muted-foreground">{copy.lead}</p>
	{#each copy.links as link (link.path)}
		<h2 id={link.path} class="mt-8 font-heading text-heading font-bold">{link.label}</h2>
	{/each}
</main>
