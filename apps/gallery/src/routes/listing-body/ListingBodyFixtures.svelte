<script lang="ts">
	import {
		FilterSummary,
		RoutePlate,
		SearchInput,
		SegmentedChoice,
		Stamp,
		filterCountText,
	} from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { StateNotice } from '@yesid/ui/feedback';
	import { ListingBody } from '@yesid/ui/layout';
	import { DataTable, ShowMore, type DataTableColumn } from '@yesid/ui/table';
	import {
		COPY,
		LINE_ROWS,
		STOP_ROWS,
		VEHICLE_ROWS,
		type FixtureKind,
		type Lang,
		type LineRow,
		type StopRow,
		type VehicleRow,
	} from './copy';

	let {
		lang = 'en',
		fixture = 'all',
	}: {
		lang?: Lang;
		fixture?: FixtureKind | 'all';
	} = $props();

	const c = $derived(COPY[lang]);
	const fmt = $derived(new Intl.NumberFormat(c.locale));
	const pct = (value: number) => (lang === 'fr' ? `${fmt.format(value)}\u00a0%` : `${fmt.format(value)}%`);

	// Lines state
	let lineQuery = $state('');
	let lineSortKey = $state<'code' | 'onTime' | 'late' | 'trips'>('code');
	let lineSortDir = $state<'asc' | 'desc'>('asc');
	let lineShown = $state(4);

	const filteredLines = $derived.by(() => {
		const q = lineQuery.trim().toLowerCase();
		const list = q
			? LINE_ROWS.filter(
					(row) => row.code.toLowerCase().includes(q) || row.name.toLowerCase().includes(q),
				)
			: LINE_ROWS;
		return list.toSorted((a, b) => {
			const order =
				lineSortKey === 'code'
					? Number(a.code) - Number(b.code)
					: a[lineSortKey] - b[lineSortKey];
			return lineSortDir === 'asc' ? order : -order;
		});
	});
	const visibleLines = $derived(filteredLines.slice(0, lineShown));

	// Stops state
	let stopQuery = $state('');
	let stopNear = $state(false);
	let stopFilterActive = $state(true);
	let stopShown = $state(3);

	const filteredStops = $derived.by(() => {
		const q = stopQuery.trim().toLowerCase();
		if (!q) return STOP_ROWS;
		return STOP_ROWS.filter(
			(row) =>
				row.code.includes(q) ||
				row.name.toLowerCase().includes(q) ||
				row.lines.some((line) => line.includes(q)),
		);
	});
	const visibleStops = $derived(filteredStops.slice(0, stopShown));
	const stopsSummaryActive = $derived(stopFilterActive || stopNear || stopQuery.trim().length > 0);

	// Vehicles state
	let vehicleQuery = $state('');
	let vehicleFilterActive = $state(true);
	let vehicleShown = $state(3);

	const filteredVehicles = $derived.by(() => {
		const q = vehicleQuery.trim().toLowerCase();
		if (!q) return VEHICLE_ROWS;
		return VEHICLE_ROWS.filter((row) => row.id.toLowerCase().includes(q));
	});
	const visibleVehicles = $derived(filteredVehicles.slice(0, vehicleShown));
	const vehiclesSummaryActive = $derived(vehicleFilterActive || vehicleQuery.trim().length > 0);

	// Empty state
	let emptyQuery = $state('999');
	const emptyCleared = $derived(emptyQuery.trim().length === 0);

	// Columns
	const lineColumns: DataTableColumn<LineRow>[] = $derived([
		{ key: 'line', header: c.lines.columns.line, width: '42%', rowHeader: true, cell: lineCell },
		{ key: 'onTime', header: c.lines.columns.onTime, width: '14%', numeric: true, cell: lineOnTimeCell },
		{ key: 'late', header: c.lines.columns.late, width: '14%', numeric: true, cell: lineLateCell },
		{ key: 'trips', header: c.lines.columns.trips, width: '15%', numeric: true, cell: lineTripsCell },
		{ key: 'events', header: c.lines.columns.events, width: '15%', numeric: true, cell: lineEventsCell },
	]);

	const stopColumns: DataTableColumn<StopRow>[] = $derived([
		{ key: 'code', header: c.stops.columns.code, width: '14%', cell: stopCodeCell },
		{ key: 'stop', header: c.stops.columns.stop, width: '36%', rowHeader: true, cell: stopNameCell },
		{ key: 'lines', header: c.stops.columns.lines, width: '20%', cell: stopLinesCell },
		{ key: 'onTime', header: c.stops.columns.onTime, width: '15%', numeric: true, cell: stopOnTimeCell },
		{ key: 'events', header: c.stops.columns.events, width: '15%', numeric: true, cell: stopEventsCell },
	]);

	const vehicleColumns: DataTableColumn<VehicleRow>[] = $derived([
		{ key: 'vehicle', header: c.vehicles.columns.vehicle, width: '32%', rowHeader: true, cell: vehicleIdCell },
		{ key: 'days', header: c.vehicles.columns.days, width: '17%', numeric: true, cell: vehicleDaysCell },
		{ key: 'hours', header: c.vehicles.columns.hours, width: '17%', numeric: true, cell: vehicleHoursCell },
		{ key: 'lines', header: c.vehicles.columns.lines, width: '17%', numeric: true, cell: vehicleLinesCell },
		{ key: 'trips', header: c.vehicles.columns.trips, width: '17%', numeric: true, cell: vehicleTripsCell },
	]);

	const show = (kind: FixtureKind) => fixture === 'all' || fixture === kind;
