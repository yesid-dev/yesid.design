<script lang="ts">
	import { TerminalPanel } from '@yesid/ui/brand';
	import { SiteFooter } from '@yesid/ui/layout';
	import { Separator } from '@yesid/ui/separator';
	import { DIVIDER_COPY, DIVIDER_LANGS } from '#lib/gallery/dividers-fixture.ts';

	let { data } = $props();
	const copy = $derived(DIVIDER_COPY[data.lang]);
	const home = $derived(`/dividers/${data.lang}`);
	const groups = $derived([
		{ label: copy.footerGroup, links: copy.footerLinks.map((link) => ({ href: `${home}#${link.id}`, label: link.label })) },
		{ label: copy.languages, links: DIVIDER_LANGS.map((lang) => ({ href: `/dividers/${lang}`, label: lang.toUpperCase() })) },
	]);
</script>

<svelte:head>
	<title>yesid.design | {copy.title}</title>
</svelte:head>

<!-- D22: the page draws no divider itself. `.section-dividers` ends every section but the last
     with the dimension line, and SiteFooter draws its street edge. -->
<main id="main" lang={data.lang} data-ripple-exempt>
	<div class="section-dividers" data-register="expressive" data-testid="divider-sections">
		{#each copy.sections as section, index (section.id)}
			<section id={section.id} aria-labelledby="{section.id}-heading" class="divider-section">
				<div class="mx-auto max-w-5xl px-6">
					{#if index === 0}
						<h1 class="font-heading text-display font-bold">{copy.title}</h1>
						<p class="mt-4 max-w-prose text-reading leading-[1.7] text-muted-foreground">{copy.lead}</p>
					{/if}
					<h2 id="{section.id}-heading" class="mt-6 font-heading text-title font-bold">{section.heading}</h2>
					<p class="mt-3 max-w-prose text-reading leading-[1.7]">{section.body}</p>
					{#if section.id === 'placement'}
						<figure class="mt-8" data-testid="manual-dimension">
							<Separator variant="dimension" />
							<figcaption class="mt-3 text-small text-muted-foreground">{copy.manual}</figcaption>
						</figure>
					{:else if section.id === 'panels'}
						<TerminalPanel title={copy.terminalTitle} rule="dimension" class="mt-8" data-testid="dimension-terminal">
							<p class="font-mono text-small">{copy.terminalBody}</p>
						</TerminalPanel>
					{/if}
				</div>
			</section>
		{/each}
	</div>
</main>

<SiteFooter tagline={copy.tagline} {groups}>
	{#snippet brand()}
		<a href={home} class="font-heading text-xl font-bold text-foreground no-underline">yesid<span class="text-primary">.</span></a>
	{/snippet}
</SiteFooter>

<style>
	.divider-section {
		padding-block: 3rem 3.5rem;
	}
</style>
