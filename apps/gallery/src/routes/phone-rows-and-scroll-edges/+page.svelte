<script lang="ts">
	import { createRawSnippet } from 'svelte';
	import { FilterSummary } from '@yesid/ui/brand';
	import { Card } from '@yesid/ui/card';
	import { HourGrid, type HourGridCell } from '@yesid/ui/chart';
	import { DataTable, type DataTableColumn, type DataTableResponsive } from '@yesid/ui/table';

	interface StationRow {
		id: string;
		name: string;
		onTime: number | null;
		direction: string;
		distance: string;
		reports: number;
		emptyNote?: string;
	}

	const initialStations: StationRow[] = [
		{
			id: 'central',
			name: 'Central Station',
			onTime: 88,
			direction: 'Eastbound',
			distance: '240 m',
			reports: 412,
		},
		{
			id: 'harbour',
			name: 'Harbour Crossing',
			onTime: 74,
			direction: 'Southbound',
			distance: '510 m',
			reports: 295,
		},
		{
			id: 'ridge',
			name: 'North Ridge',
			onTime: 93,
			direction: 'Westbound',
			distance: '820 m',
			reports: 184,
		},
		{
			id: 'depot',
			name: 'West Depot',
			onTime: null,
			direction: '—',
			distance: '—',
			reports: 0,
			emptyNote: 'No reports in this period.',
		},
	];

	let sort = $state<{ key: string; direction: 'asc' | 'desc' }>({ key: 'onTime', direction: 'desc' });
	let recentTableWidth = $state('46rem');

	const sortedStations = $derived(
		initialStations.toSorted((a, b) => {
			if (sort.key === 'name') {
				const order = a.name.localeCompare(b.name, 'en');
				return sort.direction === 'asc' ? order : -order;
			}
			if (sort.key === 'reports') {
				const order = a.reports - b.reports;
				return sort.direction === 'asc' ? order : -order;
			}
			const av = a.onTime ?? -1;
			const bv = b.onTime ?? -1;
			const order = av - bv;
			return sort.direction === 'asc' ? order : -order;
		}),
	);

	function toggleSort(key: string): void {
		sort = {
			key,
			direction: sort.key === key && sort.direction === 'desc' ? 'asc' : 'desc',
		};
	}

	const stationColumns: DataTableColumn<StationRow>[] = [
		{ key: 'name', header: 'Station', rowHeader: true, sortable: true, cell: stationName },
		{ key: 'onTime', header: 'On time', numeric: true, sortable: true, cell: stationOnTime },
		{ key: 'direction', header: 'Direction and distance', rowHeader: true, cell: stationDirection },
		{ key: 'reports', header: 'Fahrgastinformationssystemverfügbarkeitsberichte', numeric: true, sortable: true, cell: stationReports },
	];
	const labeledStationColumns = stationColumns.map((column) =>
		column.key === 'reports' ? { ...column, header: 'Reports' } : column,
	);
	const labelExamples = [
		{ labels: true, title: 'Value and detail labels' },
		{ labels: 'details', title: 'Detail labels only' },
	] as const;

	const days = Array.from({ length: 14 }, (_, index) => ({
		id: `day-${index + 1}`,
		label: `Nov ${index + 10}`,
	}));

	const gridRows = ['Morning', 'Midday', 'Evening'].map((period, rowIndex) => ({
		id: period.toLowerCase(),
		label: period,
		cells: days.map((day, colIndex): HourGridCell => {
			const value = (colIndex * 4 + rowIndex * 7 + 5) % 25;
			const level = Math.min(4, Math.floor(value / 5)) as 0 | 1 | 2 | 3 | 4;
			return {
				text: String(value),
				level,
				name: `${period}, ${day.label}, ${value} late`,
			};
		}),
	}));

	const shortDays = days.slice(0, 3);
	const localizedGridRows = gridRows.map((row, index) =>
		index === 0 ? { ...row, label: 'Verkehr am Werktagmorgen' } : row,
	);
	const shortGridRows = gridRows.map((row) => ({ ...row, cells: row.cells.slice(0, 3) }));

	interface DailyRow {
		id: string;
		label: string;
		values: number[];
	}

	const dailyRows: DailyRow[] = [
		{ id: 'north', label: 'North', values: days.map((_, i) => 70 + ((i * 3) % 25)) },
		{ id: 'south', label: 'South', values: days.map((_, i) => 65 + ((i * 5) % 30)) },
	];

	const dailyColumns: DataTableColumn<DailyRow>[] = [
		{ key: 'label', header: 'Corridor', rowHeader: true, cell: corridorLabel },
		...days.map((day, index) => ({
			key: day.id,
			header: day.label,
			numeric: true,
			cell: createRawSnippet<[DailyRow]>((row) => ({
				render: () => `<span>${row().values[index]}%</span>`,
			})),
		})),
	];

	const narrowDailyColumns = dailyColumns.slice(0, 3);

	const wrapRows = [
		{ name: 'North', detail: 'Eastbound', value: '93%' },
		{ name: 'Sherbrooke', detail: 'Fahrgastinformationssystemverfügbarkeitsberichte', value: '88%' },
	];
	type WrapRow = (typeof wrapRows)[number];
	const wrapColumns: DataTableColumn<WrapRow>[] = [
		{ key: 'name', header: 'Station', rowHeader: true, sortable: true, cell: wrapName },
		{ key: 'value', header: 'On time', numeric: true, cell: wrapValue },
		{ key: 'detail', header: 'Service', cell: wrapDetail },
	];
	const wrapExamples = [
		{ title: 'Compact rows', responsive: { mode: 'rows', primary: 'name', value: 'value', labels: 'details' } },
		{ title: 'Compact stack', responsive: { mode: 'stack', at: 'compact' } },
		{ title: 'Tablet stack', responsive: { mode: 'stack', at: 'tablet' } },
	] satisfies { title: string; responsive: DataTableResponsive }[];
	let wrapSort = $state<'asc' | 'desc'>('asc');
	let showWideCells = $state(false);