</script>

{#snippet lineCell(row: LineRow)}
	<span class="row-identity">
		<RoutePlate code={row.code} />
		<a class="row-link" href="#fixture-lines">{row.name}</a>
	</span>
{/snippet}
{#snippet lineOnTimeCell(row: LineRow)}{pct(row.onTime)}{/snippet}
{#snippet lineLateCell(row: LineRow)}{pct(row.late)}{/snippet}
{#snippet lineTripsCell(row: LineRow)}{fmt.format(row.trips)}{/snippet}
{#snippet lineEventsCell(row: LineRow)}{fmt.format(row.events)}{/snippet}
{#snippet lineRowDetail(row: LineRow)}
	{c.lines.detail(pct(row.late), fmt.format(row.trips), fmt.format(row.events))}
{/snippet}

{#snippet stopCodeCell(row: StopRow)}<span class="font-mono text-small">{row.code}</span>{/snippet}
{#snippet stopNameCell(row: StopRow)}<a class="row-link" href="#fixture-stops">{row.name}</a>{/snippet}
{#snippet stopLinesCell(row: StopRow)}
	<span class="plate-group">
		{#each row.lines as code (code)}
			<RoutePlate {code} />
		{/each}
	</span>
{/snippet}
{#snippet stopOnTimeCell(row: StopRow)}{pct(row.onTime)}{/snippet}
{#snippet stopEventsCell(row: StopRow)}{fmt.format(row.events)}{/snippet}
{#snippet stopRowDetail(row: StopRow)}
	{c.stops.detail(row.code, row.lines.join(', '), fmt.format(row.events))}
{/snippet}

{#snippet vehicleIdCell(row: VehicleRow)}
	<a class="row-link font-mono" href="#fixture-vehicles">{row.id}</a>
{/snippet}
{#snippet vehicleDaysCell(row: VehicleRow)}{fmt.format(row.days)}{/snippet}
{#snippet vehicleHoursCell(row: VehicleRow)}{fmt.format(row.hours)}{/snippet}
{#snippet vehicleLinesCell(row: VehicleRow)}{fmt.format(row.lines)}{/snippet}
{#snippet vehicleTripsCell(row: VehicleRow)}{fmt.format(row.trips)}{/snippet}
{#snippet vehicleRowDetail(row: VehicleRow)}
	{c.vehicles.detail(fmt.format(row.hours), fmt.format(row.lines), fmt.format(row.trips))}
{/snippet}

<div class="listing-fixtures" {lang} data-testid="listing-body-fixtures" data-fixture={fixture}>
	<header class="page-intro">
		<h1>{c.pageTitle}</h1>
		{#if fixture === 'all'}
			<p>{c.pageIntro}</p>
		{/if}
	</header>

	{#if show('lines')}
		<div id="fixture-lines" data-testid="fixture-lines">
			<ListingBody
				title={c.lines.title}
				resultCountText={filterCountText(filteredLines.length, c.lines.countLabel, c.locale)}
			>
				{#snippet titleAside()}
					<Stamp kind="record" label={c.stampRecord} />
				{/snippet}

				{#snippet search()}
					<div class="search-wrap">
						<SearchInput
							visibleLabel
							textSize="body"
							testId="lines-search"
							label={c.lines.searchLabel}
							placeholder={c.lines.searchPlaceholder}
							bind:value={lineQuery}
						/>
					</div>
				{/snippet}

				{#snippet summary()}
					{#if lineQuery.trim().length > 0}
						<FilterSummary
							count={filteredLines.length}
							countLabel={c.lines.countLabel}
							locale={c.locale}
							clearLabel={c.clearFilters}
							onClear={() => {
								lineQuery = '';
								lineShown = 4;
							}}
						/>
					{:else}
						<p class="breakdown" data-testid="lines-breakdown">{c.lines.breakdown}</p>
					{/if}
				{/snippet}

				{#snippet sort()}
					<div class="sort-rail">
						<SegmentedChoice
							label={c.lines.sortLabel}
							options={c.lines.sortOptions}
							value={lineSortKey}
							variant="fit-row"
							onSelect={(key) => {
								lineSortKey = key;
								lineShown = 4;
							}}
						/>
						<Button
							variant="outline"
							wrap
							class="min-h-11 shrink-0"
							aria-label={`${c.lines.directionLabel}: ${lineSortDir === 'asc' ? c.lines.ascending : c.lines.descending}`}
							onclick={() => {
								lineSortDir = lineSortDir === 'asc' ? 'desc' : 'asc';
							}}
						>
							{lineSortDir === 'asc' ? c.lines.ascending : c.lines.descending}
						</Button>
					</div>
				{/snippet}

				{#if visibleLines.length > 0}
					<DataTable
						rows={visibleLines}
						columns={lineColumns}
						key={(row) => row.id}
						caption={c.lines.caption}
						rowAlign="middle"
						borderCollapse="separate"
						responsive={{ mode: 'rows', primary: 'line', value: 'onTime', labels: 'details' }}
						rowDetail={lineRowDetail}
					/>
				{:else}
					<StateNotice
						presentation="frameless"
						tone="neutral"
						title={c.empty.noticeTitle}
						body={c.empty.noticeBody}
					/>
				{/if}

				{#snippet more()}
					<ShowMore
						shown={visibleLines.length}
						total={filteredLines.length}
						pageSize={4}
						labels={{ showing: c.showing, more: c.showMore }}
						onMore={(count) => {
							lineShown += count;
						}}
					/>
				{/snippet}
			</ListingBody>
		</div>
	{/if}

	{#if show('stops')}
		<div id="fixture-stops" data-testid="fixture-stops">
			{#snippet stopsSummary()}
				<FilterSummary
					count={filteredStops.length}
					countLabel={c.stops.countLabel}
					locale={c.locale}
					clearLabel={c.clearFilters}
					canClear={stopsSummaryActive}
					onClear={() => {
						stopQuery = '';
						stopNear = false;
						stopFilterActive = false;
						stopShown = 3;
					}}
				/>
			{/snippet}

			<ListingBody
				title={c.stops.title}
				resultCountText={filterCountText(filteredStops.length, c.stops.countLabel, c.locale)}
				summary={stopsSummaryActive ? stopsSummary : undefined}
			>
				{#snippet titleAside()}
					<Stamp kind="record" label={c.stampRecord} />
				{/snippet}

				{#snippet search()}
					<div class="search-stack">
						<div class="search-wrap">
							<SearchInput
								visibleLabel
								textSize="body"
								testId="stops-search"
								label={c.stops.searchLabel}
								placeholder={c.stops.searchPlaceholder}
								bind:value={stopQuery}
							/>
						</div>
						<div class="helper-actions" data-slot="stops-helpers">
							<Button
								variant="outline"
								size="cta-sm"
								wrap
								class="min-h-11"
								onclick={() => {
									stopNear = !stopNear;
									if (stopNear) stopFilterActive = true;
								}}
							>
								{stopNear ? c.stops.nearClear : c.stops.nearMe}
							</Button>
							<Button variant="outline" size="cta-sm" wrap class="min-h-11" href="#fixture-stops">
								{c.stops.nearAddress}
							</Button>
						</div>
						{#if stopNear}
							<p class="helper-status" role="status">{c.stops.nearStatus}</p>
						{/if}
					</div>
				{/snippet}

				<DataTable
					rows={visibleStops}
					columns={stopColumns}
					key={(row) => row.code}
					caption={c.stops.caption}
					rowAlign="middle"
					borderCollapse="separate"
					responsive={{ mode: 'rows', primary: 'stop', value: 'onTime', labels: 'details' }}
					rowDetail={stopRowDetail}
				/>

				{#snippet more()}
					<ShowMore
						shown={visibleStops.length}
						total={filteredStops.length}
						pageSize={3}
						labels={{ showing: c.showing, more: c.showMore }}
						onMore={(count) => {
							stopShown += count;
						}}
					/>
				{/snippet}
			</ListingBody>
		</div>
	{/if}

	{#if show('vehicles')}
		<div id="fixture-vehicles" data-testid="fixture-vehicles">
			{#snippet vehiclesSummary()}
				<FilterSummary
					count={filteredVehicles.length}
					countLabel={c.vehicles.countLabel}
					locale={c.locale}
					clearLabel={c.clearFilters}
					canClear={vehiclesSummaryActive}
					onClear={() => {
						vehicleQuery = '';
						vehicleFilterActive = false;
						vehicleShown = 3;
					}}
				/>
			{/snippet}

			<ListingBody
				title={c.vehicles.title}
				resultCountText={filterCountText(filteredVehicles.length, c.vehicles.countLabel, c.locale)}
				summary={vehiclesSummaryActive ? vehiclesSummary : undefined}
			>
				{#snippet titleAside()}
					<Stamp kind="record" label={c.stampRecord} />
				{/snippet}

				{#snippet search()}
					<div class="search-wrap">
						<SearchInput
							visibleLabel
							textSize="body"
							testId="vehicles-search"
							label={c.vehicles.searchLabel}
							placeholder={c.vehicles.searchPlaceholder}
							description={c.vehicles.searchDescription}
							bind:value={vehicleQuery}
						/>
					</div>
				{/snippet}

				<DataTable
					rows={visibleVehicles}
					columns={vehicleColumns}
					key={(row) => row.id}
					caption={c.vehicles.caption}
					rowAlign="middle"
					borderCollapse="separate"
					responsive={{ mode: 'rows', primary: 'vehicle', value: 'days', labels: 'details' }}
					rowDetail={vehicleRowDetail}
				/>

				{#snippet more()}
					<ShowMore
						shown={visibleVehicles.length}
						total={filteredVehicles.length}
						pageSize={3}
						labels={{ showing: c.showing, more: c.showMore }}
						onMore={(count) => {
							vehicleShown += count;
						}}
					/>
				{/snippet}
			</ListingBody>
		</div>
	{/if}

	{#if show('empty')}
		<div data-testid="fixture-empty">
			{#snippet emptySummary()}
				<FilterSummary
					count={0}
					countLabel={c.lines.countLabel}
					locale={c.locale}
					clearLabel={c.clearFilters}
					onClear={() => {
						emptyQuery = '';
					}}
				/>
			{/snippet}

			<ListingBody
				title={c.empty.title}
				resultCountText={filterCountText(emptyCleared ? LINE_ROWS.length : 0, c.lines.countLabel, c.locale)}
				summary={emptyCleared ? undefined : emptySummary}
			>
				{#snippet titleAside()}
					<Stamp kind="record" label={c.stampRecord} />
				{/snippet}

				{#snippet search()}
					<div class="search-wrap">
						<SearchInput
							visibleLabel
							textSize="body"
							testId="empty-search"
							label={c.empty.searchLabel}
							placeholder={c.empty.searchPlaceholder}
							bind:value={emptyQuery}
						/>
					</div>
				{/snippet}

				{#if emptyCleared}
					<p class="breakdown">{c.empty.restoredNote}</p>
				{:else}
					<StateNotice
						presentation="frameless"
						tone="neutral"
						title={c.empty.noticeTitle}
						body={c.empty.noticeBody}
					>
						{#snippet action()}
							<Button
								variant="outline"
								wrap
								class="min-h-11"
								onclick={() => {
									emptyQuery = '';
								}}
							>
								{c.empty.clearAction}
							</Button>
						{/snippet}
					</StateNotice>
				{/if}
			</ListingBody>
		</div>
	{/if}

	{#if show('loading')}
		<div data-testid="fixture-loading">
			<ListingBody title={c.loading.title}>
				{#snippet titleAside()}
					<Stamp kind="record" label={c.stampRecord} />
				{/snippet}

				{#snippet search()}
					<div class="search-wrap">
						<SearchInput
							visibleLabel
							textSize="body"
							testId="loading-search"
							label={c.loading.searchLabel}
							placeholder={c.loading.searchPlaceholder}
							value=""
							disabled
						/>
					</div>
				{/snippet}

				<DataTable
					loading
					skeletonRows={4}
					rows={[]}
					columns={lineColumns}
					key={(row) => row.id}
					caption={c.loading.caption}
					rowAlign="middle"
					borderCollapse="separate"
					responsive={{ mode: 'rows', primary: 'line', value: 'onTime', labels: 'details' }}
				/>
			</ListingBody>
		</div>
	{/if}

	{#if show('minimal')}
		<div data-testid="fixture-minimal">
			<ListingBody>
				<ul class="minimal-list">
					{#each c.minimal.items as item (item)}
						<li>{item}</li>
					{/each}
				</ul>
			</ListingBody>
		</div>
	{/if}
</div>

<style>
	.listing-fixtures {
		display: grid;
		gap: var(--space-card-gap);
		min-width: 0;
	}

	.page-intro {
		display: grid;
		gap: 0.375rem;
	}

	.page-intro h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: var(--text-title);
		font-weight: 700;
		line-height: 1.15;
	}

	.page-intro p {
		margin: 0;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}

	.search-wrap {
		max-inline-size: 36rem;
		min-inline-size: 0;
	}

	.search-stack {
		display: grid;
		gap: 0.75rem;
		min-inline-size: 0;
	}

	.helper-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.helper-status,
	.breakdown {
		margin: 0;
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}

	.sort-rail {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		min-inline-size: 0;
	}

	.sort-rail :global([data-slot='segmented-choice']) {
		flex: 1 1 18rem;
		width: auto;
	}

	.row-identity {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		min-inline-size: 0;
	}

	.plate-group {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.row-link {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		min-inline-size: var(--size-tap-min);
	}

	.minimal-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.5rem;
	}

	.minimal-list li {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		font-size: var(--text-small);
	}
</style>
