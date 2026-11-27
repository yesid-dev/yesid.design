<script lang="ts">
	import { FilterGroup } from '@yesid/ui/brand';

	const modes = [
		{ key: 'bus', label: 'Bus' },
		{ key: 'tram', label: 'Tram' },
	];
	let mode = $state<string | null>('tram');
</script>

<svelte:head><title>Filter group</title></svelte:head>

<h1 class="text-title">Filter group</h1>
<div id="mode-filter" class="mt-4 max-w-sm">
	<FilterGroup
		label="Mode"
		items={modes}
		activeKey={mode}
		allLabel="All modes"
		collapsible
		startOpen={false}
		onSelect={(key) => (mode = key)}
	/>
</div>
