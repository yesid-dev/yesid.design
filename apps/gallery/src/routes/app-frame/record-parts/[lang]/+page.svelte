<script lang="ts">
	import { getContext } from 'svelte';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import Search from '@lucide/svelte/icons/search';
	import { AnswerLead, MetricDisplay, ProductBrand, RoutePlate, type NavigationLifecycle } from '@yesid/ui/brand';
	import { Card } from '@yesid/ui/card';
	import { HourGrid, StopLadder, type HourGridCell } from '@yesid/ui/chart';
	import { AppFrame, SiteFooter, SiteHeader } from '@yesid/ui/layout';
	import { DataTable, type DataTableColumn } from '@yesid/ui/table';
	import { LABELS } from '#lib/gallery/site-header-fixture.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const french = $derived(data.lang === 'fr');
	const c = $derived(french ? {
		title: 'Relevé des lignes', details: 'Lignes sans mesure', longNames: 'Arrêts aux noms longs',
		line: 'Ligne', onTime: 'À l’heure', late: 'En retard', trips: 'Trajets effectués',
		events: 'Événements aux arrêts', early: 'En avance', state: 'Trop peu pour juger',
		name: 'Édouard-Montpetit / Côte-des-Neiges', range: '73,2 % à 84,7 %',
		sentence: 'des arrêts prévus ont été desservis à l’heure.',
		hour: 'Retards par heure', measured: 'Heures mesurées', scale: 'Part en retard, en pourcentage :',
		few: 'Peu de trajets', none: 'Aucun service', unmeasured: 'Non mesuré',
		stops: 'Arrêts dans l’ordre du trajet', delay: 'Retard médian', threshold: 'En retard dès 5 min',
		stretch: 'Le retard augmente ici', search: 'Chercher une ligne, un arrêt ou un véhicule',
		compact: 'Ouvrir la recherche', footer: ['À propos', 'Rapports', 'Données', 'Aide', 'Sources'],
		links: ['Accessibilité', 'Télécharger', 'Avis de service', 'Confidentialité', 'Sources de données'],
	} : {
		title: 'Lines record', details: 'Lines without measurements', longNames: 'Stops with long names',
		line: 'Line', onTime: 'On time', late: 'Late', trips: 'Trips that ran',
		events: 'Stop events', early: 'Early', state: 'Too few to judge',
		name: 'Waller / Elmvale and Hospital via North Rideau', range: '73.2% to 84.7%',
		sentence: 'of scheduled stops were served on time.',
		hour: 'Delays by hour', measured: 'Measured hours', scale: 'Late share, in percent:',
		few: 'Too few trips', none: 'No service', unmeasured: 'Unmeasured',
		stops: 'Stops in travel order', delay: 'Median delay', threshold: 'Late from 5 min',
		stretch: 'Delay widens here', search: 'Find a line, stop or vehicle',
		compact: 'Open search', footer: ['About', 'Reports', 'Data', 'Help', 'Sources'],
		links: ['Accessibility', 'Download', 'Service alerts', 'Privacy', 'Data sources'],
	});
	const records = Array.from({ length: 25 }, (_, index) => ({
		id: String(index + 1),
		ontime: 73.2 + index / 2,
		state: index === 1,
	}));
	type RecordRow = (typeof records)[number];
	let sort = $state<{ key: string; direction: 'asc' | 'desc' }>();
	const ordered = $derived(sort?.direction === 'desc' ? records.toReversed() : records);
	const columns = $derived<DataTableColumn<RecordRow>[]>([
		{ key: 'line', header: c.line, rowHeader: true, sortable: true, cell: name },
		{ key: 'ontime', header: c.onTime, numeric: true, sortable: true, cell: ontime },
		{ key: 'late', header: c.late, numeric: true, sortable: true, cell: late },
		{ key: 'trips', header: c.trips, numeric: true, sortable: true, cell: trips },
		{ key: 'events', header: c.events, numeric: true, cell: events },
		{ key: 'early', header: c.early, numeric: true, cell: early },
	]);
	const rowsLayout = { mode: 'rows', primary: 'line', value: 'ontime' } as const;
	const longNames = $derived([
		{ id: '300', name: 'Édouard-Montpetit', ontime: french ? '84,7 %' : '84.7%' },
		{ id: '47', name: 'Station Côte-des-Neiges', ontime: french ? '73,2 %' : '73.2%' },
		{ id: '12', name: 'Lionel-Groulx', ontime: c.state },
	]);
	type LongNameRow = (typeof longNames)[number];
	const longNameColumns = $derived<DataTableColumn<LongNameRow>[]>([
		{ key: 'line', header: c.line, rowHeader: true, cell: longName },
		{ key: 'ontime', header: c.onTime, numeric: true, cell: longNameOntime },
		{ key: 'late', header: c.late, numeric: true, cell: longNameLate },
		{ key: 'trips', header: c.trips, numeric: true, cell: longNameTrips },
	]);
	const hours = [{id:'a',label:'05h'}, {id:'b',label:'06h'}, {id:'c',label:'07h'}, {id:'d',label:'08h'}];
	const measured: HourGridCell = { text: '19', level: 2, name: '19%' };
	const few = $derived<HourGridCell>({ text: c.few, level: null, state: 'few', name: c.few });
	const none = $derived<HourGridCell>({ text: c.none, level: null, state: 'none', name: c.none });
	const day = $derived(french ? 'Lundi' : 'Monday');
	const hourlyRows = $derived([{ id: 'mon', label: day, cells: [
		measured,
		few,
		none,
		{ text: c.unmeasured, level: null, state: 'unmeasured', name: c.unmeasured },
	] }] satisfies { id: string; label: string; cells: HourGridCell[] }[]);
	const stateLabels = $derived({ few: c.few, none: c.none, unmeasured: c.unmeasured });
	const scale = $derived({ label: c.scale, steps: ['0–9', '10–14', '15–19', '20–24', '25+'] });
	const stops = $derived([
		{ id: 'a', name: 'Gare Montréal-Ouest', code: '50110', href: '#record', timingPoint: true,
			value: french ? 5.3 : 0.2, valueLabel: french ? '5,3 min de retard' : '0.2 min' },
		{ id: 'b', name: 'Westminster / Curzon', code: '50147', href: '#record', value: 1.2, valueLabel: '1.2 min' },
		{ id: 'c', name: 'Queen-Mary / Côte-des-Neiges', code: '51055', href: '#record', value: 6.1, valueLabel: '6.1 min' },
		{ id: 'd', name: 'Édouard-Montpetit / Louis-Colin', code: '52847', value: null, valueLabel: '', state: c.state },
	]);
	let footerCount = $state(5);
	const wideGroups = $derived(browser && page.url.searchParams.has('wide-groups'));
	const footerLinks = $derived(browser && page.url.searchParams.has('long-footer')
		? french
			? ['Accessibilité', 'Télécharger les données', 'Alertes et avis de service', 'Vie privée', 'Sources']
			: ['Accessibility', 'Worst trips and vehicles', 'Service alerts and notices', 'Privacy', 'Sources']
		: c.links);
	const footerGroups = $derived(c.footer.slice(0, footerCount).map(
		(label, i) => ({ label, links: [{ href: '#record', label: footerLinks[i]! }] }),
	));
	const labels = $derived(french ? { ...LABELS, nav: 'Navigation', theme: 'Thème', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu' } : LABELS);
	const here = $derived('/app-frame/record-parts/' + data.lang);
	let searchOpen = $state(false);
	function onSort(key: string) {
		sort = { key, direction: sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc' };
	}
</script>

<svelte:head><title>{c.title}</title></svelte:head>

{#snippet name(row: RecordRow)}
	<a class="line-link" href="#record"><RoutePlate code={row.id} /> <span>{c.name}</span></a>
{/snippet}
{#snippet ontime(row: RecordRow)}{row.state ? c.state : `${row.ontime.toFixed(1)}%`}{/snippet}
{#snippet late(_row: RecordRow)}19%{/snippet}
{#snippet trips(row: RecordRow)}{#if !row.state}{french ? '1 197 sur 1 234' : '1,197 of 1,234'}{/if}{/snippet}
{#snippet events(_row: RecordRow)}{french ? '10 000' : '10,000'}{/snippet}
{#snippet early(_row: RecordRow)}8%{/snippet}
{#snippet longName(row: LongNameRow)}
	<a class="line-link" href="#record"><RoutePlate code={row.id} /> <span>{row.name}</span></a>
{/snippet}
{#snippet longNameOntime(row: LongNameRow)}{row.ontime}{/snippet}
{#snippet longNameLate(_row: LongNameRow)}19%{/snippet}
{#snippet longNameTrips(_row: LongNameRow)}{french ? '1 197 sur 1 234' : '1,197 of 1,234'}{/snippet}
{#snippet footerStatus()}<span>État du service</span>{/snippet}
{#snippet exampleFooter()}
	<div class:wide-groups={wideGroups}>
		<SiteFooter groups={footerGroups} tagline={c.title} statusStart={french ? footerStatus : undefined}>
			{#snippet brand()}<ProductBrand product="Service" href={here} houseHref="/" />{/snippet}
		</SiteFooter>
	</div>
{/snippet}

<AppFrame mainLabel={c.title}>
	{#snippet header()}
		<SiteHeader {navigation} {labels} home={here} links={[]} menuItems={[{ href: '#record', label: c.title }]}>
			{#snippet brand()}<ProductBrand product="Service" href={here} houseHref="/" />{/snippet}
			{#snippet search()}<input type="search" class="inline-search" aria-label={c.search} placeholder={c.search} />{/snippet}
			{#snippet actions()}
				<button type="button" class="hidden min-h-11 min-w-11 items-center justify-center" data-slot="nav-compact-search"
					aria-label={c.compact} aria-expanded={searchOpen} onclick={() => searchOpen = !searchOpen}><Search size="1em" aria-hidden="true" /></button>
			{/snippet}
		</SiteHeader>
	{/snippet}
	{#snippet footer()}
		{#if footerCount === 5}{@render exampleFooter()}{/if}
	{/snippet}

	<section id="record" class="record-parts" data-density="compact" lang={data.lang}>
		<h1>{c.title}</h1>
		<label>
			{french ? 'Groupes de liens du pied de page' : 'Footer link groups'}
			<select bind:value={footerCount} data-testid="footer-group-count">
				<option value={3}>3</option>
				<option value={4}>4</option>
				<option value={5}>5</option>
			</select>
		</label>
		{#if searchOpen}<input type="search" aria-label={c.search} />{/if}
		<div data-testid="answer-part">
			<AnswerLead value={c.range} sentence={c.sentence} />
			<div data-testid="absent-answer">
				<AnswerLead value={null} sentence={c.sentence}>
					{#snippet absent()}<strong>{c.details} · {c.state} · {c.measured}</strong>{/snippet}
				</AnswerLead>
			</div>
			<MetricDisplay size="lg" value="84%" label={c.onTime} />
		</div>
		<div class="record-table" data-testid="record-table">
			<DataTable rows={ordered} {columns} key={(row) => row.id} caption={c.title}
				responsive={rowsLayout} {sort} {onSort} pageSize={20}
				pageLabels={{ showing: (shown, total) => `${shown} / ${total}`, more: (count) => french ? `Afficher ${count}` : `Show ${count}` }} />
		</div>
		<div class="record-table">
			<DataTable rows={records.slice(0, 1)} columns={columns.filter(({ key }) => key !== 'ontime')}
				key={(row) => row.id} caption={c.details} responsive={rowsLayout} />
		</div>
		<div class="record-table">
			<Card edge="neutral" class="p-4" data-testid="long-names-table">
				<DataTable rows={longNames} columns={longNameColumns} key={(row) => row.id} caption={c.longNames}
					responsive={rowsLayout} />
			</Card>
		</div>
		<div data-testid="mixed-hour-grid">
			<HourGrid label={c.hour} columns={hours} rows={hourlyRows} {scale} {stateLabels} />
		</div>
		<div data-testid="measured-hour-grid">
			<HourGrid label={c.measured} columns={hours.slice(0, 1)} rows={[{ id: 'mon', label: day, cells: [measured] }]} {scale} {stateLabels} />
		</div>
	<div data-testid="no-unmeasured-hour-grid">
		<HourGrid label={`${c.measured} · ${c.few}`} columns={hours.slice(0, 2)} rows={[{ id: 'mon', label: day, cells: [measured, few] }]} {scale} {stateLabels} />
	</div>
	<div data-testid="none-only-hour-grid">
		<HourGrid label={c.none} columns={hours.slice(0, 1)} rows={[{ id: 'mon', label: day, cells: [none] }]} {scale} {stateLabels} />
	</div>
		<StopLadder label={c.stops} {stops} max={10} columns={{ stop: c.stops, value: c.delay }}
			threshold={{ value: 5, label: c.threshold }} highlight={{ fromId: 'b', toId: 'c', label: c.stretch }} />
	</section>
</AppFrame>
{#if footerCount < 5}{@render exampleFooter()}{/if}

<style>
	.wide-groups :global(.footer-columns > nav) { min-inline-size: min(150px, 100%); }
	.record-parts { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; inline-size: min(100%, 64rem); margin-inline: auto; padding: 1rem; }
	.record-table { inline-size: min(100%, 27rem); }
	.line-link { display: flex; flex-wrap: wrap; gap: 0 0.35em; align-items: baseline; min-block-size: var(--size-tap-min); }
	.inline-search { inline-size: min(21rem, 30vw); min-block-size: var(--size-tap-min); }
</style>
