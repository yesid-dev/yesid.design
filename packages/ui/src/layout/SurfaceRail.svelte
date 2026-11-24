<!--
  A page's controls rail. It is sticky in a wide layout and becomes a floating pill when compact.
  AppFrame supplies its container breakpoint; a standalone rail uses the viewport. The same rail
  element moves into the sheet, so its state survives. `rail` receives `closeSheet` and the current
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
	import * as Sheet from '../primitives/sheet/index.js';
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
	// Keep the rail in the sheet until its exit animation has finished.
	let sheetPresent = $state(false);
	let pillBtn = $state<HTMLButtonElement>();
	let sheetEl = $state<HTMLDivElement | null>(null);
	let desktopRailEl = $state<HTMLElement>();
	let railHomeParent: Node | undefined;
	let railHomeNextSibling: Node | null = null;
	const isDesktop = getContext<(() => boolean) | undefined>(frameRailLayout) ?? (() => desktop.current);
	let wasDesktop = isDesktop();
	const presentation = $derived<SurfaceRailPresentation>(isDesktop() ? 'desktop' : 'mobile');

	onMount(() => {
		railHomeParent = desktopRailEl?.parentNode ?? undefined;
		railHomeNextSibling = desktopRailEl?.nextSibling ?? null;
	});

	function restoreRailHome(): void {
		if (!desktopRailEl || !railHomeParent || desktopRailEl.parentNode === railHomeParent) return;
		railHomeParent.insertBefore(desktopRailEl, railHomeNextSibling);
	}

	function closeSheet(restoreFocus = false): void {
		sheetOpen = false;
		if (restoreFocus) void tick().then(() => pillBtn?.focus());
	}

	$effect(() => {
		if (sheetOpen) sheetPresent = true;
	});

	$effect(() => {
		if (!sheetPresent || !sheetEl || !desktopRailEl) return;

		const activeSheet = sheetEl;
		activeSheet.querySelector('[data-rail-slot]')?.append(desktopRailEl);
		const onClick = (e: MouseEvent) => {
			if ((e.target as HTMLElement | null)?.closest('a[href^="#"]')) closeSheet(true);
		};
		activeSheet.addEventListener('click', onClick);
		return () => {
			activeSheet.removeEventListener('click', onClick);
			restoreRailHome();
		};
	});

	$effect(() => {
		const desktopNow = isDesktop();
		const crossedToDesktop = desktopNow && !wasDesktop;
		wasDesktop = desktopNow;
		if (!crossedToDesktop || !sheetPresent) return;

		const focusWasInSheet = sheetEl?.contains(document.activeElement) ?? false;
		sheetOpen = false;
		sheetPresent = false;
		if (!focusWasInSheet) return;

		void tick().then(() => {
			const candidates = desktopRailEl?.querySelectorAll<HTMLElement>(
				'button, a, select, input, [tabindex]:not([tabindex="-1"])',
			);
			const next = Array.from(candidates ?? []).find((candidate) => candidate.getClientRects().length);
			(next ?? desktopRailEl)?.focus();
		});
	});

	$effect(() => {
		if (mobileVisible) return;
		sheetPresent = false;
		closeSheet();
	});
</script>

<aside
	bind:this={desktopRailEl}
	use:scrollChain
	class={cn('surface-rail', className)}
	class:surface-rail--mobile={presentation === 'mobile' && sheetPresent}
	data-slot="surface-rail"
	data-lenis-prevent
	aria-label={label}
	tabindex="-1"
>
	{@render rail({ closeSheet: () => closeSheet(presentation === 'mobile'), presentation })}
</aside>

{#if mobileVisible}
	<div class="surface-rail-mobile" data-slot="surface-rail-mobile" data-open={sheetOpen}>
		<Sheet.Root bind:open={sheetOpen} onOpenChangeComplete={(open) => {
			if (!open) sheetPresent = false;
		}}>
			<button
				bind:this={pillBtn}
				class="tap-press surface-rail-pill glass-chrome"
				onclick={() => (sheetOpen = !sheetOpen)}
				aria-expanded={sheetOpen}
				aria-label={`${label}${summary ? ` ${summary}` : ''} · ${sheetOpen ? closeAria : openAria}`}
			>
				<span class="surface-rail-pill-label">{label}</span>
				{#if summary}<span class="surface-rail-pill-summary">{summary}</span>{/if}
				<ChevronToggle open={sheetOpen} size="sm" direction="down" />
			</button>

			<Sheet.Content
				bind:ref={sheetEl}
				class="surface-rail-sheet glass-chrome"
				portalProps={{ disabled: true }}
				showCloseButton={false}
				side="bottom"
				data-lenis-prevent
				aria-label={label}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					if (!isDesktop()) pillBtn?.focus();
				}}
			>
				<div class="contents" data-rail-slot></div>
			</Sheet.Content>
		</Sheet.Root>
	</div>
{/if}

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
	.surface-rail-mobile[data-open='false'] {
		display: var(--app-frame-pill-display, block);
	}
	@media (min-width: 1024px) {
		.surface-rail-mobile[data-open='false'] {
			display: var(--app-frame-pill-display, none);
		}
		.surface-rail {
			display: var(--app-frame-rail-display, flex);
		}
	}
	.surface-rail.surface-rail--mobile {
		display: flex;
		width: 100%;
	}

	.surface-rail-mobile {
		--scrim: transparent;
		--surface-rail-bottom: calc(20px + env(safe-area-inset-bottom, 0px) + var(--surface-rail-stack-offset, 0px));
		--surface-rail-sheet-bottom: calc(72px + env(safe-area-inset-bottom, 0px) + var(--surface-rail-stack-offset, 0px));
		position: fixed;
		bottom: var(--surface-rail-bottom);
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--z-sheet);
	}
	.surface-rail-pill {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.125rem;
		min-height: 44px;
		max-width: calc(100vw - 2rem);
		border-radius: var(--radius-pill);
		cursor: pointer;
		white-space: nowrap;
		font-family: var(--font-mono);
	}
	.surface-rail-pill-label {
		font-size: var(--text-caption);
		color: var(--foreground);
	}
	.surface-rail-pill-summary {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: var(--text-micro);
		letter-spacing: var(--tracking-eyebrow);
		text-transform: uppercase;
		color: var(--accent-text);
	}
	/* translate, not transform: the sheet's slide-in keyframes animate transform. */
	:global(.surface-rail-sheet) {
		position: fixed;
		left: 50%;
		translate: -50% 0;
		bottom: var(--surface-rail-sheet-bottom);
		width: min(28rem, calc(100vw - 1.5rem));
		max-height: min(
			70dvh,
			32rem,
			max(
				var(--size-tap-min),
				calc(
					100dvh - var(--surface-rail-sheet-clearance, var(--chrome-offset, 0px)) -
						var(--surface-rail-bottom) - var(--surface-rail-sheet-bottom)
				)
			)
		);
		overflow-y: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border-radius: var(--radius-xl);
	}
	:global(.surface-rail-sheet > *) {
		flex: none;
	}
</style>
