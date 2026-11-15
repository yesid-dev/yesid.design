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
	<div class="wide-search" role="search">
		<span class="wide-search-icon" aria-hidden="true">&#x2315;</span>
		<input type="search" aria-label={copy.search} placeholder={copy.search} />
	</div>
{/snippet}

<!-- Transit's NavPill actions: the provider choice, refresh at every width, and a compact search
     link below 1024px, paired with SiteHeader's search step. -->
{#snippet actions()}
	<label class="wide-provider">
		<span class="wide-provider-label wide-provider-full" aria-hidden="true">Société de transport de Montréal</span>
		<span class="wide-provider-label wide-provider-short" aria-hidden="true">STM</span>
		<select aria-label={copy.provider}><option>Société de transport de Montréal</option></select>
	</label>
	<button type="button" class="wide-refresh" aria-label={copy.refresh}>&#x21bb;</button>
	<a href={home} class="wide-compact-search" aria-label={copy.search}>&#x2315;</a>
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
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
	}
	.wide-search-icon {
		position: absolute;
		left: 0.5rem;
		pointer-events: none;
		color: var(--muted-foreground);
	}
	.wide-search input {
		width: clamp(11rem, 22cqi, 20rem);
		min-width: 0;
		height: var(--size-tap-min);
		padding: 0 0.75rem 0 1.9rem;
		font-size: var(--text-small);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-pill);
		background: var(--muted);
	}
	.wide-provider {
		--size-provider-select: 12.5rem;
		position: relative;
		display: inline-grid;
		place-items: center;
		max-width: var(--size-provider-select);
		min-height: 44px;
		padding-inline: 0.75rem;
	}
	.wide-provider-label {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}
	.wide-provider-short {
		display: none;
	}
	.wide-provider select {
		position: absolute;
		inset-inline: 0;
		inset-block-start: 50%;
		transform: translateY(-50%);
		width: 100%;
		min-block-size: var(--size-tap-min);
		opacity: 0;
		font: inherit;
	}
	.wide-refresh,
	.wide-compact-search {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
	}
	@container site-header (width >= 1024px) {
		.wide-compact-search {
			display: none;
		}
	}
	/* Below 600px the provider choice moves under the pill, as in Transit. */
	@container site-header (width < 600px) {
		.wide-provider-full {
			display: none;
		}
		.wide-provider-short {
			display: block;
		}
		.wide-provider {
			--size-provider-select: calc(100cqi - 2rem);
			position: absolute;
			inset-block-start: calc(100% + 8px);
			inset-inline-start: 50%;
			transform: translateX(-50%);
			border: 2px solid var(--border-brand);
			border-radius: var(--radius-pill);
			background: var(--background);
		}
	}
</style>
