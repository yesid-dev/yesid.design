<script lang="ts">
	import { RoutePlate, StatusMark } from '@yesid/ui/brand';
	import { Card } from '@yesid/ui/card';
	import {
		ChartAxis, ChartBarSeries, ChartFrame, ChartLegend, ChartLineSeries, DayStrip,
		type ChartPlot,
	} from '@yesid/ui/chart';
	import { StateNotice } from '@yesid/ui/feedback';
	import { DataTable, type DataTableColumn } from '@yesid/ui/table';

	const record = [
		{ day: 'Lundi 16 novembre', hours: 8, label: '8 h' },
		{ day: 'Mardi 17 novembre', hours: null, label: 'Aucun signalement' },
		{ day: 'Mercredi 18 novembre', hours: 6, label: '6 h' },
		{ day: 'Jeudi 19 novembre', hours: 10, label: '10 h' },
		{ day: 'Vendredi 20 novembre', hours: 12, label: '12 h' },
	];
	const points = record.map((row, index) => ({ x: index, y: row.hours }));
	const ticks = [0, 6, 12].map((value) => ({ value, label: `${value} h` }));
	const days = record.map((row, value) => ({ value, label: String(16 + value) }));
	const cells = record.map((row, index) => ({
		id: row.day,
		label: String(16 + index),
		dateLabel: row.day,
		report: row.hours === null ? null : { value: row.label, fraction: row.hours / 12 },
	}));
	type Row = (typeof record)[number];
	const columns: DataTableColumn<Row>[] = [
		{ key: 'date', header: 'Date du relevé', rowHeader: true, cell: date },
		{ key: 'hours', header: 'Heures avec signalements', cell: hours },
	];
</script>

<svelte:head><title>Record components — yesid.design</title></svelte:head>

{#snippet date(row: Row)}{row.day}{/snippet}
{#snippet hours(row: Row)}{row.label}{/snippet}

{#snippet axes(plot: ChartPlot)}
	<ChartAxis {plot} axis="y" {ticks} />
	<ChartAxis {plot} axis="x" ticks={days} />
{/snippet}

<section class="record" lang="fr" data-testid="record-parts">
	<h1>Relevé du service</h1>
	<div class="route">
		<RoutePlate code="24" size="lg" />
		<StatusMark status="late" label="En retard" detail="4 min" />
		<RoutePlate code="A" scheduleOnly />
		<span>Horaire seulement</span>
	</div>

	<div class="charts">
		<Card edge="neutral" class="gap-3 p-4">
			<h2>Heures par jour</h2>
			<ChartFrame label="Heures par jour, en barres" xDomain={[-0.5, 4.5]} yDomain={[0, 12]}>
				{#snippet children(plot)}
					{@render axes(plot)}
					<ChartBarSeries {plot} {points} bandWidth={1} />
				{/snippet}
				{#snippet legend()}
					<ChartLegend label="Légende" items={[{ kind: 'bar', label: 'Heures avec signalements' }]} />
				{/snippet}
			</ChartFrame>
		</Card>
		<Card edge="neutral" class="gap-3 p-4">
			<h2>Évolution du service</h2>
			<p>Chaque mesure correspond aux signalements reçus cette journée.</p>
			<ChartFrame label="Heures par jour, en courbe" xDomain={[0, 4]} yDomain={[0, 12]}>
				{#snippet children(plot)}
					{@render axes(plot)}
					<ChartLineSeries {plot} {points} />
				{/snippet}
				{#snippet legend()}
					<ChartLegend label="Légende" items={[{ kind: 'line', label: 'Heures avec signalements' }]} />
				{/snippet}
			</ChartFrame>
		</Card>
	</div>

	<Card edge="neutral" class="gap-4 p-4">
		<h2>Jours avec signalements</h2>
		<DayStrip label="Signalements par jour" {cells} reportedLabel="Heures avec signalements" missingLabel="Aucun signalement" />
		<StateNotice title="À lire avec prudence" body="Un jour sans signalement ne dit pas si le véhicule a circulé." tone="warning" glyph="△" presentation="frameless" />
		<DataTable rows={record} {columns} key={(row) => row.day} caption="Heures de service par jour" responsive={{ mode: 'stack', at: 'tablet' }} />
	</Card>
	<div class="notice-example" lang="en">
		<StateNotice title="Not published" role="status" body="Ottawa’s agency does not publish its service alerts here.">
			{#snippet action()}
				<a class="inline-flex min-h-11 items-center text-primary underline" href="#notice-source">Check official notices</a>
			{/snippet}
		</StateNotice>
		<p id="notice-source">Local service notices are published by the agency.</p>
	</div>
</section>

<style>
	.record {
		display: grid;
		gap: var(--space-card-gap);
		min-inline-size: 0;
	}
	h1 { font-size: var(--text-title); }
	h2 { font-size: var(--text-heading); }
	.route { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1rem; }
	.notice-example { inline-size: min(100%, 44rem); }
	.charts {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 23rem), 1fr));
		gap: var(--space-card-gap);
	}
</style>
