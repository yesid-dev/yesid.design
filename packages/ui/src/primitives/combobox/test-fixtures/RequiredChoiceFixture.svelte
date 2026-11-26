<script lang="ts">
	import { Combobox, type ComboboxOption } from '../index.js';

	interface Props {
		options: readonly ComboboxOption[];
		value?: string | null;
	}

	let { options, value = $bindable(null) }: Props = $props();
	let valueChanges = $state(0);

	function fold(raw: string): string {
		return raw
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase()
			.trim();
	}
</script>

<!-- No clearLabel: a choice that always keeps a value needs no clear copy. -->
<Combobox
	{options}
	bind:value
	clearable={false}
	label="Rank by"
	emptyLabel="No matching measure"
	{fold}
	onValueChange={() => {
		valueChanges += 1;
	}}
/>

<output data-testid="combobox-value">{value ?? 'none'}</output>
<output data-testid="combobox-value-changes">{valueChanges}</output>
