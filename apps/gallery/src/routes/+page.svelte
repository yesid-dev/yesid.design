<script lang="ts">
	import BrandGallery from '#lib/gallery/BrandGallery.svelte';
	import MotionGallery from '#lib/gallery/MotionGallery.svelte';
	import PrimitiveGallery from '#lib/gallery/PrimitiveGallery.svelte';
	import TokenGallery from '#lib/gallery/TokenGallery.svelte';
</script>

<svelte:head>
	<title>yesid.design — brand gallery</title>
</svelte:head>

<h1 class="font-heading text-display font-bold">Brand gallery</h1>
<p class="mt-2 max-w-prose text-reading lg:text-reading-desktop leading-[1.7] text-muted-foreground">
	A live reference for the public token, component, and motion contracts. Every scenario uses
	neutral caller-owned data and copy.
</p>

<TokenGallery />
<PrimitiveGallery />
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/station-tabs">Station tabs: Tabs and native links</a></p>
<BrandGallery />
<MotionGallery />

<p class="mt-4"><a href="/text-links">Text links and surfaces</a> · <a href="/registers">Presentation registers</a> · <a href="/masthead">Masthead compositions</a> · <a href="/error-page/small-after.no-label.no-tape.en">Quiet error page</a> · <a href="/reading-surfaces">Reading surfaces</a> · <a href="/reading-frame/en">Reading frame</a> · <a href="/chrome-clearance">Chrome clearance</a> · <a href="/dividers/en">Dividers and the street edge</a> · <a href="/page-sections">PageSections regressions</a></p>

<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/labelled-field">Labelled field recipe</a></p>

<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/announcement-banner">Site announcement banner</a></p>
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/app-frame">App frame with network and date controls</a></p>
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/record-parts">Service record tables and charts</a></p>
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/app-frame/record-parts/en">Record layouts in a compact app frame</a></p>
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/chart-parts">Service charts</a></p>
<p><a class="inline-flex min-h-11 items-center underline" href="/d1-record">Answer leads, stamps and paged records</a></p>
<p><a class="inline-flex min-h-11 items-center underline" href="/app-frame/controls-rail">App frame controls rail and network slot</a></p>
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/map-parts">Map surfaces and responsive controls</a></p>
<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/map-legends">Map legends and status glyphs</a></p>

<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/reading-record">Public-data reading record and row recipes</a></p>

<p class="mt-4"><a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/product-brand/en">ProductBrand in a product header and footer</a> · <a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/site-header-pill/en">Product header with the toggles in the pill</a> · <a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/rail-title/en">Sticky rail titles</a> · <a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="/rail-title-fit">Rail title fitting</a></p>
