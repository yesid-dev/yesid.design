<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { SiteFooter, SiteHeader } from '@yesid/ui/layout';
	import { PRODUCT_COPY, PRODUCT_LANGS, PRODUCT_LANGUAGE_NAMES } from '#lib/gallery/product-header-fixture.ts';

	let { data } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const copy = $derived(PRODUCT_COPY[data.lang]);
	const home = $derived(`/product-brand/${data.lang}`);
</script>

<svelte:head>
	<title>yesid.design | ProductBrand</title>
</svelte:head>

<SiteHeader
	{navigation}
	{home}
	links={[]}
	labels={copy.labels}
	language={{ locale: data.lang, locales: PRODUCT_LANGS, href: (next) => `/product-brand/${next}`, label: copy.language, names: PRODUCT_LANGUAGE_NAMES }}
>
	{#snippet brand()}
		<ProductBrand product="Login" href={home} houseHref="https://yesid.dev" houseExternal houseLabel={copy.houseLabel} current data-testid="header-brand" />
	{/snippet}
</SiteHeader>

<main id="main" lang={data.lang} class="mx-auto max-w-5xl px-6 pb-10" style="padding-top: var(--nav-clearance);">
	<h1 class="font-heading text-display font-bold">ProductBrand</h1>
	<p class="mt-4 max-w-prose text-reading lg:text-reading-desktop leading-[1.7] text-muted-foreground">
		Experimental. The house wordmark, a divider and the product name, through SiteHeader's
		<code>brand</code> snippet above and SiteFooter's below. The toggles stay unchanged in the pill.
	</p>
	<ul class="mt-6 grid gap-4" aria-label="Product names">
		<li><ProductBrand product="Transit" href={home} houseHref="https://yesid.dev" /></li>
		<li style="max-width: 16rem"><ProductBrand product={copy.longProduct} href={home} houseHref="https://yesid.dev" data-testid="long-brand" /></li>
	</ul>
</main>

<SiteFooter tagline={copy.tagline} groups={[]}>
	{#snippet brand()}
		<ProductBrand product="Transit" href={home} houseHref="https://yesid.dev" houseExternal houseLabel={copy.houseLabel} class="text-xl" data-testid="footer-brand" />
	{/snippet}
</SiteFooter>
