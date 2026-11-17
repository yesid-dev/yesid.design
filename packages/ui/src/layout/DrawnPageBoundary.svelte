<script lang="ts">
	import HandDrawnStroke from '../primitives/separator/HandDrawnStroke.svelte';

	let { inkIndex = 0, slot = 'page-section-boundary' }: {
		inkIndex?: number;
		slot?: 'page-section-boundary' | 'article-header-boundary';
	} = $props();

	// Different lengths and pauses, using the original pen curve for every mark.
	// The outer curves start lifting just beyond the edge to keep the ends fine.
	const strokes = [
		[[-29, 245], [255, 495], [505, 755], [767, 1002]],
		[[-25, 181], [188, 386], [397, 595], [610, 810], [819, 1002]],
	] as const;
	const segments = $derived(strokes[inkIndex % strokes.length]);
	const decorativeAttributes = { role: 'none', 'aria-hidden': 'true' } as const;
</script>

<div
	class="hand-drawn-line page-section-boundary"
	data-slot={slot}
	data-variant="hand-drawn"
	data-stroke-segments={segments.length}
	{...decorativeAttributes}
>
	<HandDrawnStroke {segments} />
</div>

<style>
	/* Adjacent backgrounds touch. The ink paints only on the upper side of
	   the edge, leaving the rounded standalone and card strokes alone. */
	.page-section-boundary {
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
