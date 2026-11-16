<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { CodeBlock, TerminalPanel } from '@yesid/ui/brand';
	import { PageSection, PageSections, SiteFooter } from '@yesid/ui/layout';
	import { Separator } from '@yesid/ui/separator';
	import { DIVIDER_COPY, DIVIDER_LANGS } from '#lib/gallery/dividers-fixture.ts';

	let { data } = $props();
	// `?divider=hand-drawn|hazard` and `?edge=hazard` exercise the owner's 16 November 2026 options;
	// the page keeps the dimension default without them.
	let params = $state(new URLSearchParams());
	onMount(() => (params = new URLSearchParams(page.url.searchParams.toString())));
	const divider = $derived.by(() => {
		const value = params.get('divider');
		return value === 'hand-drawn' || value === 'hazard' ? value : undefined;
	});
	const edge = $derived(params.get('edge') === 'hazard' ? 'hazard' : undefined);
	const copy = $derived(DIVIDER_COPY[data.lang]);
	const home = $derived(`/dividers/${data.lang}`);
	const groups = $derived([
		{ label: copy.footerGroup, links: copy.footerLinks.map((link) => ({ href: `${home}#${link.id}`, label: link.label })) },
		{ label: copy.languages, links: DIVIDER_LANGS.map((lang) => ({ href: `/dividers/${lang}`, label: lang.toUpperCase() })) },
	]);
	const [first, ...rest] = $derived(copy.sections);
	const middle = $derived(rest.slice(0, -1));
	const last = $derived(rest.at(-1)!);
</script>

<svelte:head>
	<title>yesid.design | {copy.title}</title>
</svelte:head>

{#snippet text(section: (typeof copy.sections)[number])}
	<h2 id="{section.id}-heading" class="mt-6 font-heading text-title font-bold">{section.heading}</h2>
	<p class="mt-3 max-w-prose text-reading leading-[1.7]">{section.body}</p>
{/snippet}

<!-- D22: the page draws no divider itself. PageSections ends every section but the last with the
     dimension line, across the wrapper around the last section, and SiteFooter draws its street edge. -->
<main id="main" lang={data.lang} data-ripple-exempt>
	<PageSections data-register="expressive" data-testid="divider-sections" {divider}>
		<PageSection id={first.id} aria-labelledby="{first.id}-heading" class="divider-section">
			<div class="mx-auto max-w-5xl px-6">
				<h1 class="font-heading text-display font-bold">{copy.title}</h1>
				<p class="mt-4 max-w-prose text-reading leading-[1.7] text-muted-foreground">{copy.lead}</p>
				{@render text(first)}
			</div>
		</PageSection>
		{#each middle as section (section.id)}
			<PageSection id={section.id} aria-labelledby="{section.id}-heading" class="divider-section">
				<div class="mx-auto max-w-5xl px-6">
					{@render text(section)}
					{#if section.id === 'placement'}
						<figure class="mt-8" data-testid="manual-dimension">
							<Separator variant="dimension" />
							<figcaption class="mt-3 text-small text-muted-foreground">{copy.manual}</figcaption>
						</figure>
					{:else if section.id === 'panels'}
						<TerminalPanel title={copy.terminalTitle} rule="dimension" class="mt-8" data-testid="dimension-terminal">
							<p class="font-mono text-small">{copy.terminalBody}</p>
						</TerminalPanel>
						<TerminalPanel title="Ligne jaune" rule="line" class="mt-4" footer={[{ label: 'Lignes', value: '1' }]} data-testid="line-terminal">
							<p class="font-mono text-small">rule="line"</p>
						</TerminalPanel>
						<TerminalPanel title="Default control" class="mt-4" footer={[{ label: 'Lines', value: '1' }]} data-testid="default-terminal-control">
							<p class="font-mono text-small">Default terminal rules remain independent.</p>
						</TerminalPanel>
						<TerminalPanel title="Nested terminals" rule="line" class="mt-4" footer={[{ label: 'Panels', value: '3' }]} data-testid="nested-line-terminal">
							<TerminalPanel title="Nested default" footer={[{ label: 'Lines', value: '1' }]} data-testid="nested-default-terminal">
								<p class="font-mono text-small">Default rule.</p>
							</TerminalPanel>
							<TerminalPanel title="Nested dimension" rule="dimension" class="mt-4" footer={[{ label: 'Lines', value: '1' }]} data-testid="nested-dimension-terminal">
								<p class="font-mono text-small">Dimension rule.</p>
							</TerminalPanel>
							<div class="mt-4" data-testid="nested-default-code">
								<CodeBlock title="Nested code" code="const rule = 'default';" />
							</div>
						</TerminalPanel>
					{/if}
				</div>
			</PageSection>
		{/each}
		<!-- A product wrapper around the last section: it is still the last page section. -->
		<div class="divider-wrapper" data-testid="last-wrapper">
			<PageSection id={last.id} aria-labelledby="{last.id}-heading" class="divider-section">
				<div class="mx-auto max-w-5xl px-6">{@render text(last)}</div>
			</PageSection>
		</div>
	</PageSections>
</main>

<SiteFooter tagline={copy.tagline} {groups} edge={edge}>
	{#snippet brand()}
		<a href={home} class="inline-flex min-h-[var(--size-tap-min)] items-center font-heading text-xl font-bold text-foreground no-underline">yesid<span class="text-primary">.</span></a>
	{/snippet}
</SiteFooter>

<style>
	:global(.divider-section) {
		padding-block: 3rem 3.5rem;
	}
</style>
