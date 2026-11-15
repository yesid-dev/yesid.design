<!--
  Experimental. A calm reading frame for legal pages and long prose: an Inter title in sentence
  case, the real date of the last change, a short summary, a contents list and the body, on a
  measure of about 65 to 70 characters. No canvas, tape, mono labels, numbering or glow. Products
  keep the copy, the schema and server rendering; section ids come from language-independent keys,
  so `#contact` reaches the same section in English, French and Spanish.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** A contents entry. `id` is the body section's id, the same in every language. */
	export interface ReadingFrameSection {
		id: string;
		title: string;
	}

	export interface ReadingFrameUpdated {
		/** The ISO 8601 date (YYYY-MM-DD, optionally with a time) of the last real change. */
		datetime: string;
		/** Product copy before the date, such as "Last updated". */
		label: string;
		/** The date as the product formats it for the page's language. */
		text: string;
	}

	/** Experimental: the shape may change in a minor release, with migration notes. */
	export interface ReadingFrameProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> {
		title: string;
		updated: ReadingFrameUpdated;
		/** A short summary under the date: what the text covers, in two or three sentences. */
		summary?: Snippet;
		/** Entries for the built-in contents list. Ids are lowercase ASCII slugs, unique on the page. */
		sections?: ReadingFrameSection[];
		/** The visible heading of the built-in contents list; required with `sections`. */
		contentsLabel?: string;
		/** Replaces the built-in contents list, for a product that renders its own navigation. */
		contents?: Snippet;
		/** The body: the product's own sections, each with the id its contents entry names. */
		children: Snippet;
		/** The title's id, for a landmark that names itself after the title. */
		titleId?: string;
	}

	const SECTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
	const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/;

	/** Throws when an id is not a stable slug or appears twice, or when the date is not ISO 8601. */
	function checkedSections(
		updated: ReadingFrameUpdated,
		sections: readonly ReadingFrameSection[] = [],
		contentsLabel: string | undefined,
		ownContents: boolean,
	): readonly ReadingFrameSection[] {
		if (!ISO_DATE.test(updated.datetime)) {
			throw new Error(`ReadingFrame: updated.datetime must be an ISO 8601 date, got "${updated.datetime}"`);
		}
		const seen = new Set<string>();
		for (const { id } of sections) {
			if (!SECTION_ID.test(id)) {
				throw new Error(`ReadingFrame: section id "${id}" must be a lowercase ASCII slug from a language-independent key`);
			}
			if (seen.has(id)) throw new Error(`ReadingFrame: section id "${id}" appears twice`);
			seen.add(id);
		}
		if (!ownContents && sections.length > 0 && !contentsLabel) {
			throw new Error('ReadingFrame: contentsLabel is required with sections');
		}
		return sections;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';

	let {
		title,
		updated,
		summary,
		sections,
		contentsLabel,
		contents,
		children,
		titleId,
		class: className,
		...restProps
	}: ReadingFrameProps = $props();

	const uid = $props.id();
	const contentsHeadingId = `${uid}-contents`;
	// Checked during server rendering too: a malformed date or id fails loudly instead of shipping.
	const entries = $derived(checkedSections(updated, sections, contentsLabel, contents !== undefined));
	const showBuiltInContents = $derived(!contents && entries.length > 0);
</script>

<article data-slot="reading-frame" class={cn('reading-frame', className)} {...restProps}>
	<header class="reading-frame__header">
		<h1 class="reading-frame__title" id={titleId}>{title}</h1>
		<p class="reading-frame__updated" data-slot="reading-frame-updated">
			{updated.label}
			<time datetime={updated.datetime}>{updated.text}</time>
		</p>
		{#if summary}
			<div class="reading-frame__summary" data-slot="reading-frame-summary">{@render summary()}</div>
		{/if}
	</header>

	{#if contents}
		<div class="reading-frame__contents" data-slot="reading-frame-contents">{@render contents()}</div>
	{:else if showBuiltInContents}
		<nav class="reading-frame__contents" data-slot="reading-frame-contents" aria-labelledby={contentsHeadingId}>
			<h2 class="reading-frame__contents-heading" id={contentsHeadingId}>{contentsLabel}</h2>
			<ol class="reading-frame__contents-list">
				{#each entries as section (section.id)}
					<li><a href={`#${section.id}`}>{section.title}</a></li>
				{/each}
			</ol>
		</nav>
	{/if}

	<div class="reading-frame__body" data-slot="reading-frame-body">
		{@render children()}
	</div>
</article>

<style>
	/* The measure is in em of the reading size: 34em of Inter holds about 65 to 70 characters. */
	.reading-frame {
		box-sizing: content-box;
		max-width: var(--reading-measure, 34em);
		margin-inline: auto;
		padding-inline: var(--reading-gutter, 1rem);
		padding-block: 2rem 4rem;
		color: var(--foreground);
		font-family: var(--font-body);
		font-size: var(--text-reading);
		line-height: 1.65;
		overflow-wrap: break-word;
	}

	@media (min-width: 1024px) {
		.reading-frame {
			font-size: var(--text-reading-desktop);
		}
	}

	.reading-frame__header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reading-frame__title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: var(--text-title);
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.01em;
		text-transform: none;
		text-wrap: balance;
		color: var(--foreground);
	}

	.reading-frame__updated {
		margin: 0;
		font-size: var(--text-small);
		line-height: 1.5;
		color: var(--muted-foreground);
	}

	.reading-frame__summary {
		color: var(--foreground);
	}

	.reading-frame__summary :global(:where(p)) {
		margin: 0;
	}

	.reading-frame__summary :global(:where(p + p)) {
		margin-block-start: 0.75em;
	}

	.reading-frame__contents {
		margin-block-start: 2rem;
		padding-block: 1rem;
		border-block: 1px solid var(--border);
	}

	.reading-frame__contents-heading {
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-size: var(--text-small);
		font-weight: 600;
		line-height: 1.4;
		color: var(--muted-foreground);
	}

	.reading-frame__contents-list {
		margin: 0;
		padding-inline-start: 1.25em;
		list-style: decimal;
	}

	.reading-frame__contents-list li + li {
		margin-block-start: 0.25rem;
	}

	.reading-frame__body {
		margin-block-start: 2rem;
	}

	/* Zero-specificity rhythm, so the product's own content styles win. */
	.reading-frame__body :global(:where(h2)) {
		margin: 2.5rem 0 0.75rem;
		font-family: var(--font-heading);
		font-size: var(--text-reading-heading);
		font-weight: 700;
		line-height: 1.3;
		text-wrap: balance;
	}

	.reading-frame__body :global(:where(h3)) {
		margin: 1.75rem 0 0.5rem;
		font-family: var(--font-heading);
		font-size: var(--text-reading-support);
		font-weight: 600;
		line-height: 1.35;
	}

	.reading-frame__body :global(:where(p, ul, ol)) {
		margin: 0 0 1em;
	}

	@media (min-width: 1024px) {
		.reading-frame__body :global(:where(h2)) {
			font-size: var(--text-reading-heading-desktop);
		}
	}
</style>
