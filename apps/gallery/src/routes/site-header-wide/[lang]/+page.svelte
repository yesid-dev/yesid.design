<script lang="ts">
	import { getContext } from 'svelte';
	import { ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { SiteHeader } from '@yesid/ui/layout';
	import { PRODUCT_COPY, PRODUCT_LANGUAGE_NAMES } from '#lib/gallery/product-header-fixture.ts';
	import { WIDE_COPY, WIDE_LANGS, wideLinks } from '#lib/gallery/wide-header-fixture.ts';

	let { data } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const labels = $derived(PRODUCT_COPY[data.lang].labels);
	const copy = $derived(WIDE_COPY[data.lang]);
	const links = $derived(wideLinks(data.lang));
	const home = $derived(`/site-header-wide/${data.lang}`);
</script>

<svelte:head>
	<title>yesid.design | {copy.title}</title>
</svelte:head>

{#snippet brand()}
	<ProductBrand product="Transit" href={home} houseHref="https://yesid.dev" data-testid="wide-brand" />
{/snippet}

{#snippet search()}
	<input type="search" aria-label={copy.search} placeholder={copy.search} class="wide-search" />
{/snippet}

{#snippet actions()}
	<button type="button" class="wide-refresh" aria-label={copy.refresh}>&#x21bb;</button>
	<label class="wide-provider">
		<span class="sr-only">{copy.provider}</span>
		<select><option>Société de transport de Montréal</option></select>
	</label>
{/snippet}

<SiteHeader
	{navigation}
	{home}
	{brand}
	{links}
	menuItems={links}
	linkTiers={{ priority3: 1280 }}
	{labels}
	language={{ locale: data.lang, locales: WIDE_LANGS, href: (next) => `/site-header-wide/${next}`, label: PRODUCT_COPY[data.lang].language, names: PRODUCT_LANGUAGE_NAMES }}
	{search}
	{actions}
/>

<main id="main" lang={data.lang} class="mx-auto max-w-5xl px-6 pb-10" style="padding-top: var(--nav-clearance);">
	<h1 class="font-heading text-display font-bold">{copy.title}</h1>
	{#each links as link (link.href)}
		<h2 id={link.href.split('#')[1]} class="mt-8 font-heading text-heading font-bold">{link.label}</h2>
	{/each}
</main>

<style>
	.wide-search {
		width: 19.5rem;
		min-height: 44px;
		padding-inline: 1rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-pill);
		background: var(--muted);
	}
	.wide-refresh {
		min-width: 44px;
		min-height: 44px;
	}
	.wide-provider select {
		width: 12.5rem;
		min-height: 44px;
		padding-inline: 0.75rem;
		background: transparent;
		color: var(--foreground);
		text-overflow: ellipsis;
	}
	/* Like Transit, the extra controls leave the pill on narrower headers. */
	@container site-header (width < 1024px) {
		.wide-provider { display: none; }
	}
	@container site-header (width < 768px) {
		.wide-refresh { display: none; }
	}
</style>
