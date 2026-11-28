<script lang="ts">
	import ListingBody from '../ListingBody.svelte';
</script>

<ListingBody title="Every measured line" resultCountText="3 lines">
	{#snippet titleAside()}<span>Record</span>{/snippet}
	{#snippet search()}<input aria-label="Search lines" />{/snippet}
	{#snippet summary()}<p>3 lines</p>{/snippet}
	{#snippet sort()}<div>Sort</div>{/snippet}
	{#snippet more()}<button type="button">Show more</button>{/snippet}
	<p>Results</p>
</ListingBody>

<ListingBody>
	<p>Minimal results</p>
</ListingBody>
