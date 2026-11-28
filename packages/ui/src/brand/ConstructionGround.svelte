<!--
  Construction artwork ground above a footer (wraps ConstructionProps).

  The ground opens with the props: its block-size grows from 0 to --construction-ground-height
  (default 240px) as they rise, so no empty gap sits above the footer before scrolling there:
  - the reveal starts when the floor reaches the viewport bottom and runs for one ground height,
    keeping the ground line at the viewport bottom until the floor is fully open;
  - the stage is pinned to the ground's top and moves by transform only;
  - focus landing after the ground, End, and Page Down / Space within two screens open the ground
    synchronously via flushSync before the browser scrolls;
  - reduced motion and SSR/no-JS render full height with the props in place;
  - fixtures may stand up to --construction-ground-headroom (default 0) above the ground. That
    edge opens upward over the last fifth of the reveal. The moving props stay clipped at the
    ground's top. Inside fixtures, --ground-progress is the reveal from 0 to 1.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ConstructionGroundProps {
		/** Original warm spotlight treatment; plain artwork by default. */
		lighting?: boolean;
		/** Spread the group along the ground. */
		layout?: 'original' | 'spread' | 'around-fixture';
		/** Include an unlit fixture in the moving group. */
		floodlight?: boolean;
		/** Active scroll viewport; omit for the window. */
		revealRoot?: Element;
		/**
		 * Stationary pieces (such as a lit ConstructionFloodlight and its beam) on the stage outside
		 * the moving props group. The ground clips them. To let them stand above it, set
		 * `--construction-ground-headroom` to that height and reserve the same space above the ground:
		 * the clip opens to it over the last fifth of the reveal. Inside them the CSS custom property
		 * `--ground-progress` is the reveal from 0 to 1, for fixture motion.
		 */
		fixtures?: Snippet;
	}
</script>

<script lang="ts">
	import { flushSync } from 'svelte';
	import ConstructionProps from './ConstructionProps.svelte';

	let {
		lighting = false,
		layout = 'original',
		floodlight = false,
		revealRoot,
		fixtures,
	}: ConstructionGroundProps = $props();

	let ground = $state<HTMLElement>();
	let stage = $state<HTMLElement>();
	// SSR and no-JS keep full height and show the props.
	let progress = $state(1);
	let opened = $state(false);

	$effect(() => {
		const floor = ground;
		const artwork = stage;
		const root = revealRoot;
		if (!floor || !artwork || opened) return;

		const viewport = root ?? window;
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const update = () => {
			const height = artwork.getBoundingClientRect().height;
			const viewportHeight = root?.clientHeight ?? document.documentElement.clientHeight;
			const viewportTop = root ? root.getBoundingClientRect().top + root.clientTop : 0;
			// The floor's top is independent of its own height, even as the footer moves.
			const distance = viewportTop + viewportHeight - floor.getBoundingClientRect().top;
			progress = motion.matches || height === 0 ? 1 : Math.max(0, Math.min(1, distance / height));
		};
		update();
		motion.addEventListener('change', update);
		viewport.addEventListener('scroll', update, { passive: true });
		if (!root) window.addEventListener('resize', update);
		const resize = new ResizeObserver(update);
		resize.observe(root ?? document.documentElement);
		resize.observe(artwork);
		return () => {
			motion.removeEventListener('change', update);
			viewport.removeEventListener('scroll', update);
			if (!root) window.removeEventListener('resize', update);
			resize.disconnect();
		};
	});

	function open(): boolean {
		if (opened) return false;
		flushSync(() => (opened = true));
		return true;
	}

	function openForFocus(event: FocusEvent) {
		const target = event.target;
		if (!ground || !(target instanceof Node)) return;
		if (ground.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) {
			if (open() && target instanceof HTMLElement && typeof target.scrollIntoView === 'function') {
				const rect = target.getBoundingClientRect();
				if (rect.top < 0 || rect.bottom > window.innerHeight) {
					target.scrollIntoView({ block: 'center', behavior: 'instant' });
				}
			}
		}
	}

	function openForPageKeys(event: KeyboardEvent) {
		if (event.key === 'End') open();
		else if (event.key === 'PageDown' || event.key === ' ') {
			const viewportHeight = revealRoot?.clientHeight ?? window.innerHeight;
			const rootTop = revealRoot?.getBoundingClientRect().top ?? 0;
			if (ground && ground.getBoundingClientRect().top - rootTop < 2 * viewportHeight) open();
		}
	}
