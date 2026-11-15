<script lang="ts">
	import { CollapsibleSection, TocPill, createSectionJump } from '@yesid/ui/brand';
	import type { TocEntry } from '@yesid/ui/brand';
	import { SurfaceRail } from '@yesid/ui/layout';

	// The clearance pattern is opt-in: the app puts .chrome-clearance on its scrolling element.
	$effect(() => {
		document.documentElement.classList.add('chrome-clearance');
		return () => document.documentElement.classList.remove('chrome-clearance');
	});

	const ids = ['period', 'method', 'sources', 'limits', 'contact'];
	const entries: TocEntry[] = ids.map((id) => ({ id, title: `Section ${id}`, level: 2, children: [] }));
	const navigation = createSectionJump();
	$effect(() => navigation.register(entries));
</script>

<svelte:head><title>Chrome clearance</title></svelte:head>

{#snippet rail()}
	<p class="label-reading">Filters</p>
	<button type="button" class="rail-button">Weekdays</button>
	<button type="button" class="rail-button">Weekends</button>
{/snippet}

<div data-register="reading" data-ripple-exempt class="clearance">
	<h1 id="clearance-title" class="text-title font-heading font-bold">Chrome clearance</h1>
	<p>
		This page puts <code>.chrome-clearance</code> on <code>&lt;html&gt;</code>. Below 1024px the contents pill stacks
		above the rail pill, and focus and fragment jumps land clear of the header and both pills.
	</p>
	{#each ids as id (id)}
		<CollapsibleSection title={`Section ${id}`} anchor={id}>
			{#each [1, 2, 3, 4] as n (n)}
				<p>
					Paragraph {n} of {id}. Readers move through this text with the keyboard, and every link stays visible when it
					takes focus. <a href="#clearance-title" data-fixture="prose-link">Link {n} in {id}</a>.
				</p>
			{/each}
		</CollapsibleSection>
	{/each}
</div>

<TocPill {entries} {navigation} openAria="Open contents" closeAria="Close contents" />
<SurfaceRail {rail} label="Filters" summary="All days" openAria="Open filters" closeAria="Close filters" />

<style>
	.clearance {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding-block-end: 12rem;
	}
	.rail-button {
		min-height: 44px;
		padding-inline: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}
</style>
