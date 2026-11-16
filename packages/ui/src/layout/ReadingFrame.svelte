<!--
  Experimental. A calm reading frame for legal pages and long prose: an Inter title in sentence
  case, the real date of the last change when the text has one, a short summary, a contents list
  and the body, on a measure of about 65 to 70 characters. No canvas, tape, mono labels, numbering
  or glow. Products keep the copy, the schema and server rendering; section ids come from
  language-independent keys, so `#contact` reaches the same section in English, French and Spanish.
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
		/** The text's real revision metadata. Omit it when no authored date exists. */
		updated?: ReadingFrameUpdated;
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
	const ISO_DATETIME =
		/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-](\d{2}):?(\d{2}))?)?$/;

	/**
	 * Returns the date when it is a real ISO 8601 calendar date (optionally with a time and offset),
	 * checked field by field without Date parsing, so the result never depends on the runtime.
	 */
	function checkedDatetime(datetime: string): string {
		const match = ISO_DATETIME.exec(datetime);
		const fail = () => {
			throw new Error(`ReadingFrame: updated.datetime must be a real ISO 8601 date, got "${datetime}"`);
		};
		if (!match) return fail();
		const [, y, mo, d, h = '0', mi = '0', se = '0', oh = '0', om = '0'] = match;
		const year = Number(y);
		const month = Number(mo);
		const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
		const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
		const day = Number(d);
		if (days === undefined || day < 1 || day > days) return fail();
		if (Number(h) > 23 || Number(mi) > 59 || Number(se) > 59 || Number(oh) > 23 || Number(om) > 59) return fail();
		return datetime;
	}

	/**
	 * Returns the validated date for a supplied update, or no date when it is omitted. A null
	 * update is rejected rather than treated as omission.
	 */
	function checkedUpdate(updated: ReadingFrameUpdated | undefined): string | undefined {
		if (updated === undefined) return undefined;
		if (!updated || typeof updated !== 'object') {
			throw new Error('ReadingFrame: updated must be an object with datetime, label and text, or be omitted');
		}
		return checkedDatetime(updated.datetime);
	}

	/** Throws when an id is not a stable slug or appears twice. */
	function checkedSections(
		sections: readonly ReadingFrameSection[] = [],
		contentsLabel: string | undefined,
		ownContents: boolean,
	): readonly ReadingFrameSection[] {
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
	// The date is read by the update row, which is absent when the product has no revision date.
	const datetime = $derived(checkedUpdate(updated));
	const entries = $derived(checkedSections(sections, contentsLabel, contents !== undefined));
	const showBuiltInContents = $derived(!contents && entries.length > 0);
</script>

<article data-slot="reading-frame" class={cn('reading-frame', className)} {...restProps}>
	<header class="reading-frame__header">
		<h1 class="reading-frame__title" id={titleId}>{title}</h1>
		{#if datetime !== undefined && updated}
			<p class="reading-frame__updated" data-slot="reading-frame-updated">
				{updated.label}
				<time datetime={datetime}>{updated.text}</time>
			</p>
		{/if}
		{#if summary}
			<div class="reading-frame__summary" data-slot="reading-frame-summary">{@render summary()}</div>
		{/if}
	</header>

	{#if contents}
		<div class="reading-frame__contents" data-slot="reading-frame-contents">{@render contents()}</div>
	{:else if showBuiltInContents}
		<nav class="reading-frame__contents" data-slot="reading-frame-contents" aria-labelledby={contentsHeadingId}>
			<h2 class="reading-frame__contents-heading" id={contentsHeadingId}>{contentsLabel}</h2>
			<!-- Unnumbered; role="list" keeps list semantics in Safari once list-style is none. -->
			<ul class="reading-frame__contents-list" role="list">
				{#each entries as section (section.id)}
					<li><a class="reading-frame__contents-link" href={`#${section.id}`}>{section.title}</a></li>
				{/each}
			</ul>
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
		padding: 0;
		list-style: none;
	}

	/* A full tap target (44px) around each entry, still an orange underlined text link. */
	.reading-frame__contents-link {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min, 44px);
		min-inline-size: var(--size-tap-min, 44px);
		color: var(--primary);
		text-decoration-line: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.reading-frame__contents-link:hover {
		text-decoration-thickness: 2px;
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
