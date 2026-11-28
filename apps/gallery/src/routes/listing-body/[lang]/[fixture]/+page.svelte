<script lang="ts">
	import ListingBodyFixtures from '../../ListingBodyFixtures.svelte';

	let { data } = $props();
</script>

<svelte:head><title>yesid.design — listing body {data.fixture} ({data.lang})</title></svelte:head>

<ListingBodyFixtures lang={data.lang} fixture={data.fixture} />
