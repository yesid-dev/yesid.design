<script lang="ts">
	import { Card } from '@yesid/ui/card';
	import { ChartBarSeries, ChartFrame, ChartLegend } from '@yesid/ui/chart';
	import { Skeleton } from '@yesid/ui/skeleton';
	import { DataTable, type DataTableColumn, type DataTableResponsive } from '@yesid/ui/table';

	const rows = [
		{ station: 'Central', onTime: '88%', service: 'Local' },
		{ station: 'Harbour', onTime: '74%', service: 'Express' },
	];
	type Row = (typeof rows)[number];
	const columns: DataTableColumn<Row>[] = [
		{ key: 'station', header: 'Station', width: '40%', rowHeader: true, sortable: true, cell: station },
		{ key: 'onTime', header: 'On time', width: '25%', numeric: true, cell: onTime },
		{ key: 'service', header: 'Service', width: '35%', cell: service },
	];
	const endColumns: DataTableColumn<Row>[] = [columns[0]!, { key: 'service', header: 'Latest service', cell: wideService }];
	const retainedRows = [{ ...rows[0]!, onTime: '' }, rows[1]!];
	const examples = [
		{ label: 'Scrollable table', responsive: { mode: 'scroll', minWidth: '32rem' } },
		{ label: 'Stacked table', responsive: { mode: 'stack', at: 'compact' } },
		{ label: 'Compact rows', responsive: { mode: 'rows', primary: 'station', value: 'onTime' } },
	] satisfies { label: string; responsive: DataTableResponsive }[];
	const pageLabels = {
		showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
		more: (count: number) => `Show ${count} more`,
	};
	let loading = $state(true);
	let ascending = $state(true);
	const sorted = $derived(ascending ? rows : rows.toReversed());
</script>

<svelte:head><title>Loading states | yesid.design</title></svelte:head>

{#snippet station(row: Row)}{row.station}{/snippet}
{#snippet onTime(row: Row)}{row.onTime}{/snippet}
{#snippet service(row: Row)}{row.service}{/snippet}
{#snippet wideService(row: Row)}<div class="wide-cell">{row.service}</div>{/snippet}

<section class="examples" data-testid="loading-states">
	<h1>Loading states</h1>
	<button type="button" class="underline min-h-[var(--size-tap-min)]" onclick={() => loading = !loading}>
		{loading ? 'Show loaded examples' : 'Show loading examples'}
	</button>

	<h2>Standalone skeleton</h2>
	<Card edge="neutral" class="px-4" data-testid="skeleton-card">
		<Skeleton busy={loading} class="h-6 w-32" />
	</Card>

	{#each examples as { label, responsive } (label)}
		<section data-testid={responsive.mode}>
			<h2>{label}</h2>
			<DataTable
				{loading}
				skeletonRows={2}
				rows={loading ? [] : sorted}
				{columns}
				key={(row) => row.station}
				caption={label}
				{responsive}
				borderCollapse="separate"
				sort={{ key: 'station', direction: ascending ? 'asc' : 'desc' }}
				onSort={() => ascending = !ascending}
				pageSize={2}
				{pageLabels}
			/>
		</section>
	{/each}

	<section>
		<h2>Latest service</h2>
		<DataTable
			{loading}
			rows={loading ? [] : rows}
			columns={endColumns}
			key={(row) => row.station}
			caption="Latest service"
			responsive={{ mode: 'scroll', minWidth: '32rem', initialScroll: 'end' }}
		/>
	</section>

	<section>
		<h2>Refreshing service reports</h2>
		<DataTable
			{loading}
			rows={retainedRows}
			skeletonRows={3}
			{columns}
			key={(row) => row.station}
			caption="Refreshing service reports"
			responsive={{ mode: 'rows', primary: 'station', value: 'onTime', labels: false }}
			rowEmpty={(row) => row.onTime === ''}
			rowDetail={service}
		/>
	</section>

	<section class="chart">
		<h2>Chart</h2>
		<ChartFrame {loading} label="On-time service" xDomain={[-0.5, 1.5]} yDomain={[0, 100]}>
			{#snippet children(plot)}
				<ChartBarSeries {plot} points={[{ x: 0, y: 88 }, { x: 1, y: 74 }]} bandWidth={1} />
			{/snippet}
			{#snippet legend()}
				<ChartLegend label="Legend" items={[{ label: 'On time', kind: 'bar' }]} />
			{/snippet}
		</ChartFrame>
	</section>
</section>

<style>
	.examples {
		display: grid;
		justify-items: start;
		gap: 1rem;
		margin-inline: auto;
		padding: 1rem;
		max-inline-size: 68rem;
	}
	.examples > section { inline-size: 100%; min-inline-size: 0; }
	.wide-cell { inline-size: 36rem; }
	.chart { display: flex; flex-direction: column; min-block-size: 21rem; }
</style>
