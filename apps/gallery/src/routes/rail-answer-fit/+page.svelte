<script lang="ts">
	import { AnswerLead } from '@yesid/ui/brand';
	import { SurfaceRail } from '@yesid/ui/layout';

	const values = ['77.8%', '77,8\u202f%', '1 234,5 km'];
	const layouts = ['threshold', 'fit'] as const;
	const sizes = ['md', 'lg'] as const;
</script>

<svelte:head><title>Rail pill and answer reflow</title></svelte:head>

{#snippet rail()}
	<a href="#answers" class="inline-flex min-h-11 items-center">Service results</a>
{/snippet}

<SurfaceRail {rail} label="Controls" summary="7 days selected"
	openAria="Open controls" closeAria="Close controls" />

<div id="answers" class="grid gap-4" style="padding-inline: 1.75rem">
	{#each layouts as layout}
		{#each sizes as size}
			<div data-testid={`${layout}-${size}`} class="grid gap-4">
				{#each values as value}
					<AnswerLead {value} {layout} {size} sentence="of the scheduled service ran last week." />
				{/each}
			</div>
		{/each}
	{/each}
</div>
