<script lang="ts">
	import { getContext } from 'svelte';
	import { RailTitle, type NavigationLifecycle } from '@yesid/ui/brand';
	import { SiteHeader } from '@yesid/ui/layout';
	import { PRODUCT_COPY, PRODUCT_LANGS, PRODUCT_LANGUAGE_NAMES } from '#lib/gallery/product-header-fixture.ts';
	import { RAIL_COPY } from '#lib/gallery/rail-title-fixture.ts';

	let { data } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const header = $derived(PRODUCT_COPY[data.lang]);
	const copy = $derived(RAIL_COPY[data.lang]);
	const home = $derived(`/rail-title/${data.lang}`);
</script>

<svelte:head>
	<title>yesid.design | RailTitle</title>
</svelte:head>

<SiteHeader
	{navigation}
	{home}
	links={[]}
	labels={header.labels}
	language={{ locale: data.lang, locales: PRODUCT_LANGS, href: (next) => `/rail-title/${next}`, label: header.language, names: PRODUCT_LANGUAGE_NAMES }}
/>

<main id="main" lang={data.lang} style="padding-top: var(--nav-clearance);">
	<div class="mx-auto max-w-3xl px-[var(--space-page-x)] pb-10">
		<h1 class="font-heading text-display font-bold">{copy.title}</h1>
		<p class="mt-4 text-reading leading-[1.7] text-muted-foreground">{copy.lead}</p>
	</div>

	{#each copy.sections as section, index (section.id)}
		<section
			id={section.id}
			aria-labelledby="{section.id}-title"
			data-testid="rail-section-{section.id}"
			class="border-t border-border-subtle py-12"
			class:bg-card={index % 2 === 1}
		>
			<RailTitle heading={section.heading} side={section.side} titleId="{section.id}-title">
				<div class="mx-auto grid max-w-3xl gap-4 px-[var(--space-page-x)]" data-testid="rail-content-{section.id}">
					{#each { length: section.paragraphs } as _, paragraph (paragraph)}
						<p class="rounded-md border border-border bg-background p-4 text-reading leading-[1.7]">{copy.paragraph}</p>
					{/each}
				</div>
			</RailTitle>
		</section>
	{/each}
</main>
