<!--
  The page's sections (D22). Wrap a page's `PageSection`s, at any depth: every section but the
  last ends with the dimension line, drawn by the kit as its own row between two sections, and no
  divider ever sits before the footer. Wrappers between this element and a section do not matter;
  plain `<section>` elements do not register. Renders a `<div>` with the caller's attributes.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface PageSectionsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import { createPageSectionsRegistry, providePageSections } from './page-sections.js';

	let { children, class: className, ...rest }: PageSectionsProps = $props();

	providePageSections(createPageSectionsRegistry());
</script>

<div {...rest} class={cn('page-sections', className)} data-slot="page-sections">
	{@render children()}
</div>
