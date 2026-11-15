<script lang="ts">
	import ReadingFrame from '../ReadingFrame.svelte';
	import type { ReadingFrameProps } from '../ReadingFrame.svelte';

	let { ownContents = false, ...props }: Omit<ReadingFrameProps, 'children' | 'summary' | 'contents'> & { ownContents?: boolean } = $props();
</script>

{#snippet summary()}<p>What this policy covers.</p>{/snippet}
{#snippet contents()}<nav aria-label="Product contents"></nav>{/snippet}

<ReadingFrame {...props} {summary} contents={ownContents ? contents : undefined}>
	<section><h2 id="data">Data we keep</h2><p>Only what the form sends.</p></section>
</ReadingFrame>
