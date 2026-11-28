<!--
  Embedded results card for a listing whose page already owns the title, dated answer and
  frame-level filters. Owns region order and spacing rhythm: title row, search, summary, sort,
  results, more. Absent regions emit no element and reserve no space. With `resultCountText`, an
  always-present visually hidden polite status announces count changes.
  `presentation="regions"` drops the card's own frame for a parent card that already has one.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ListingBodyProps {
		/**
		 * `section` (default) draws the bordered, padded card. `regions` draws no border, background
		 * or padding and keeps present regions 12px apart at every width, for use inside a parent card.
		 */
		presentation?: 'section' | 'regions';
		/** Card heading, e.g. "Every measured line". */
		title?: string;
		/** Heading element level when `title` is set. Defaults to 2. */
		titleLevel?: 2 | 3;
		/** Content beside the card heading, e.g. a Stamp. */
		titleAside?: Snippet;
		/** Search input and any page-specific search helpers. */
		search?: Snippet;
		/** Active filter summary, breakdown or clear action. */
		summary?: Snippet;
		/**
		 * Result count in words, for example from `filterCountText`. Whenever defined, an
		 * always-present visually hidden polite status announces changes.
		 */
		resultCountText?: string;
		/** Sort rail or compact sort control. */
		sort?: Snippet;
		/** Results content: a DataTable, cards, or a StateNotice for empty or error states. */
		children: Snippet;
		/** Paging footer such as ShowMore and the displayed share. */
		more?: Snippet;
	}
</script>

<script lang="ts">
	let {
		presentation = 'section',
		title,
		titleLevel = 2,
		titleAside,
		search,
		summary,
		resultCountText,
		sort,
		children,
		more,
	}: ListingBodyProps = $props();

	const titleId = $props.id();
	const hasTitle = $derived(title !== undefined && title.length > 0);
</script>

<section
	class={presentation === 'regions' ? 'listing-body-regions' : 'listing-body'}
	data-slot="listing-body"
	aria-labelledby={hasTitle ? titleId : undefined}
>
	{#if hasTitle || titleAside}
		<header class="listing-body-header" data-slot="listing-body-header">
			{#if hasTitle}
				{#if titleLevel === 3}
					<h3 id={titleId} class="listing-body-title" data-slot="listing-body-title">{title}</h3>
				{:else}
					<h2 id={titleId} class="listing-body-title" data-slot="listing-body-title">{title}</h2>
				{/if}
			{/if}
			{#if titleAside}
				<div class="listing-body-aside" data-slot="listing-body-aside">{@render titleAside()}</div>
			{/if}
		</header>
	{/if}

	{#if search}
		<div class="listing-body-search" data-slot="listing-body-search">{@render search()}</div>
	{/if}

	{#if summary}
		<div class="listing-body-summary" data-slot="listing-body-summary">{@render summary()}</div>
	{/if}

	{#if resultCountText !== undefined}
		<p class="sr-only" role="status" data-slot="listing-body-result-status">{resultCountText}</p>
	{/if}

	{#if sort}
		<div class="listing-body-sort" data-slot="listing-body-sort">{@render sort()}</div>
	{/if}

	<div class="listing-body-results" data-slot="listing-body-results">{@render children()}</div>

	{#if more}
		<div class="listing-body-more" data-slot="listing-body-more">{@render more()}</div>
	{/if}
</section>

<style>
	.listing-body,
	.listing-body-regions {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		min-width: 0;
	}

	.listing-body {
		padding: var(--space-card-gap);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--card-foreground);
	}

	.listing-body-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 0.75rem;
		min-width: 0;
	}

	.listing-body-title {
		margin: 0;
		min-width: 0;
		font-family: var(--font-heading);
		font-size: var(--text-card-title);
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: var(--tracking-tight);
		color: var(--foreground);
		overflow-wrap: break-word;
	}

	.listing-body-aside {
		min-width: 0;
		max-width: 100%;
	}

	.listing-body-search,
	.listing-body-summary,
	.listing-body-sort,
	.listing-body-results,
	.listing-body-more {
		min-width: 0;
	}

	.listing-body-summary :global([data-slot='filter-summary']) {
		margin-bottom: 0;
	}

	@media (min-width: 768px) {
		.listing-body {
			gap: 1rem;
		}
	}
</style>
