<script lang="ts">
	import { FilterSummary, SegmentedChoice } from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { Card } from '@yesid/ui/card';
	import { MapFrame, MapLegend, StillMap, placeMapLabels, type MapViewport } from '@yesid/ui/map';

	let query = $state('');
	let search = $state<HTMLInputElement>();
	let selection = $state('incoming');
	const options = [
		{ key: 'incoming', label: 'Vers la station Édouard-Montpetit' },
		{ key: 'outgoing', label: 'Vers le terminus de correspondance' },
	];
	const counts = { singular: '{count} résultat', plural: '{count} résultats' };
	const cells = [
		{ label: '8 %', tier: 0 }, { label: '13 %', tier: 1 }, { label: '18 %', tier: 2 },
		{ label: '23 %', tier: 3 }, { label: '31 %', tier: 4 },
	];

	function labels({ width, height, exclusions }: MapViewport) {
		return placeMapLabels({
			bounds: { x: 0, y: 0, width, height },
			obstacles: exclusions,
			labels: [{ id: '24', candidates: [
				{ x: 24, y: 26, width: 64, height: 35 },
				{ x: width / 2 - 32, y: height / 2 - 17, width: 64, height: 35 },
			] }],
		});
	}

	function clear() {
		query = '';
		search?.focus();
	}
</script>

<svelte:head><title>Map components — yesid.design</title></svelte:head>

{#snippet routeSymbol()}<span class="route-key"></span>{/snippet}
{#snippet stopSymbol()}<span class="stop-key"></span>{/snippet}

{#snippet details()}
	<p>Prochain arrêt</p>
	<p>Station Édouard-Montpetit</p>
	<Button href="/text-links" wrap>Voir les correspondances à cet arrêt</Button>
{/snippet}

<section class="specimen" lang="fr" data-testid="map-parts">
	<h1>Carte du service</h1>
	<MapFrame label="Carte du réseau" details={{ label: 'Renseignements sur cet arrêt', content: details }}>
		{#snippet children(viewport)}
			<div class="art" aria-hidden="true">
				<svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
					<path d="M0 108 H82 L144 48 H320" fill="none" stroke="var(--line-amber)" stroke-width="4" />
					<circle cx="144" cy="48" r="5" fill="var(--foreground)" />
				</svg>
				{#each labels(viewport) as { id, bounds } (id)}
					<span class="map-label" style:left="{bounds.x}px" style:top="{bounds.y}px" data-testid="map-label">{id}</span>
				{/each}
			</div>
		{/snippet}
		{#snippet panel()}
			<label for="station-search">Rechercher un arrêt</label>
			<input id="station-search" bind:this={search} bind:value={query} />
			<FilterSummary count={query ? 1 : 2} countLabel={counts} locale="fr" clearLabel="Effacer la recherche" onClear={clear} canClear={query.trim().length > 0} />
		{/snippet}
		{#snippet legend()}
			<MapLegend title="Légende de la carte" items={[{ label: 'Ligne en service', symbol: routeSymbol }, { label: 'Arrêt sélectionné', symbol: stopSymbol }]} />
		{/snippet}
	</MapFrame>

	<div class="cards">
		<Card edge="neutral" spread textSize="inherit" class="p-4">
			<h2>Prochain passage</h2>
			<p data-testid="spread-end">Consultez l’horaire de la station.</p>
		</Card>
		<Card edge="neutral" textSize="inherit" class="p-4">
			<h2>Emplacement de la station</h2>
			<StillMap label="La station se situe au virage de la ligne 24" viewBox={[0, 0, 320, 160]}>
				<path d="M0 108 H82 L144 48 H320" fill="none" stroke="var(--line-amber)" stroke-width="4" />
				<circle cx="144" cy="48" r="6" fill="var(--foreground)" />
			</StillMap>
		</Card>
	</div>

	<Card edge="neutral" textSize="inherit" class="p-4">
		<h2>Directions du service</h2>
		<SegmentedChoice {options} value={selection} label="Direction" variant="joined-grid" onSelect={(key) => selection = key} />
		<div class="heatmap" aria-label="Part des passages en retard" role="list">
			{#each cells as { label, tier }}
				<span role="listitem" style:--cell="var(--dataviz-heatmap-neutral-{tier})" style:--ink="var(--dataviz-heatmap-neutral-ink-{tier})">{label}</span>
			{/each}
		</div>
	</Card>
</section>

<style>
	.specimen { display: grid; gap: var(--space-card-gap); min-inline-size: 0; }
	h1 { font-size: var(--text-title); }
	h2 { font-size: var(--text-heading); }
	.art { position: absolute; inset: 0; overflow: hidden; }
	.art svg { display: block; inline-size: 100%; block-size: 100%; }
	.map-label {
		position: absolute;
		display: grid;
		place-items: center;
		inline-size: 64px;
		block-size: 35px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--signage-bg);
		color: var(--signage-text);
		font-family: var(--font-mono);
	}
	.route-key {
		inline-size: 100%;
		block-size: 0.2em;
		background: var(--line-amber);
	}
	.stop-key {
		inline-size: 0.6em;
		block-size: 0.6em;
		border: 1px solid var(--foreground);
		border-radius: var(--radius-pill);
	}
	input { inline-size: 100%; color: var(--foreground); }
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
		gap: var(--space-card-gap);
	}
	.heatmap { display: flex; flex-wrap: wrap; gap: 0.25rem; }
	.heatmap span {
		padding: 0.25em 0.5em;
		background: var(--cell);
		color: var(--ink);
		font-family: var(--font-mono);
	}
</style>
