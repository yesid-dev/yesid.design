<script lang="ts">
	let { segments }: { segments?: readonly (readonly [start: number, end: number])[] } = $props();
	const id = $props.id();

	// Reuse the first curve of the original pen stroke. Only stretch it
	// horizontally, so the page-edge clip still gives each mark tapered ends.
	function penMark(start: number, end: number) {
		const x = (control: number) => Number((start + (end - start) * (control - 1.5) / 188.5).toFixed(3));
		return `M${start} 4.6C${x(60)} 3.4 ${x(120)} 3.5 ${end} 4.3`;
	}

	const originalStroke = penMark(1.5, 190) + 'S310 5.4 400 4.5S520 3 610 3.8S760 5.3 850 4.6S960 3.4 998.5 3.9';
	// Give the curve room to cross the seam without losing the ends of the
	// visible span. The mask keeps each pen lift stable at fractional seam heights.
	const path = $derived(segments?.map(([start, end]) => {
		const length = end - start;
		return penMark(start - length * 0.13, end + length * 0.08);
	}).join(' ') ?? originalStroke);
</script>

<svg
	class="hand-drawn-line-art"
	viewBox="0 0 1000 8"
	preserveAspectRatio="none"
	focusable="false"
	aria-hidden="true"
>
	{#if segments}
		<defs>
			<linearGradient id={`${id}-pen-lift`}>
				<stop stop-color="white" stop-opacity="0" />
				<stop offset="5%" stop-color="white" />
				<stop offset="95%" stop-color="white" />
				<stop offset="100%" stop-color="white" stop-opacity="0" />
			</linearGradient>
			<mask id={`${id}-strokes`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="8">
				{#each segments as [start, end] (start)}
					<rect x={start} y="0" width={end - start} height="8" fill={`url(#${id}-pen-lift)`} />
				{/each}
			</mask>
		</defs>
	{/if}
	<path
		d={path}
		mask={segments ? `url(#${id}-strokes)` : undefined}
		fill="none"
		stroke="currentColor"
		stroke-width="1.25"
		stroke-linecap="round"
		stroke-linejoin="round"
		vector-effect="non-scaling-stroke"
	/>
</svg>
