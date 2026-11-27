<!--
  A page's controls rail. It is sticky in a wide layout and becomes a floating pill when compact.
  AppFrame supplies its container breakpoint; a standalone rail uses the viewport. The same rail
  element stays mounted in both presentations, so its state survives. `rail` receives `closeSheet` and the current
  `presentation`; a hash link inside the open sheet closes it.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type SurfaceRailPresentation = 'desktop' | 'mobile';

	export interface SurfaceRailContext {
		closeSheet: () => void;
		presentation: SurfaceRailPresentation;
	}

	export interface SurfaceRailProps {
		rail: Snippet<[SurfaceRailContext]>;
		label: string;
		/** Current selection, shown in the pill after the label. */
		summary?: string;
		openAria: string;
		closeAria: string;
		/** Hides the pill (and closes the sheet) while false. */
		mobileVisible?: boolean;
		class?: string;
	}
</script>

<script lang="ts">
	import { getContext, onMount, tick } from 'svelte';
	import { scrollChain } from '@yesid/motion/actions';
	import { cn } from '../cn/index.js';
	import ChevronToggle from '../brand/ChevronToggle.svelte';
	import { Dialog } from 'bits-ui';
	import { desktop } from '../state/desktop.js';
	import { frameRailLayout } from './frame-rail-layout.js';

	let {
		rail,
		label,
		summary,
		openAria,
		closeAria,
		mobileVisible = true,
		class: className,
	}: SurfaceRailProps = $props();

	let sheetOpen = $state(false);
	let sheetPresent = $state(false);
	let mounted = $state(false);
	let pillBtn = $state<HTMLButtonElement>();
	let railEl = $state<HTMLElement>();
	const railId = $props.id();
	const isDesktop = getContext<(() => boolean) | undefined>(frameRailLayout) ?? (() => desktop.current);
	const presentation = $derived<SurfaceRailPresentation>(isDesktop() ? 'desktop' : 'mobile');
	// CSS owns the initial responsive layout before the frame has measured its width.
	const compact = $derived(mounted && presentation === 'mobile');

	onMount(() => { mounted = true; });

	function setOpen(open: boolean): void {
		sheetOpen = open;
		if (open) sheetPresent = true;
	}

	function closeSheet(): void {
		setOpen(false);
	}

	$effect(() => {
		if ((!isDesktop() && mobileVisible) || !sheetPresent) return;
		const focusWasInSheet = railEl?.contains(document.activeElement);
		setOpen(false);
		sheetPresent = false;
		if (!isDesktop() || !focusWasInSheet) return;

		void tick().then(() => {
			const candidates = railEl?.querySelectorAll<HTMLElement>(
				'button, a, select, input, [tabindex]:not([tabindex="-1"])',
			);
			const next = Array.from(candidates ?? []).find((candidate) => candidate.getClientRects().length);
			(next ?? railEl)?.focus({ preventScroll: true });
		});
	});
</script>

