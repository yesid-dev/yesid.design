<script lang="ts">
	import { Combobox, type ComboboxOption } from '@yesid/ui/combobox';

	const options: ComboboxOption[] = Array.from({ length: 12 }, (_, index) => {
		const label = `Measure ${index + 1}`;
		return { value: String(index + 1), label, search: label.toLowerCase() };
	});
</script>

<svelte:head>
	<title>yesid.design | Combobox positioning</title>
</svelte:head>

<h1>Combobox positioning</h1>
<div class="scroll-page">
	<div class="panel" data-testid="combobox-panel">
		<Combobox
			{options}
			label="Measure"
			placeholder="Choose a measure"
			clearLabel="Clear measure"
			emptyLabel="No matching measure"
			fold={(raw) => raw.toLowerCase()}
		/>
	</div>
</div>

<style>
	.scroll-page {
		padding-block: 100vh;
	}
	.panel {
		inline-size: min(20rem, calc(100% - 16px));
		margin-inline: auto 8px;
		padding: 8px;
		background: var(--card);
	}
	.panel:global([data-fixed]) {
		position: fixed;
		inset-inline: 0;
		inset-block-start: 132px;
		z-index: var(--z-sheet);
		padding-block-end: 96px;
	}
	.panel:global([data-fixed][data-flipped]) {
		inset-block: auto 0;
		padding-block: 96px 8px;
	}
</style>
