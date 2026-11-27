<script lang="ts">
	import { Tooltip } from '../index.js';
	let { describedBy, field }: { describedBy?: string; field?: 'number' | 'textarea' } = $props();
</script>

<p id="export-help">Includes filtered results only.</p>
<p id="export-format">Dates use UTC.</p>
<Tooltip content="Downloads a CSV file." aria-describedby={describedBy}>
	{#snippet trigger({ props })}
		{#if field === 'textarea'}
			{@const { type: _type, ...textareaProps } = props}
			<textarea {...textareaProps} aria-label="Export note"></textarea>
		{:else if field === 'number'}
			<input {...props} type="number" aria-label="Export count" />
		{:else}
			<button {...props} aria-label="Export results">↓</button>
		{/if}
	{/snippet}
</Tooltip>
