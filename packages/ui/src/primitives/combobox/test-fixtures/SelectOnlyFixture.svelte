<script lang="ts">
	import { Combobox } from '../index.js';
	let { disabled }: { disabled?: boolean } = $props();
	let value = $state<string | null>(null);
	let open = $state(false);
	let valueChanges = $state(0);
	let openChanges = $state(0);
	let completedOpenChanges = $state(0);
</script>

<form aria-label="Report filters">
	<Combobox searchable={false} options={[{ value: 'week', label: 'Last week' }]}
		bind:value bind:open {disabled} required name="period" label="Reporting period"
		placeholder="Choose a period" onValueChange={() => valueChanges++}
		onOpenChange={() => openChanges++} onOpenChangeComplete={() => completedOpenChanges++} />
</form>
<output data-testid="select-state">{value ?? 'none'} / {open} / {valueChanges} / {openChanges} / {completedOpenChanges}</output>
