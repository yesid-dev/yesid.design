<!--
  DataTable fonts. The first tables take headers and stacked labels in the body font from
  `--data-table-header-font`, with a word column and a numeric column in the body font beside a code
  column and a numeric column that keep the default. The last tables set neither option.
-->
<script lang="ts">
	import { DataTable, type DataTableColumn, type DataTableResponsive } from '@yesid/ui/table';

	interface Row {
		id: string;
		line: string;
		code: string;
		status: string;
		trips: string;
		share: string;
	}

	const rows: readonly Row[] = [
		{ id: 'a', line: 'Harbour', code: '50110', status: 'On time', trips: '1,111', share: '11 %' },
		{ id: 'b', line: 'Market', code: '50742', status: 'Running late', trips: '8,808', share: '88 %' },
	];

	const layouts: { id: string; responsive: DataTableResponsive }[] = [
		{ id: 'compact', responsive: { mode: 'stack', at: 'compact' } },
		{ id: 'tablet', responsive: { mode: 'stack', at: 'tablet' } },
		{ id: 'rows', responsive: { mode: 'rows', primary: 'line', value: 'trips' } },
	];

	function columns(fonts: boolean): DataTableColumn<Row>[] {
		const font = fonts ? ('body' as const) : undefined;
		return [
			{ key: 'line', header: 'Line', rowHeader: true, cell: lineCell },
			{ key: 'code', header: 'Stop code', cell: codeCell },
			{ key: 'status', header: 'Status', font, cell: statusCell },
			{ key: 'trips', header: 'Trips', numeric: true, sortable: true, cell: tripsCell },
			{ key: 'share', header: 'Share', numeric: true, font, cell: shareCell },
		];
	}
</script>

<svelte:head><title>yesid.design — data table fonts</title></svelte:head>

{#snippet lineCell(row: Row)}{row.line}{/snippet}
{#snippet codeCell(row: Row)}{row.code}{/snippet}
{#snippet statusCell(row: Row)}{row.status}{/snippet}
{#snippet tripsCell(row: Row)}{row.trips}{/snippet}
{#snippet shareCell(row: Row)}{row.share}{/snippet}

{#snippet table(caption: string, responsive: DataTableResponsive, fonts: boolean, loading = false)}
	<DataTable
		{rows}
		columns={columns(fonts)}
		key={(row) => row.id}
		{caption}
		{responsive}
		{loading}
		skeletonRows={2}
		onSort={() => {}}
		sortLabels={{ by: (column) => `Sort by ${column}` }}
	/>
{/snippet}

<div class="examples">
	<h1>Data table fonts</h1>

	<div class="brand" data-testid="fonts-brand">
		{#each layouts as { id, responsive } (id)}
			<div class={id} data-testid={`fonts-brand-${id}`}>
				{@render table(`Body font headers, ${id}`, responsive, true)}
			</div>
		{/each}
		<div data-testid="fonts-brand-loading">
			{@render table('Body font headers, loading', { mode: 'stack', at: 'compact' }, true, true)}
		</div>
	</div>

	<div data-testid="fonts-default">
		{#each layouts as { id, responsive } (id)}
			<div class={id} data-testid={`fonts-default-${id}`}>
				{@render table(`Default fonts, ${id}`, responsive, false)}
			</div>
		{/each}
	</div>
</div>

<style>
	.examples,
	.examples > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2rem;
	}

	h1 {
		margin: 0;
		font-size: var(--text-title);
	}

	.brand {
		--data-table-header-font: var(--font-body);
	}

	/* The rows layout follows its own width, so a narrow box shows it at every viewport. */
	.rows {
		inline-size: min(100%, 24rem);
	}
</style>
