<!--
  Section title with the brand dot, or a mono overline when only `overline` is set.
  The dot stays on the last word's line and is hidden from assistive tech.
  `size="title"` is the compact screen title for task and reading screens.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
		heading?: string;
		subheading?: string;
		/**
		 * Signage only: a short route plate, sign code or board name in tracked mono uppercase.
		 * Never a label above a heading and never a reading label; use `heading`, or the
		 * `.label-reading` role for a sentence-case label. Ignored when `heading` is set.
		 */
		overline?: string;
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		/**
		 * `display` (default): the large section heading. `title`: the compact screen title for task
		 * and reading screens, at `--text-title`, bold with normal tracking, and a subheading in the
		 * reading label type. The overline ignores it.
		 */
		size?: 'display' | 'title';
		dot?: boolean;
		/** Leading zero-padded section number. */
		number?: number;
		numberTone?: 'rest' | 'active';
		/** Inline content after the title, such as an info trigger. */
		explainer?: Snippet;
		/** Second, accent-colored line after the heading. */
		headingAccent?: string;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import NumberedChip from './numbered-chip.internal.svelte';

	let {
		heading,
		subheading,
		overline,
		level = 2,
		size = 'display',
		dot = true,
		number,
		numberTone = 'rest',
		explainer,
		headingAccent,
		class: className,
		...restProps
	}: SectionHeadingProps = $props();

	const tag = $derived(`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
	const isOverline = $derived(overline != null && heading == null);
	const titleText = $derived(isOverline ? (overline ?? '') : (heading ?? ''));

	function splitTail(text: string): { head: string; tail: string } {
		const match = /^([\s\S]*\s)(\S+)$/.exec(text);
		return match ? { head: match[1], tail: match[2] } : { head: '', tail: text };
	}
	const titleParts = $derived(splitTail(titleText));
	const accentParts = $derived(splitTail(headingAccent ?? ''));
</script>

{#snippet brandDot()}<span data-slot="section-heading-dot" class="section-heading-dot" aria-hidden="true"
		>.</span
	>{/snippet}

<div
	data-slot="section-heading"
	data-mode={isOverline ? 'overline' : 'display'}
	data-size={size === 'title' ? 'title' : undefined}
	class={cn('section-heading', className)}
	{...restProps}
>
	<svelte:element this={tag} class={isOverline ? 'section-heading-overline' : 'section-heading-text'}>
		{#if number != null}<NumberedChip value={number} tone={numberTone} class="section-heading-chip" />{/if}<span
			class="section-heading-title"
			>{#if headingAccent && !isOverline}{titleText}<span
					data-slot="section-heading-accent"
					class="section-heading-accent"
					>{accentParts.head}<span class="section-heading-tail"
						>{accentParts.tail}{#if dot}{@render brandDot()}{/if}</span
					></span
				>{:else if dot && !isOverline}{titleParts.head}<span class="section-heading-tail"
					>{titleParts.tail}{@render brandDot()}</span
				>{:else}{titleText}{/if}</span
		>{#if explainer}<span class="section-heading-explainer">{@render explainer()}</span>{/if}
	</svelte:element>
	{#if subheading && !isOverline}
		<p data-slot="section-heading-sub" class="section-heading-sub">{subheading}</p>
	{/if}
</div>

<style>
	.section-heading-text {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-family: var(--font-heading);
		font-size: var(--text-display);
		font-weight: 900;
		color: var(--foreground);
		letter-spacing: -2px;
		margin-block-end: 6px;
	}
	.section-heading-dot {
		color: var(--primary);
	}
	.section-heading-tail {
		white-space: nowrap;
	}
	.section-heading-accent {
		display: block;
		color: var(--primary);
	}
	.section-heading-sub {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		letter-spacing: 2px;
		text-transform: uppercase;
		margin-block-end: 36px;
	}

	/* The compact screen title. The dot is a glyph of the heading text, so it scales and keeps the
	   baseline with it. The subheading takes the reading label role (`.label-reading` in base.css). */
	.section-heading[data-size='title'] .section-heading-text {
		font-size: var(--text-title);
		font-weight: 700;
		letter-spacing: normal;
	}
	.section-heading[data-size='title'] .section-heading-sub {
		font-family: var(--font-body);
		font-size: var(--text-small);
		font-weight: 600;
		line-height: 1.4;
		letter-spacing: normal;
		text-transform: none;
	}

	.section-heading-overline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		font-weight: 600;
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: color-mix(in srgb, var(--accent-text) 80%, var(--foreground));
		line-height: 1.2;
	}

	.section-heading :global(.section-heading-chip) {
		align-self: center;
	}
	.section-heading-title {
		min-width: 0;
	}
	.section-heading-explainer {
		display: inline-flex;
		align-items: center;
		align-self: center;
	}
</style>
