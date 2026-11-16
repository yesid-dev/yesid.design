<!--
  The page's sections (D22). Wrap a page's `PageSection`s, at any depth: every section but the
  last ends with the page's divider, drawn by the kit as its own row between two sections, and no
  divider ever sits before the footer. `divider` picks that divider for every registered section
  (`dimension` by default, `hand-drawn` for the owner's 16 November 2026 page default, or `hazard`);
  a change follows through immediately. Wrappers between this element and a section do not matter;
  plain `<section>` elements do not register. Renders a `<div>` with the caller's attributes.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { PageDivider } from './page-sections.js';

	export interface PageSectionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		children: Snippet;
		/** The divider between sections: `dimension` (default), `hand-drawn` or `hazard`. */
		divider?: PageDivider;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import { createPageSectionsRegistry, providePageSections } from './page-sections.js';

	let { children, divider = 'dimension', class: className, ...rest }: PageSectionsProps = $props();

	// The registry reads the prop, so a section's boundary follows a change to the parent's choice.
	providePageSections(createPageSectionsRegistry(() => divider));
</script>

<div {...rest} class={cn('page-sections', className)} data-slot="page-sections">
	{@render children()}
</div>