</script>

<svelte:head><title>Phone rows and scroll edges · yesid.design</title></svelte:head>

{#snippet stationName(row: StationRow)}<a href="#phone-rows">{row.name}</a>{/snippet}
{#snippet stationOnTime(row: StationRow)}{row.onTime === null ? '—' : `${row.onTime}%`}{/snippet}
{#snippet stationDirection(row: StationRow)}
	{#if row.emptyNote}
		{row.emptyNote}
	{:else}
		<a href="#phone-rows">{row.direction}</a> · {row.distance}
	{/if}
{/snippet}
{#snippet stationReports(row: StationRow)}{row.reports}{/snippet}
{#snippet stationDetail(row: StationRow)}{row.emptyNote ?? `${row.direction} · ${row.distance} · ${row.reports} reports`}{/snippet}
{#snippet corridorLabel(row: DailyRow)}{row.label}{/snippet}
{#snippet wrapName(row: WrapRow)}<span class="wrap-name" data-wrap-word>{row.name}</span>{/snippet}
{#snippet wrapValue(row: WrapRow)}
	{#if showWideCells && row.name === 'Sherbrooke'}
		<span class="wide-cell" data-testid="wide-table-cell">Fixed-width service map</span>
	{:else}
		{row.value}
	{/if}
{/snippet}
{#snippet wrapDetail(row: WrapRow)}<span data-wrap-word>{row.detail}</span>{/snippet}

<div class="showcase" data-testid="phone-rows-and-scroll-edges">
	<h1>Phone rows, formatted filter counts and scroll edges</h1>

	<Card id="phone-rows" edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="phone-rows-card">
		<h2>Compact phone rows with sortable headers and one detail line</h2>
		<DataTable
			rows={sortedStations}
			columns={stationColumns}
			key={(row) => row.id}
			caption="Stations by on-time rate"
			responsive={{ mode: 'rows', primary: 'name', value: 'onTime', labels: false }}
			rowDetail={stationDetail}
			rowEmpty={(row) => row.onTime === null}
			{sort}
			onSort={toggleSort}
			sortLabels={{ by: (column) => `Sort by ${column}` }}
		/>
	</Card>

	{#each labelExamples as { labels, title } (title)}
		<Card edge="neutral" textSize="inherit" class="p-4 gap-3">
			<h2>{title}</h2>
			<DataTable
				rows={sortedStations.filter((row) => !row.emptyNote)}
				columns={labeledStationColumns}
				key={(row) => row.id}
				caption={`Stations by on-time rate, ${title.toLowerCase()}`}
				responsive={{ mode: 'rows', primary: 'name', value: 'onTime', labels }}
				{sort}
				onSort={toggleSort}
			/>
		</Card>
	{/each}

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="compact-stack-card">
		<h2>Stacked rows on phones</h2>
		<DataTable
			rows={dailyRows}
			columns={narrowDailyColumns}
			key={(row) => row.id}
			caption="Three-day corridor performance"
			responsive={{ mode: 'stack', at: 'compact' }}
		/>
	</Card>

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="filter-counts-card">
		<h2>Formatted filter counts</h2>
		<div class="counts">
			<div data-testid="count-en">
				<FilterSummary
					count={8630}
					locale="en"
					countLabel={{ singular: '{count} stop', plural: '{count} stops' }}
					clearLabel="Clear filters"
					onClear={() => {}}
					canClear={false}
				/>
			</div>
			<div data-testid="count-fr" lang="fr">
				<FilterSummary
					count={8630}
					locale="fr"
					countLabel={{ singular: '{count} arrêt', plural: '{count} arrêts' }}
					clearLabel="Effacer les filtres"
					onClear={() => {}}
					canClear={false}
				/>
			</div>
			<div data-testid="count-es" lang="es">
				<FilterSummary
					count={10420}
					locale="es"
					countLabel={{ singular: '{count} parada', plural: '{count} paradas' }}
					clearLabel="Borrar filtros"
					onClear={() => {}}
					canClear={false}
				/>
			</div>
		</div>
	</Card>

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="hour-grid-end-card">
		<h2>HourGrid starting at the end</h2>
		<HourGrid
			label="Recent 14-day reporting grid"
			columns={days}
			rows={localizedGridRows}
			scale={{ label: 'Late count', steps: ['0–4', '5–9', '10–14', '15–19', '20+'] }}
			stateLabels={{ few: 'Few', none: 'None', unmeasured: 'Unmeasured' }}
			initialScroll="end"
		/>
	</Card>

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="hour-grid-fit-card">
		<h2>HourGrid that fits without overflow</h2>
		<HourGrid
			label="Three-day reporting grid"
			columns={shortDays}
			rows={shortGridRows}
			scale={{ label: '', steps: [] }}
			stateLabels={{ few: '', none: '', unmeasured: '' }}
		/>
	</Card>

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="scroll-table-start-card">
		<h2 id="corridor-description">Scrollable DataTable starting at the start</h2>
		<DataTable
			id="corridor-scrollport"
			aria-describedby="corridor-description"
			style="padding: 16px"
			rows={dailyRows}
			columns={dailyColumns}
			key={(row) => row.id}
			caption="Corridor performance by day"
			responsive={{ mode: 'scroll', minWidth: '46rem' }}
			frame="card"
		/>
	</Card>

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="scroll-table-end-card">
		<h2>Scrollable DataTable starting at the end</h2>
		<DataTable
			rows={dailyRows}
			columns={dailyColumns}
			key={(row) => row.id}
			caption="Recent corridor performance"
			responsive={{ mode: 'scroll', minWidth: recentTableWidth, initialScroll: 'end' }}
			frame="card"
		/>
		<button type="button" onclick={() => recentTableWidth = '54rem'}>Widen recent table</button>
	</Card>

	<Card edge="neutral" textSize="inherit" class="p-4 gap-3" data-testid="scroll-table-fit-card">
		<h2>Scrollable DataTable that fits without overflow</h2>
		<DataTable
			rows={dailyRows}
			columns={narrowDailyColumns}
			key={(row) => row.id}
			caption="Compact corridor summary"
			responsive={{ mode: 'scroll' }}
			frame="card"
		/>
	</Card>

	<button type="button" aria-pressed={showWideCells} onclick={() => showWideCells = !showWideCells}>
		Show fixed-width cells
	</button>
	{#each wrapExamples as { title, responsive } (title)}
		<Card edge="neutral" class="p-4 gap-3" style="max-inline-size: 20rem" data-testid="table-wrap-card">
			<h2>{title}</h2>
			<DataTable
				rows={wrapSort === 'asc' ? wrapRows : wrapRows.toReversed()}
				columns={wrapColumns}
				key={(row) => row.name}
				caption={`${title} with long words`}
				{responsive}
				sort={{ key: 'name', direction: wrapSort }}
				onSort={() => wrapSort = wrapSort === 'asc' ? 'desc' : 'asc'}
			/>
		</Card>
	{/each}
</div>

<style>
	.showcase {
		display: grid;
		gap: var(--space-card-gap);
		min-inline-size: 0;
	}
	h1 {
		font-size: var(--text-title);
	}
	h2 {
		font-size: var(--text-heading);
	}
	.wrap-name {
		display: inline-block;
		font-size: var(--text-heading);
	}
	.wide-cell {
		display: inline-block;
		inline-size: 600px;
	}
	.counts {
		display: grid;
		gap: 0.25rem;
	}
	.showcase button {
		min-block-size: var(--size-tap-min);
	}
	.showcase :global(tbody a) {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		color: var(--primary);
		text-decoration: underline;
	}
</style>
