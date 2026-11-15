<!--
  One page section (D22). Inside `PageSections`, every section after the first is preceded by the
  boundary row, so the section before it ends with the dimension line: a real row in the flow,
  outside both sections' boxes, so nothing a section paints can cover it. The last section draws
  none, so nothing sits before the footer. A registered section carries
  `data-page-section-edges`, which hides the kit's edge rules inside it (`data-edge-rule`:
  Masthead's and ErrorPage's tape, DetailFrame's rule without a header; base.css). A
  `PageSection` nested in another, or outside `PageSections`, is a plain `<section>`.
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
	<Separator variant="dimension" class="page-section-boundary" data-slot="page-section-boundary" />
{/if}
<section
	bind:this={element}
	{...rest}
	data-slot="page-section"
	data-page-section-edges={registry ? '' : undefined}
>
	{@render children()}
</section>
