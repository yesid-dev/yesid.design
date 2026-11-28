<script lang="ts">
	import ConstructionFloodlight from '../ConstructionFloodlight.svelte';
	import ConstructionGround from '../ConstructionGround.svelte';
</script>

<ConstructionGround layout="spread" floodlight>
	{#snippet fixtures()}
		<div data-testid="ssr-fixture"><ConstructionFloodlight lit /></div>
	{/snippet}
</ConstructionGround>
