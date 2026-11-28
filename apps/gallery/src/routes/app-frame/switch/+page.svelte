<script lang="ts">
	import { createRawSnippet, getContext } from 'svelte';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { CollapsibleSection, ProductBrand, type NavigationLifecycle } from '@yesid/ui/brand';
	import { ChartFrame } from '@yesid/ui/chart';
	import { AppFrame, SiteFooter, SiteHeader } from '@yesid/ui/layout';
	import { MapFrame } from '@yesid/ui/map';
	import { DataTable, type DataTableColumn } from '@yesid/ui/table';
	import { LABELS } from '#lib/gallery/site-header-fixture.js';

	// A Live/Record style switch: the record view mounts several tables, charts, sections and a map
	// at once, the way a product page does on a client switch.
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const here = '/app-frame/switch';
	let view = $state<'live' | 'record'>('live');
	const hours = Array.from({ length: 18 }, (_, index) => `${String(index + 5).padStart(2, '0')}h`);
	type Row = { id: string; values: number[] };
	const rows: Row[] = Array.from({ length: 12 }, (_, index) => ({
		id: String(index + 1),
		values: hours.map((_, hour) => Math.round(50 + 40 * Math.sin(index + hour / 3))),
	}));
	const columns: DataTableColumn<Row>[] = [
		{ key: 'line', header: 'Line', rowHeader: true, cell: line },
		...hours.map((label, hour) => ({
			key: label,
			header: label,
			numeric: true,
			cell: createRawSnippet((row: () => Row) => ({ render: () => `<span>${row().values[hour]}%</span>` })),
		})),
	];
	const points = Array.from({ length: 24 }, (_, index) => [index, 50 + 30 * Math.sin(index / 3)] as const);
	const sections = ['On time', 'Delays', 'Trips', 'Stops', 'Vehicles', 'Hours'];
	// `?scroll=start|end|mixed` picks where the tables open; mixed alternates.
	const scroll = $derived((browser && page.url.searchParams.get('scroll')) || 'mixed');
	const initialScroll = (index: number) => (scroll === 'mixed' ? (index % 2 ? 'start' : 'end') : scroll === 'start' ? 'start' : 'end');
</script>

<svelte:head><title>App frame switch</title></svelte:head>

{#snippet line(row: Row)}{row.id}{/snippet}

<AppFrame mainLabel="Line record">
	{#snippet header()}
		<SiteHeader {navigation} labels={LABELS} home={here} links={[]} menuItems={[{ href: here, label: 'Line record' }]}>
			{#snippet brand()}<ProductBrand product="Service" href={here} houseHref="/" />{/snippet}
		</SiteHeader>
	{/snippet}
	{#snippet footer()}
		<SiteFooter groups={[]} tagline="Service records">
			{#snippet brand()}<ProductBrand product="Service" href={here} houseHref="/" />{/snippet}
		</SiteFooter>
	{/snippet}

	<section class="px-6 py-8">
		<h1>Line record</h1>
		<div role="group" aria-label="View">
			<button type="button" data-testid="view-live" aria-pressed={view === 'live'} onclick={() => (view = 'live')}>Live</button>
			<button type="button" data-testid="view-record" aria-pressed={view === 'record'} onclick={() => (view = 'record')}>Record</button>
		</div>
		{#if view === 'record'}
			<div data-testid="record-view">
				<MapFrame label="Line map">
					{#snippet children(viewport)}
						<div class="switch-map" data-width={viewport.width}></div>
					{/snippet}
				</MapFrame>
				{#each sections as title, index (title)}
					<CollapsibleSection {title} {index}>
						<ChartFrame label="{title} by hour" xDomain={[0, 23]} yDomain={[0, 100]}>
							{#snippet children(plot)}
								<polyline fill="none" stroke="currentColor" points={points.map(([x, y]) => `${plot.x(x)},${plot.y(y)}`).join(' ')} />
							{/snippet}
						</ChartFrame>
						<DataTable caption="{title} by line and hour" {rows} {columns} key={(row) => row.id} responsive={{ mode: 'scroll', initialScroll: initialScroll(index) }} />
					</CollapsibleSection>
				{/each}
			</div>
		{:else}
			<p data-testid="live-view">Live departures.</p>
		{/if}
	</section>
</AppFrame>

<style>
	.switch-map { block-size: 20rem; }
</style>
