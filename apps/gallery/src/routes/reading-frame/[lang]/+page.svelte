<script lang="ts">
	import ReadingFrameFixture from '../ReadingFrameFixture.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Reading frame ({data.lang})</title></svelte:head>

<ReadingFrameFixture lang={data.lang} />
