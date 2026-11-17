<script lang="ts">
	let { segments }: { segments?: readonly (readonly [start: number, end: number])[] } = $props();

	// Reuse the first curve of the original pen stroke. Only stretch it
	// horizontally, so the page-edge clip still gives each mark tapered ends.
	function penMark(start: number, end: number) {
		const x = (control: number) => Number((start + (end - start) * (control - 1.5) / 188.5).toFixed(3));
		return `M${start} 4.6C${x(60)} 3.4 ${x(120)} 3.5 ${end} 4.3`;
	}

	const originalStroke = penMark(1.5, 190) + 'S310 5.4 400 4.5S520 3 610 3.8S760 5.3 850 4.6S960 3.4 998.5 3.9';
	const path = $derived(segments?.map(([start, end]) => penMark(start, end)).join(' ') ?? originalStroke);
</script>

<svg
	class="hand-drawn-line-art"
	viewBox="0 0 1000 8"
	preserveAspectRatio="none"
	focusable="false"
	aria-hidden="true"
>
	<path
		d={path}
		fill="none"
		stroke="currentColor"
		stroke-width="1.25"
		stroke-linecap="round"
		stroke-linejoin="round"
		vector-effect="non-scaling-stroke"
	/>
</svg>
