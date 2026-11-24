<script lang="ts">
	import { AnswerLead, Stamp } from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { Card } from '@yesid/ui/card';
	import { DayStrip } from '@yesid/ui/chart';
	import { DataTable, ShowMore, type DataTableColumn } from '@yesid/ui/table';
	import { tick } from 'svelte';

	const data = [
		{ id: 'A', label: 'Prairies', percentage: 71.5, observed: 31 },
		{ id: 'B', label: 'Montagne', percentage: 90.5, observed: 54 },
		{ id: 'C', label: 'Lac', percentage: 82.5, observed: 19 },
		{ id: 'D', label: 'Rivière', percentage: 95.5, observed: 72 },
		{ id: 'E', label: 'Carrefour', percentage: 60.5, observed: 93 },
	];
	type Row = (typeof data)[number];
	const number = new Intl.NumberFormat('fr-CA');
	const cells = Array.from({ length: 7 }, (_, index) => ({
		id: String(index), label: String(16 + index), dateLabel: `${16 + index} novembre`,
		report: index === 1 ? null : { value: '71,5 %', fraction: 0.715 },
	}));
	const columns: DataTableColumn<Row>[] = [
		{ key: 'label', header: 'Secteur', rowHeader: true, cell: label, sortable: true },
		{ key: 'percentage', header: 'Part à l’heure', numeric: true, cell: percentage, sortable: true },
		{ key: 'observed', header: 'Signalements d’arrivées à un arrêt', numeric: true, cell: observed },
	];
	const pageLabels = { showing: (shown: number, total: number) => `${shown} sur ${total}`, more: (count: number) => `Afficher ${count} de plus` };
	let sort = $state<{ key: string; direction: 'asc' | 'desc' }>({ key: 'label', direction: 'asc' });
	let listCount = $state(2);
	let list = $state<HTMLUListElement>();
	let updatedAt = $state<Date>();
	const rows = $derived(data.toSorted((a, b) => {
		const order = sort.key === 'percentage' ? a.percentage - b.percentage : a.label.localeCompare(b.label, 'fr-CA');
		return sort.direction === 'asc' ? order : -order;
	}));
	function changeSort(key: string): void {
		sort = { key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' };
	}

	async function showMoreSectors(count: number): Promise<void> {
		const firstNew = listCount;
		listCount += count;
		await tick();
		list?.querySelectorAll('li')[firstNew]?.focus();
	}
</script>

<svelte:head><title>Service findings and paged records</title></svelte:head>

{#snippet label(row: Row)}<a href="#reflow">{row.label}</a>{/snippet}
{#snippet percentage(row: Row)}{number.format(row.percentage)} %{/snippet}
{#snippet observed(row: Row)}{number.format(row.observed)}{/snippet}

<div lang="fr-CA" class="record" data-testid="d1-record">
	<h1>Relevé du service</h1>
	<AnswerLead value="71,5 %" sentence="des arrêts prévus ont été desservis à l’heure." comparison="2 points de plus que la semaine précédente.">
		{#snippet stamp()}<Stamp kind="record" label="Relevé · du 16 au 22 novembre 2026" />{/snippet}
		{#snippet meta()}<p>31 arrêts sur sept jours</p><p>Méthode 3, édition 1</p>{/snippet}
		{#snippet actions()}<Button variant="outline" wrap href="#reflow">Consulter les chiffres détaillés</Button>{/snippet}
	</AnswerLead>
	<AnswerLead value={null} size="md" sentence="Les données du dimanche restent inconnues.">
		{#snippet absent()}<p>Aucun signalement</p>{/snippet}
	</AnswerLead>
	<AnswerLead value="0" size="md" sentence="trajet annulé dans le secteur du Lac." />
	<div class="stamps">
		<Stamp kind="live" label="En direct · à l’instant" {updatedAt} agoLabel={(seconds) => `En direct · il y a ${seconds} s`} />
		<Stamp kind="live" late label="En direct · interrompu depuis 14 h" />
		<Button variant="outline" wrap onclick={() => (updatedAt = new Date())}>Actualiser l’heure</Button>
	</div>
	<Card edge="neutral" class="p-4 gap-3">
		<h2>Secteurs mesurés</h2>
		<DataTable {rows} {columns} key={(row) => row.id} caption="Résultats par secteur"
			responsive={{ mode: 'rows', primary: 'label', value: 'percentage' }} {sort} onSort={changeSort}
			pageSize={2} {pageLabels} />
	</Card>
	<Card edge="neutral" class="p-4 gap-3">
		<h2>Autres secteurs</h2>
	<ul class="list-disc ps-4" bind:this={list}>
		{#each data.slice(0, listCount) as row (row.id)}<li tabindex="-1">{row.label}</li>{/each}
		</ul>
	<ShowMore shown={listCount} total={data.length} pageSize={2} labels={pageLabels} onMore={showMoreSectors} />
	</Card>
	<Card edge="neutral" class="p-4 gap-3" id="reflow">
		<h2>Relevé détaillé</h2>
		<DayStrip label="Signalements par jour" {cells} reportedLabel="Signalements reçus" missingLabel="Aucun signalement" />
		<DataTable rows={data.slice(0, 1)} {columns} key={(row) => row.id} caption="Détails des signalements" responsive={{ mode: 'stack', at: 'tablet' }} />
		<div class="narrow-card-actions">
			<Button variant="outline" wrap href="#reflow"><span>Télécharger les signalements d’arrivées</span></Button>
		</div>
	</Card>
</div>

<style>
	.record { display: grid; gap: var(--space-card-gap); min-inline-size: 0; }
	.stamps { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
	h1 { font-size: var(--text-title); }
	h2 { font-size: var(--text-heading); }
	.record :global(td a), .record :global(th a) {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		min-inline-size: var(--size-tap-min);
	}
	.narrow-card-actions { display: flex; max-inline-size: min(100%, 12rem); }
</style>
