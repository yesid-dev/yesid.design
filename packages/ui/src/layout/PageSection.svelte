<!--
  One page section (D22). Inside `PageSections`, every section after the first is preceded by the
  boundary, so the section before it ends with the page's divider. A hand-drawn stroke overlays
  the joined section edges without inserting a blank row. The parent's `divider`
  chooses the stroke; the last section draws none, so nothing sits before the footer. A registered
  section carries `data-page-section-edges`, which hides the kit's edge rules inside it
  (`data-edge-rule`: Masthead's and ErrorPage's tape, DetailFrame's rule without a header; base.css).
  A `PageSection` nested in another, or outside `PageSections`, is a plain `<section>`.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
		children: Snippet;
	}
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Separator } from '../primitives/separator/index.js';
	import DrawnPageBoundary from './DrawnPageBoundary.svelte';
	import {
		insidePageSection,
		pageSectionsRegistry,
		provideInsidePageSection,
		type PageSectionEntry,
		type PageSectionPosition,
	} from './page-sections.js';

	let { children, ...rest }: PageSectionProps = $props();

	// A section inside another section is part of it, never a page section of its own.
	const nested = insidePageSection();
	const registry = nested ? undefined : pageSectionsRegistry();
	provideInsidePageSection(nested || registry !== undefined);
	// The parent PageSections owns the divider choice; reading it here keeps a prop change reactive.
	const divider = $derived(registry?.divider() ?? 'dimension');

	let element = $state<HTMLElement>();
	let position = $state<PageSectionPosition>({ sectionsBefore: 0, headersBefore: 0 });
	const entry: PageSectionEntry = {
		kind: 'section',
		element: null,
		setPosition: (value) => (position = value),
	};
	if (registry) {
		onDestroy(registry.register(entry));
		position = registry.position(entry);
	}

	$effect(() => {
		if (!registry) return;
		entry.element = element ?? null;
		registry.refresh();
	});
</script>

{#if registry && position.sectionsBefore > 0}
	{#if divider === 'hand-drawn'}
		<DrawnPageBoundary inkIndex={position.sectionsBefore - 1 + position.headersBefore} />
	{:else}
		<Separator variant={divider} class="page-section-boundary" data-slot="page-section-boundary" />
	{/if}
{/if}
<section
	bind:this={element}
	{...rest}
	data-slot="page-section"
	data-page-section-edges={registry ? '' : undefined}
>
	{@render children()}
</section>
