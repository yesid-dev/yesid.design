<!--
  @component
  Experimental. A section title on the side rail (D23). From 1024px it is rotated on the left or
  right rail, outside the section's centred content, and sticky: it stays in view, clear of the
  header pill, while its section scrolls, then the next section's title takes over. Below 1024px it
  reads horizontally at the top of its section. It is the section's real heading (`h2` by default),
  first in the section's DOM order, and ends on the brand's orange dot like SectionHeading.

  With `children`, RailTitle lays out the section: a rail on each side (so the content stays
  centred) and the content between them; the title takes its own rail. Without `children` it draws
  only the title, for a frame that owns its rail column, as ListingFrame does.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export interface RailTitleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** The section title. */
		heading: string;
		/** The rail the title sits on from 1024px. The left title reads bottom to top, the right top to bottom. Defaults to `left`. */
		side?: 'left' | 'right';
		/** The heading level. Defaults to 2. */
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		/** The heading's id, for example for the section's `aria-labelledby`. */
		titleId?: string;
		/** Ends the title on the brand's orange dot, as SectionHeading and Masthead do. Defaults to true. */
		dot?: boolean;
		/**
		 * The rotated title's font size, for example one size shared by every title on a page. It is
		 * capped by the rail width and shrinks to fit the viewport height.
		 */
		size?: string;
		/**
		 * Draws the title as hidden decoration instead of a heading, for a frame whose real heading is
		 * elsewhere (ListingFrame's `edgeTitle`). Defaults to false.
		 */
		decorative?: boolean;
		/** The section's content. With it, RailTitle lays out both rails and centres the content between them. */
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';

	let {
		heading,
		side = 'left',
		level = 2,
		titleId,
		dot = true,
		size,
		decorative = false,
		children,
		class: className,
		style,
		...restProps
	}: RailTitleProps = $props();

	const tag = $derived(decorative ? 'div' : (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'));
	// The dot follows the last word with no break opportunity before it, so it stays on that word's
	// line, as in SectionHeading; a word wider than a phone column still breaks inside.
	const parts = $derived.by(() => {
		const match = /^([\s\S]*\s)(\S+)$/.exec(heading);
		return match ? { head: match[1], tail: match[2] } : { head: '', tail: heading };
	});
	const sizeStyle = $derived(
		[size ? `--rail-title-size: ${size}` : '', style ?? ''].filter(Boolean).join('; ') || undefined,
	);

	let titleEl = $state<HTMLElement>();

	// Shrinks a rotated title that is longer than the room under the header pill; CSS sizes it first.
	$effect(() => {
		const title = titleEl;
		if (!title || typeof window === 'undefined') return;
		const wide = window.matchMedia('(min-width: 1024px)');
		let frame = 0;
		const fit = (): void => {
			title.style.removeProperty('--rail-title-fit');
			if (!wide.matches) return;
			const room = title.clientHeight;
			const length = title.scrollHeight;
			if (room <= 0 || length <= room + 1) return;
			const current = parseFloat(getComputedStyle(title).fontSize);
			title.style.setProperty('--rail-title-fit', `${Math.floor((current * room) / length)}px`);
		};
		const schedule = (): void => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(fit);
		};
		fit();
		document.fonts?.ready.then(schedule).catch(() => {});
		window.addEventListener('resize', schedule);
		wide.addEventListener('change', schedule);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', schedule);
			wide.removeEventListener('change', schedule);
		};
	});
</script>

{#snippet title(extraClass?: string, attributes?: Record<string, unknown>)}
	<div
		class={cn('rail-title', extraClass)}
		data-slot="rail-title"
		data-side={side}
		aria-hidden={decorative ? 'true' : undefined}
		{...attributes}
	>
		<svelte:element
			this={tag}
			bind:this={titleEl}
			id={decorative ? undefined : titleId}
			class="rail-title-text"
			data-slot="rail-title-text"
			>{#if dot}{parts.head}<span class="rail-title-tail"
					>{parts.tail}<span class="rail-title-dot" data-slot="rail-title-dot" aria-hidden="true">.</span></span
				>{:else}{heading}{/if}</svelte:element
		>
	</div>
{/snippet}

{#if children}
	<div class="rail-title-layout" data-slot="rail-title-layout" data-side={side} style={sizeStyle} {...restProps}>
		{@render title(className)}
		<div class="rail-title-content" data-slot="rail-title-content">{@render children()}</div>
	</div>
{:else}
	{@render title(className, { ...restProps, style: sizeStyle })}
{/if}

<style>
	.rail-title {
		--rail-title-rail-width: var(--rail-title-rail, clamp(4.5rem, 8vw, 8rem));
		--rail-title-sticky-top: var(--rail-title-top, calc(var(--chrome-offset, var(--nav-clearance, 0px)) + 1rem));
		min-width: 0;
	}

	/* Phones and tablets: the horizontal heading at the top of its section, in SectionHeading's look. */
	.rail-title-text {
		margin: 0;
		font-family: var(--font-heading);
		font-size: var(--text-display);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: var(--foreground);
		overflow-wrap: anywhere;
	}

	.rail-title-dot {
		color: var(--primary);
	}

	.rail-title-layout {
		display: block;
		min-width: 0;
	}

	.rail-title-layout > .rail-title {
		padding-inline: var(--space-page-x);
		margin-block-end: var(--space-card-gap, 1.5rem);
	}

	.rail-title-content {
		min-width: 0;
	}

	@media (min-width: 1024px) {
		/* The rail: sticky under the header pill, the title rotated and never wider than the rail. */
		.rail-title {
			position: sticky;
			top: var(--rail-title-sticky-top);
			align-self: start;
			display: flex;
			justify-content: center;
		}

		.rail-title-text {
			max-height: calc(100dvh - var(--rail-title-sticky-top) - 1.5rem);
			writing-mode: vertical-rl;
			font-size: min(
				var(--rail-title-fit, var(--rail-title-size, min(clamp(3.5rem, 7vw, 6rem), 5.5dvh))),
				0.875 * var(--rail-title-rail-width)
			);
			line-height: 1;
			letter-spacing: -0.04em;
			white-space: nowrap;
			overflow-wrap: normal;
		}

		.rail-title[data-side='left'] .rail-title-text {
			rotate: 180deg;
		}

		/* Both rails keep the same width, so the content stays centred between them. */
		.rail-title-layout {
			display: grid;
			grid-template-columns:
				var(--rail-title-rail, clamp(4.5rem, 8vw, 8rem))
				minmax(0, 1fr)
				var(--rail-title-rail, clamp(4.5rem, 8vw, 8rem));
		}

		.rail-title-layout > .rail-title {
			grid-row: 1;
			grid-column: 1;
			padding-inline: 0;
			margin-block-end: 0;
		}

		.rail-title-layout > .rail-title[data-side='right'] {
			grid-column: 3;
		}

		.rail-title-layout > .rail-title-content {
			grid-row: 1;
			grid-column: 2;
		}
	}
</style>
