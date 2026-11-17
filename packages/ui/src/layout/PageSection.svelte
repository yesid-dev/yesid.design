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
	import {
		insidePageSection,
		pageSectionsRegistry,
		provideInsidePageSection,
		type PageSectionEntry,
	} from './page-sections.js';

	let { children, ...rest }: PageSectionProps = $props();

	// A section inside another section is part of it, never a page section of its own.
	const nested = insidePageSection();
	const registry = nested ? undefined : pageSectionsRegistry();
	provideInsidePageSection(nested || registry !== undefined);
	// The parent PageSections owns the divider choice; reading it here keeps a prop change reactive.
	const divider = $derived(registry?.divider() ?? 'dimension');

	let element = $state<HTMLElement>();
	let first = $state(true);
	const entry: PageSectionEntry = { element: null, setFirst: (value) => (first = value) };
	if (registry) {
		onDestroy(registry.register(entry));
		first = registry.isFirst(entry);
	}

	$effect(() => {
		if (!registry) return;
		entry.element = element ?? null;
		registry.refresh();
	});
</script>

{#if registry && !first}
	<Separator variant={divider} class="page-section-boundary" data-slot="page-section-boundary" />
{/if}
<section
	bind:this={element}
	{...rest}
	data-slot="page-section"
	data-page-section-edges={registry ? '' : undefined}
>
	{@render children()}
</section>

<style>
	/* A zero-height anchor keeps the section backgrounds touching. */
	:global(.page-section-boundary[data-variant='hand-drawn']) {
		position: relative;
		height: 0;
		z-index: 1;
		overflow: visible;
	}

	:global(.page-section-boundary[data-variant='hand-drawn'] > .hand-drawn-line-art) {
		position: absolute;
		inset: -10px 0 auto;
		height: 20px;
		/* Only the part above the section edge paints, matching the reference's fine, fading ink.
		   Standalone/card strokes keep their full canvas and are unaffected. */
		clip-path: inset(0 0 50%);
	}
</style>
