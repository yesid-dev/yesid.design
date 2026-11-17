<script lang="ts">
	let {
		path = 'M1.5 4.6C60 3.4 120 3.5 190 4.3S310 5.4 400 4.5S520 3 610 3.8S760 5.3 850 4.6S960 3.4 998.5 3.9',
	}: { path?: string } = $props();
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
