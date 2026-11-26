<script lang="ts">
	import { Tooltip } from '../index.js';
</script>

<Tooltip content="Downloads a CSV file.">
	{#snippet trigger({ props })}
		<button {...props} aria-label="Export results">↓</button>
	{/snippet}
</Tooltip>
