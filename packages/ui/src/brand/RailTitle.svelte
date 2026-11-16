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
		/** Font size for the phone/tablet title and the too-long-to-rotate fallback. Defaults to the display token. */
		horizontalSize?: string;
		/**
		 * Draws the title as hidden decoration instead of a heading, for a frame whose real heading is
		 * elsewhere (ListingFrame's `edgeTitle`). Defaults to false.
		 */
		decorative?: boolean;
		/**
		 * Clips the departing title's text above the sticky clearance line, so it never paints under
		 * the header pill. Set false to let the title leave naturally with its section; sticky
		 * placement, scrollport fitting, the 12px horizontal fallback and every other behaviour stay
		 * the same. Defaults to true.
		 */
		clipAtHeader?: boolean;
		/** The section's content. With it, RailTitle lays out both rails and centres the content between them. */
		children?: Snippet;
		class?: string;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { cn } from '../cn/index.js';

	let {
		heading,
		side = 'left',
		level = 2,
		titleId,
		dot = true,
		size,
		horizontalSize,
		decorative = false,
		clipAtHeader = true,
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
		[
			size ? `--rail-title-size: ${size}` : '',
			horizontalSize ? `--rail-title-horizontal-size: ${horizontalSize}` : '',
			style ?? '',
		].filter(Boolean).join('; ') || undefined,
	);

	let railEl = $state<HTMLElement>();
	let titleEl = $state<HTMLElement>();

	/** Below this the rotated title would be unreadable; it reads horizontally instead. */
	const FLOOR_PX = 12;
	/** Room kept under the rotated title, inside the scrollport. */
	const BOTTOM_GAP_PX = 24;

	/** The box whose scrollport the sticky title follows: the nearest scrolling ancestor, else the viewport. */
	function scrollContainer(element: HTMLElement): HTMLElement | null {
		for (let node = element.parentElement; node; node = node.parentElement) {
			if (node === document.body || node === document.documentElement) return null;
			if (/(auto|scroll|hidden|overlay)/.test(getComputedStyle(node).overflowY)) return node;
		}
		return null;
	}

	function scrollport(container: HTMLElement | null): { top: number; height: number } {
		if (!container) return { top: 0, height: window.innerHeight };
		return { top: container.getBoundingClientRect().top + container.clientTop, height: container.clientHeight };
	}

	let container: HTMLElement | null = null;
	let observed: HTMLElement | null = null;
	let observer: ResizeObserver | undefined;
	let scrollTarget: HTMLElement | Window | undefined;
	let wide: MediaQueryList | undefined;
	let stickyTop: number | null = null;
	let frame = 0;
	let clipFrame = 0;

	/** Follows the scrollport the title sticks in: observes its size and listens to its scrolling. */
	function bindScrollport(rail: HTMLElement): void {
		container = scrollContainer(rail);
		const target: HTMLElement | Window = container ?? window;
		if (target !== scrollTarget) {
			scrollTarget?.removeEventListener('scroll', scheduleClip);
			target.addEventListener('scroll', scheduleClip, { passive: true });
			scrollTarget = target;
		}
		if (container !== observed) {
			if (observed) observer?.unobserve(observed);
			if (container) observer?.observe(container);
			observed = container;
		}
	}

	/**
	 * Keeps the departing title's painted text below the sticky clearance line, so it never slides
	 * under the header pill (or anything above that line) as its section scrolls away. With
	 * `clipAtHeader={false}` the title leaves naturally with its section and nothing is clipped.
	 */
	function clip(): void {
		const rail = railEl;
		if (!rail) return;
		if (!clipAtHeader) {
			rail.style.removeProperty('clip-path');
			return;
		}
		if (stickyTop === null) {
			rail.style.removeProperty('clip-path');
			return;
		}
		const cut = scrollport(container).top + stickyTop - rail.getBoundingClientRect().top;
		if (cut > 0.5) rail.style.setProperty('clip-path', `inset(${Math.ceil(cut)}px 0 0 0)`);
		else rail.style.removeProperty('clip-path');
	}

	/**
	 * Fits the rotated title to the room between the sticky clearance and the bottom of its actual
	 * scrollport. A title that would need less than the 12px floor reads horizontally instead.
	 */
	function fit(): void {
		const rail = railEl;
		const title = titleEl;
		if (!rail || !title) return;
		rail.style.removeProperty('--rail-title-fit');
		rail.style.removeProperty('--rail-title-room');
		delete rail.dataset.fit;
		stickyTop = null;
		bindScrollport(rail);
		if (!wide?.matches) {
			clip();
			return;
		}
		const style = getComputedStyle(rail);
		const top = style.position === 'sticky' ? parseFloat(style.top) || 0 : null;
		const room = Math.max(0, scrollport(container).height - (top ?? 0) - BOTTOM_GAP_PX);
		rail.style.setProperty('--rail-title-room', `${room}px`);
		const base = parseFloat(getComputedStyle(title).fontSize);
		const length = title.scrollHeight;
		if (length > room + 1) {
			const fitted = Math.floor((base * room) / length);
			if (fitted >= FLOOR_PX) rail.style.setProperty('--rail-title-fit', `${fitted}px`);
			else rail.dataset.fit = 'horizontal';
		}
		if (rail.dataset.fit !== 'horizontal') stickyTop = top;
		clip();
	}

	function schedule(): void {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(fit);
	}

	function scheduleClip(): void {
		cancelAnimationFrame(clipFrame);
		clipFrame = requestAnimationFrame(clip);
	}

	// Observes the scrollport, the title's own size, the breakpoint and the web font.
	$effect(() => {
		const rail = railEl;
		const title = titleEl;
		if (!rail || !title || typeof window === 'undefined') return;
		wide = window.matchMedia('(min-width: 1024px)');
		observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
		observer?.observe(title);
		// Content above may move the title without a scroll; the clip follows the page's size.
		const pageObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleClip);
		pageObserver?.observe(document.documentElement);
		window.addEventListener('resize', schedule);
		wide.addEventListener('change', schedule);
		document.fonts?.ready.then(schedule).catch(() => {});
		fit();
		return () => {
			cancelAnimationFrame(frame);
			cancelAnimationFrame(clipFrame);
			observer?.disconnect();
			pageObserver?.disconnect();
			observer = undefined;
			observed = null;
			scrollTarget?.removeEventListener('scroll', scheduleClip);
			scrollTarget = undefined;
			window.removeEventListener('resize', schedule);
			wide?.removeEventListener('change', schedule);
		};
	});

	// Refits when the words or sizing inputs change; effects run after the DOM has the new text.
	$effect(() => {
		void [heading, dot, size, horizontalSize, level, decorative, side, clipAtHeader];
		untrack(fit);
	});
</script>

{#snippet title(extraClass?: string, attributes?: Record<string, unknown>)}
	<div
		bind:this={railEl}
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
		font-size: var(--rail-title-horizontal-size, var(--text-display));
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
			/* The script measures the room in the real scrollport; this covers the first paint. */
			max-height: var(--rail-title-room, calc(100dvh - var(--rail-title-sticky-top) - 1.5rem));
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

		/* Too long to rotate at 12px or more in this scrollport: the horizontal form, above the content. */
		.rail-title[data-fit='horizontal'] {
			position: static;
			justify-content: flex-start;
		}

		.rail-title[data-fit='horizontal'] .rail-title-text {
			max-height: none;
			writing-mode: horizontal-tb;
			rotate: none;
			font-size: var(--rail-title-horizontal-size, var(--text-display));
			line-height: 1.05;
			letter-spacing: -0.02em;
			white-space: normal;
			overflow-wrap: anywhere;
		}

		.rail-title-layout > .rail-title[data-fit='horizontal'] {
			grid-column: 2;
			margin-block-end: var(--space-card-gap, 1.5rem);
		}

		.rail-title-layout:has(> .rail-title[data-fit='horizontal']) > .rail-title-content {
			grid-row: 2;
		}
	}
</style>
