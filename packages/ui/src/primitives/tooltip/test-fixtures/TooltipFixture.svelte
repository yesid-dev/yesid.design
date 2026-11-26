<script lang="ts">
	import { Tooltip } from '../index.js';
	let { describedBy }: { describedBy?: string } = $props();
</script>

<p id="export-help">Includes filtered results only.</p>
<p id="export-format">Dates use UTC.</p>
<Tooltip content="Downloads a CSV file." aria-describedby={describedBy}>
	{#snippet trigger({ props })}
		<button {...props} aria-label="Export results">↓</button>
	{/snippet}
</Tooltip>
