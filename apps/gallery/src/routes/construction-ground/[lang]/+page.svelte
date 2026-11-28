<script lang="ts">
	import ConstructionGroundFixture from '../ConstructionGroundFixture.svelte';

	let { data } = $props();
</script>

<svelte:head><title>yesid.design — construction ground ({data.lang})</title></svelte:head>

<ConstructionGroundFixture lang={data.lang} />
