<script lang="ts">
	import { Masthead, PageSection, PageSections, SiteFooter } from '@yesid/ui/layout';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	let divider = $state<'dimension' | 'hand-drawn'>('dimension');
	onMount(() => { divider = page.url.searchParams.get('divider') === 'hand-drawn' ? 'hand-drawn' : 'dimension'; });
</script>

<svelte:head>
	<title>yesid.design | PageSections regressions</title>
</svelte:head>

<!-- D22 regression fixture for PageSections: a section a full-bleed positioned child paints over,
     a Masthead as a whole section, and a wrapped final Masthead section before the footer. -->
<main id="main" data-ripple-exempt>
	<PageSections {divider} data-testid="fixture-sections">
		<PageSection id="painted" aria-labelledby="painted-heading" class="fixture-painted">
			<!-- A full-bleed, positioned, opaque child that fills its section to the last pixel. -->
			<div class="fixture-paint" data-testid="painted-child">
				<h1 id="painted-heading" class="font-heading text-title font-bold">Painted section</h1>
				<p class="mt-3">A full-bleed child with its own stacking context and an opaque background.</p>
			</div>
		</PageSection>
		<PageSection id="masthead" aria-label="Masthead section" class="fixture-section">
			<div class="mx-auto max-w-5xl px-6">
				<Masthead heading="Masthead as a whole section" level={2} tape="dimension" />
			</div>
		</PageSection>
		<div class="fixture-wrapper">
			<PageSection id="final" aria-label="Final section" class="fixture-section">
				<div class="mx-auto max-w-5xl px-6">
					<Masthead heading="The final section" level={2} />
				</div>
			</PageSection>
		</div>
	</PageSections>
</main>

<SiteFooter tagline="PageSections fixture" groups={[]}>
	{#snippet brand()}
		<a href="/" class="inline-flex min-h-[var(--size-tap-min)] items-center font-heading text-xl font-bold text-foreground no-underline">yesid<span class="text-primary">.</span></a>
	{/snippet}
</SiteFooter>

<style>
	:global(.fixture-painted) {
		padding: 0;
	}
	.fixture-paint {
		position: relative;
		z-index: 1;
		padding: 3rem 1.5rem;
		background: #ffffff;
		color: #1c1814;
	}
	:global(.fixture-section) {
		padding-block: 3rem;
	}
</style>
