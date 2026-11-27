<script lang="ts">
	import { getContext } from 'svelte';
	import type { NavigationLifecycle } from '@yesid/ui/brand';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import LayoutList from '@lucide/svelte/icons/layout-list';
	import PanelTop from '@lucide/svelte/icons/panel-top';
	import { ProductBrand } from '@yesid/ui/brand';
	import { SiteHeader, SiteFooter } from '@yesid/ui/layout';
	import {
		HOME,
		LABELS,
		LANGUAGE_LABEL,
		LANGUAGE_NAMES,
		LINKS,
		LOCALES,
		LONG_LINKS,
		LONG_MENU_LABELS,
		MENU_ITEMS,
		SEARCH_LABEL,
		languageHref,
		menuGroupsFor,
	} from '#lib/gallery/site-header-fixture.ts';

	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	let { compactFixture = false }: { compactFixture?: boolean } = $props();
	const ICONS: Record<string, typeof PanelTop> = {
		[HOME]: PanelTop,
		'/listing-frame': LayoutList,
		'/detail-frame': FileText,
		'https://example.com': ExternalLink,
	};
	const compact = $derived(compactFixture || (browser && page.url.searchParams.has('compact')));
	const scrambled = $derived(browser && page.url.searchParams.has('scrambled'));
	const productBrand = $derived(browser && page.url.searchParams.get('brand') === 'product');
	const longNav = $derived(browser && page.url.searchParams.get('nav') === 'long');
	const links = $derived(longNav ? LONG_LINKS : LINKS);
	const locale = $derived((browser && page.url.searchParams.get('lang')) || LOCALES[0]);
	// `?groups=2|4` exercises the grouped menu layout at any width, independently of the deprecated
	// compact shell; the compact fixture keeps its two groups.
	const groupCount = $derived.by(() => {
		const requested = browser ? page.url.searchParams.get('groups') : null;
		if (requested === '4') return 4;
		if (requested === '2') return 2;
		return compact ? 2 : 0;
	});
	const groups = $derived.by(() => {
		const built = groupCount === 4 ? menuGroupsFor(4, locale) : groupCount === 2 ? menuGroupsFor(2, compact ? 'en' : locale) : undefined;
		const useLongLabels = groupCount === 4 && browser && page.url.searchParams.has('long-menu');
		const longLabels = LONG_MENU_LABELS[locale === 'fr' ? 'fr' : 'en'];
		return built?.map((group, index) => ({
			...group,
			items: group.items.map(item => ({
				...item,
				...(useLongLabels ? { label: longLabels[index]!, ariaLabel: undefined } : {}),
				icon: ICONS[item.href],
			})),
		}));
	});
</script>

<svelte:head>
	<title>yesid.design — site header</title>
</svelte:head>

{#snippet search()}
	<input
		type="search"
		aria-label={SEARCH_LABEL}
		placeholder={SEARCH_LABEL}
		class="h-11 w-56 rounded-full border border-border-subtle bg-muted px-4 text-small"
	/>
{/snippet}

{#snippet action()}
	<button type="button" class="min-h-11 px-3 text-small" onclick={() => document.querySelector<HTMLInputElement>('#fixture-search')?.focus()}>Search</button>
{/snippet}

{#snippet productBrandMarkup()}
	<ProductBrand
		product="Transit"
		href={HOME}
		houseHref="https://yesid.dev"
		houseLabel="yesid.dev (opens in a new tab)"
		houseExternal
	/>
{/snippet}

<SiteHeader
	{navigation}
	home={HOME}
	links={links}
	menuItems={MENU_ITEMS.map((item) => ({ ...item, icon: ICONS[item.href] }))}
	menuGroups={groups}
	brand={productBrand ? productBrandMarkup : undefined}
	compactControls={compact}
	actions={compact && !compactFixture ? action : undefined}
	labels={LABELS}
	language={{ locale, locales: scrambled ? ['fr', 'en', 'es'] : LOCALES, href: next => scrambled ? `${languageHref(next)}&scrambled&compact` : languageHref(next), label: LANGUAGE_LABEL, names: LANGUAGE_NAMES, preserveState: true }}
	{search}
/>

<main id="main" class="mx-auto max-w-5xl px-6 pb-10" style="padding-top: var(--nav-clearance);">
	<h1 class="font-heading text-display font-bold">Site header</h1>
	<p class="mt-4 max-w-prose text-reading lg:text-reading-desktop leading-[1.7] text-muted-foreground">
		Priority 2 links show from 600px of header width, priority 3 links and search from 1024px, and
		links that do not fit leave the pill a whole priority at a time. The theme and language toggles
		stay in the pill at every width. The menu holds every destination, like the
		<a href="/listing-frame">listing frame</a>; a language switch from the open menu keeps it open.
	</p>
	{#if compact}
		<p class="mt-4 max-w-prose text-reading leading-[1.7]" data-testid="compact-deprecated">
			<strong>Deprecated since v0.44.0, not a pattern to copy.</strong> <code>compactControls</code>
			moves the toggles into the menu below 600px. The toggles belong in the pill at every width
			(DECISIONS.md D19): omit the prop. This page keeps it only to prove it still works until removal.
		</p>
	{/if}
	{#if compact}<input id="fixture-search" type="search" aria-label="Search destinations" class="mt-6 h-11 border border-border-subtle px-4" />{/if}
</main>
{#if compact}
	<SiteFooter tagline="Shared shell fixture" groups={[]}>
		{#snippet brand()}<a href="/site-header" class="inline-flex min-h-11 items-center">Gallery</a>{/snippet}
	</SiteFooter>
{/if}
