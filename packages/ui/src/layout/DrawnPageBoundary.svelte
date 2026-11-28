<script lang="ts">
	import HandDrawnStroke from '../primitives/separator/HandDrawnStroke.svelte';

	let { inkIndex = 0, continuous = false, slot = 'page-section-boundary' }: {
		inkIndex?: number;
		/** One unbroken stroke instead of the pen-lifted segments. */
		continuous?: boolean;
		slot?: 'page-section-boundary' | 'article-header-boundary';
	} = $props();

	// Visible spans in the 1000-unit canvas. The outside marks reach past the
	// frame so the page edge stays inked as the pen lifts.
	const strokes = [
		[[-16, 257], [261, 504], [508, 763], [767, 1016]],
		[[-16, 183], [190, 389], [397, 600], [608, 812], [820, 1016]],
	] as const;
	const segments = $derived(continuous ? undefined : strokes[inkIndex % strokes.length]);
	const decorativeAttributes = { role: 'none', 'aria-hidden': 'true' } as const;
</script>

<div
	class="hand-drawn-line page-section-boundary"
	data-slot={slot}
	data-variant="hand-drawn"
	data-stroke-segments={segments?.length ?? 1}
	{...decorativeAttributes}
>
	<HandDrawnStroke {segments} />
</div>

<style>
	/* Adjacent backgrounds touch. The ink paints only on the upper side of
	   the edge, leaving the rounded standalone and card strokes alone. */
	.page-section-boundary {
		/* A product may mute the page boundary once in its theme; other hand-drawn lines keep --primary. */
		color: var(--page-boundary-color, var(--primary));
		position: relative;
		height: 0;
		z-index: 1;
		overflow: visible;
	}

	.page-section-boundary > :global(.hand-drawn-line-art) {
		position: absolute;
		inset: -10px 0 auto;
		height: 20px;
		clip-path: inset(0 0 50%);
	}
</style>