</script>

<svelte:document onfocusin={openForFocus} onkeydown={openForPageKeys} />

<div class="construction-ground" data-slot="construction-ground">
	<div
		bind:this={ground}
		class="construction-ground-floor"
		data-slot="construction-ground-floor"
		style:--ground-progress={opened ? 1 : progress}
		data-opened={opened || undefined}
		data-fixtures={fixtures ? true : undefined}
	>
		<div bind:this={stage} class="construction-ground-stage" data-slot="construction-ground-stage">
			<ConstructionProps {layout} {floodlight} {lighting} />
			{#if fixtures}
				<div class="construction-ground-fixtures" data-slot="construction-ground-fixtures">
					{@render fixtures()}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.construction-ground {
		flex-shrink: 0;
	}
	.construction-ground-floor {
		position: relative;
		block-size: calc(var(--construction-ground-height, 240px) * var(--ground-progress, 1));
		overflow: clip;
	}
	.construction-ground-stage {
		position: absolute;
		inset-inline: 0;
		inset-block-start: 0;
		block-size: var(--construction-ground-height, 240px);
		transform: translateY(
			calc((var(--ground-progress, 1) - 1) * var(--construction-ground-height, 240px))
		);
	}
	.construction-ground-stage
		> :global([data-slot='construction-props'] :is([data-construction-prop] > svg, [data-construction-fixture] svg)) {
		translate: 0 calc((1 - var(--ground-progress, 1)) * 100%);
	}
	.construction-ground-fixtures {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	/*
	 * With fixtures, clip-path replaces the vertical overflow clip so its top edge can move: from the
	 * ground's top at 80% of the reveal to the declared headroom above it at 100%. It also clips the
	 * sides and the ground line; overflow-x stays clipped so wide fixtures cannot scroll the page.
	 */
	.construction-ground-floor[data-fixtures] {
		overflow-y: visible;
		clip-path: inset(
			calc(
					-1 * var(--construction-ground-headroom, 0px) *
						clamp(0, (var(--ground-progress, 1) - 0.8) * 5, 1)
				)
				0 0
		);
	}
	/*
	 * Only fixtures use the headroom: each moving prop stays clipped at the ground's top, or one taller
	 * than the ground would show above it. Props stand on the ground line, and in inset() 100% is the
	 * prop's own height. Their group has no box of its own to clip. Each prop already clips itself, so
	 * the other edges, and the top when nothing is cut, stay 1px outside its box and smooth nothing.
	 */
	.construction-ground-floor[data-fixtures]
		.construction-ground-stage
		> :global([data-slot='construction-props'] :is([data-construction-prop], [data-construction-fixture])) {
		clip-path: inset(
			max(-1px, calc(100% - var(--ground-progress, 1) * var(--construction-ground-height, 240px)))
				-1px -1px
		);
	}
	@media (prefers-reduced-motion: reduce) {
		.construction-ground-floor {
			block-size: var(--construction-ground-height, 240px);
		}
		.construction-ground-stage {
			transform: none;
		}
		.construction-ground-stage
			> :global([data-slot='construction-props'] :is([data-construction-prop] > svg, [data-construction-fixture] svg)) {
			translate: none;
		}
		/* The ground is whole wherever the page is scrolled, so fixtures see a finished reveal. */
		.construction-ground-floor[data-fixtures] {
			clip-path: inset(calc(-1 * var(--construction-ground-headroom, 0px)) 0 0);
		}
		.construction-ground-fixtures {
			--ground-progress: 1;
		}
		.construction-ground-floor[data-fixtures]
			.construction-ground-stage
			> :global([data-slot='construction-props'] :is([data-construction-prop], [data-construction-fixture])) {
			clip-path: inset(max(-1px, calc(100% - var(--construction-ground-height, 240px))) -1px -1px);
		}
	}
</style>