<Dialog.Root bind:open={() => sheetOpen, setOpen} onOpenChangeComplete={(open) => {
	if (open) return;
	if (!isDesktop() && mobileVisible) pillBtn?.focus({ preventScroll: true });
	sheetPresent = false;
}}>
	<div
		class="surface-rail-carrier"
		data-slot={mobileVisible ? 'surface-rail-mobile' : undefined}
		data-open={sheetOpen}
		data-present={sheetPresent}
		data-lenis-prevent={sheetPresent ? '' : undefined}
	>
		{#if mobileVisible}
			<button
				bind:this={pillBtn}
				type="button"
				class="tap-press surface-rail-pill glass-chrome"
				onclick={() => setOpen(!sheetOpen)}
				aria-haspopup="dialog"
				aria-controls={railId}
				aria-expanded={sheetOpen}
				aria-label={`${label}${summary ? ` ${summary}` : ''} · ${sheetOpen ? closeAria : openAria}`}
			>
				<span class="surface-rail-pill-copy">
					<span class="surface-rail-pill-label">{label}</span>
					{#if summary}
						<span class="surface-rail-pill-summary" data-summary={summary} aria-hidden="true">
							<span class="surface-rail-pill-summary-space">
								<span class="surface-rail-pill-summary-text">{summary}</span>
							</span>
						</span>
					{/if}
				</span>
				<ChevronToggle open={sheetOpen} size="sm" direction="down" />
			</button>
		{/if}

		<Dialog.Overlay forceMount class="surface-rail-scrim" />
		<!-- The fixed scrim and scroll container block scroll chaining without restyling body. -->
		<Dialog.Content
			id={railId}
			forceMount
			preventScroll={false}
			onInteractOutside={(event) => {
				if (event.target instanceof Node && pillBtn?.contains(event.target)) event.preventDefault();
			}}
			onCloseAutoFocus={(event) => event.preventDefault()}
		>
			{#snippet child({ props })}
				<aside
					{...props}
					bind:this={railEl}
					use:scrollChain
					class={cn('surface-rail', compact && 'surface-rail--mobile surface-rail-sheet', className)}
					role={compact ? 'dialog' : undefined}
					aria-modal={sheetPresent ? 'true' : undefined}
					aria-label={label}
					inert={compact && !sheetPresent}
					tabindex="-1"
					data-slot="surface-rail"
					data-lenis-prevent
					style:contain={compact ? 'layout style' : undefined}
					style:pointer-events={compact && !sheetOpen ? 'none' : 'auto'}
					onclick={(event) => {
						if (sheetOpen && event.target instanceof Element && event.target.closest('a[href^="#"]')) {
							closeSheet();
						}
					}}
				>
					{@render rail({ closeSheet, presentation })}
				</aside>
			{/snippet}
		</Dialog.Content>
	</div>
</Dialog.Root>

<style>
	.surface-rail {
		display: var(--app-frame-rail-display, none);
		flex-direction: column;
		gap: 1rem;
	}
	.surface-rail:not(.surface-rail--mobile) {
		position: sticky;
		top: var(--chrome-offset, 0px);
		align-self: start;
		max-height: calc(100dvh - var(--chrome-offset, 0px) - 1rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		z-index: var(--z-rail);
	}
	.surface-rail > :global(*) {
		flex: none;
	}
	.surface-rail-carrier {
		--surface-rail-bottom: calc(20px + env(safe-area-inset-bottom, 0px) + var(--surface-rail-stack-offset, 0px));
		--surface-rail-pill-default: flex;
		display: var(--app-frame-rail-carrier-display, block);
		position: fixed;
		bottom: var(--surface-rail-bottom);
		left: var(--surface-rail-left, 0px);
		right: var(--surface-rail-right, 0px);
		pointer-events: none;
		z-index: var(--z-sheet);
	}
	@media (min-width: 1024px) {
		.surface-rail-carrier {
			--surface-rail-pill-default: none;
			display: var(--app-frame-rail-carrier-display, contents);
		}
		.surface-rail {
			display: var(--app-frame-rail-display, flex);
		}
	}

	.surface-rail-pill {
		display: var(--app-frame-pill-display, var(--surface-rail-pill-default));
		position: relative;
		z-index: 2;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.125rem;
		min-height: 44px;
		max-width: calc(100% - 2rem);
		margin-inline: auto;
		pointer-events: auto;
		border-radius: var(--radius-pill);
		cursor: pointer;
		touch-action: manipulation;
		white-space: nowrap;
		font-family: var(--font-mono);
	}
	.surface-rail-pill-copy {
		display: grid;
		grid-template-columns: minmax(0, max-content) minmax(0, 1fr);
		align-items: center;
		min-inline-size: 0;
	}
	.surface-rail-pill-label {
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: var(--text-caption);
		color: var(--foreground);
	}
	.surface-rail-pill-summary {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		font-size: var(--text-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--accent-text);
	}
	/* An inline-size container has no intrinsic width. Size its track with a hidden
	   copy so the pill still hugs the full summary when there is room. */
	.surface-rail-pill-summary::before {
		content: attr(data-summary);
		visibility: hidden;
		padding-inline-start: 0.5rem;
	}
	.surface-rail-pill-summary::before,
	.surface-rail-pill-summary-space {
		grid-area: 1 / 1;
		overflow: hidden;
	}
	.surface-rail-pill-summary-space {
		container: rail-summary / inline-size;
	}
	.surface-rail-pill-summary-text {
		display: block;
		margin-inline-start: 0.5rem;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@container rail-summary (inline-size < calc(0.5rem + 1ch)) {
		.surface-rail-pill-summary-text { visibility: hidden; }
	}
	.surface-rail.surface-rail-sheet {
		display: flex;
		position: absolute;
		left: 50%;
		translate: -50% 0;
		bottom: calc(100% + 4px);
		width: min(28rem, calc(100% - 1.5rem));
		max-height: min(
			70dvh,
			max(
				var(--size-tap-min),
				calc(100dvh - var(--surface-rail-sheet-clearance, var(--chrome-offset, 0px)) -
					var(--surface-rail-bottom) - 100% - 4px)
			)
		);
		z-index: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		touch-action: manipulation;
		padding: 1rem;
		border: 1px solid var(--border-brand);
		border-radius: var(--radius-xl);
		background: var(--background);
		box-shadow: var(--shadow-nav);
		transform-origin: bottom center;
	}
	.surface-rail-carrier > :global(.surface-rail-scrim) {
		position: fixed;
		inset: 0;
		overflow: hidden;
		overscroll-behavior: contain;
		touch-action: none;
		background: var(--scrim, color-mix(in srgb, var(--background) 70%, transparent));
	}
	.surface-rail-carrier > :is(.surface-rail-sheet, :global(.surface-rail-scrim)) {
		opacity: 0;
	}
	.surface-rail-carrier[data-present='false'] > :is(.surface-rail-sheet, :global(.surface-rail-scrim)) {
		visibility: hidden;
	}
	.surface-rail-carrier[data-present='true'] > :global(.surface-rail-scrim) {
		pointer-events: auto;
	}
	.surface-rail-carrier[data-open='true'] > :is(.surface-rail-sheet, :global(.surface-rail-scrim)) {
		opacity: 1;
	}
	@media (prefers-reduced-motion: no-preference) {
		.surface-rail-carrier > :global(.surface-rail-scrim) {
			transition: opacity 120ms var(--ease-out);
		}
		.surface-rail-carrier > .surface-rail-sheet {
			will-change: transform, opacity;
			transform: translateY(12px) scale(0.98);
			transition: transform 120ms var(--ease-out), opacity 120ms var(--ease-out);
		}
		.surface-rail-carrier[data-open='true'] > :is(.surface-rail-sheet, :global(.surface-rail-scrim)) {
			transition-duration: 180ms;
		}
		.surface-rail-carrier[data-open='true'] > .surface-rail-sheet {
			transform: translateY(0) scale(1);
		}
	}
</style>
