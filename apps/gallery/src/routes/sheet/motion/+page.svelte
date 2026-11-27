<script lang="ts">
	import * as Sheet from '@yesid/ui/sheet';

	const sides = [
		{ label: 'Bottom', side: 'bottom' },
		{ label: 'Right', side: 'right' },
		{ label: 'Center', side: 'center' },
		{ label: 'Bottom to center', side: { base: 'bottom', md: 'center' } },
		{ label: 'Right to bottom', side: { base: 'right', md: 'bottom' } },
		{ label: 'Center to right', side: { base: 'center', md: 'right' } },
	] as const;
</script>

<svelte:head><title>Sheet motion · yesid.design Gallery</title></svelte:head>
<h1 class="font-heading text-title font-semibold">Sheet motion</h1>
<div class="flex flex-wrap gap-2">
	{#each sides as { label, side } (label)}
		<Sheet.Root>
			<Sheet.Trigger class="min-h-11 rounded-md border border-border px-3 py-2">{label}</Sheet.Trigger>
			<Sheet.Content {side} closeLabel="Close">
				<Sheet.Header>
					<Sheet.Title>{label}</Sheet.Title>
					<Sheet.Description>Open and close the panel to see its motion.</Sheet.Description>
				</Sheet.Header>
			</Sheet.Content>
		</Sheet.Root>
	{/each}
</div>
