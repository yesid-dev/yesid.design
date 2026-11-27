<script lang="ts">
	import * as Sheet from '@yesid/ui/sheet';

	let { initiallyOpen = false }: { initiallyOpen?: boolean } = $props();
	let wider = $state(false);
	const reportFiles = [
		'summary', 'daily-totals', 'weekly-totals', 'monthly-totals', 'locations', 'observations',
		'coverage', 'categories', 'exceptions', 'revisions', 'sources', 'definitions',
	];
	const csvExample = 'data:text/csv;charset=utf-8,period%2Cobservations%0A2026-11%2C42';
</script>

<h1 class="font-heading text-title font-semibold">Report files Sheet</h1>
{#if !initiallyOpen}
	<button type="button" class="mt-2 min-h-11 rounded-md border border-border px-3 py-2"
		aria-pressed={wider} onclick={() => wider = !wider}>
		Use a wider centered window
	</button>
{/if}
<Sheet.Root open={initiallyOpen}>
	<Sheet.Trigger class="min-h-11 rounded-md border border-border px-3 py-2 text-small hover:border-primary">
		Open report files
	</Sheet.Trigger>
	<Sheet.Content
		side={wider ? 'center' : { base: 'bottom', md: 'center' }}
		style={wider ? '--sheet-center-width: 48rem' : undefined}
		portalProps={initiallyOpen ? { disabled: true } : undefined}
		closeLabel="Close report files"
	>
		<Sheet.Header>
			<Sheet.Title>Download report files</Sheet.Title>
			<Sheet.Description>Export the data or cite this report.</Sheet.Description>
		</Sheet.Header>
		<Sheet.Body class="max-[768px]:min-h-0 max-[768px]:overflow-y-auto">
			<ul class="divide-y divide-border">
				{#each reportFiles as file (file)}
					<li>
						<a class="flex min-h-11 items-center justify-between gap-4 py-2 underline" href={csvExample} download={`${file}.csv`}>
							<span>{file}.csv</span><span class="text-muted-foreground">CSV</span>
						</a>
					</li>
				{/each}
			</ul>
			<section class="mt-4 max-w-[72ch] rounded-md border border-border p-4">
				<h3 class="font-semibold">Cite this report</h3>
				<p class="mt-2 break-words">
					Operations Research Office. (2026). Quarterly service operations report:
					Observations, coverage, and reporting definitions for July through
					September 2026. Revised November 2026. Include the report version and
					observation period when referencing the accompanying tables.
				</p>
			</section>
		</Sheet.Body>
		<Sheet.Footer>
			<Sheet.Close class="min-h-11 self-end rounded-md border border-border px-3 py-2">Done</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
