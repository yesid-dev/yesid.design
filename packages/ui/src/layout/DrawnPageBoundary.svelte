<script lang="ts">
	import HandDrawnStroke from '../primitives/separator/HandDrawnStroke.svelte';

	let { inkIndex = 0, slot = 'page-section-boundary' }: {
		inkIndex?: number;
		slot?: 'page-section-boundary' | 'article-header-boundary';
	} = $props();

	// The pauses are different in each pass. Both strokes start and finish at
	// the same edge, with round pen marks and small variations in the ink.
	const strokes = [
		[
			'M1.5 3.56C58 3.18 110 3.77 160 3.54S222 3.12 251 3.68',
			'M268 3.48C314 3.2 361 3.74 408 3.52S468 3.48 503 3.84',
			'M521 3.54C563 3.18 628 3.61 676 3.36S723 3.31 751 3.72',
			'M766 3.36C817 3.7 868 3.28 910 3.51S963 3.65 998.5 3.43',
		].join(' '),
		[
			'M1.5 3.64C48 3.31 91 3.23 134 3.65S164 3.95 177 3.74',
			'M190 3.44C231 3.14 269 3.59 309 3.47S338 3.61 359 3.82',
			'M376 3.38C414 3.52 456 3.17 493 3.49S535 3.67 574 3.50',
			'M589 3.58C632 3.74 675 3.14 721 3.44S765 3.75 795 3.65',
			'M812 3.39C855 3.2 890 3.65 922 3.49S974 3.47 998.5 3.76',
		].join(' '),
	];
	const decorativeAttributes = { role: 'none', 'aria-hidden': 'true' } as const;
</script>

<div
	class="hand-drawn-line page-section-boundary"
	data-slot={slot}
	data-variant="hand-drawn"
	data-stroke-segments={4 + (inkIndex % strokes.length)}
	{...decorativeAttributes}
>
	<HandDrawnStroke path={strokes[inkIndex % strokes.length]} />
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
