<script lang="ts">
	import { StatusMark, statusGlyph, type StatusMarkStatus } from '@yesid/ui/brand';
	import { MapFrame, MapLegend, placeMapLabels, type MapLegendItem, type MapViewport } from '@yesid/ui/map';

	let windowWidth = $state<number>();

	const liveStatuses: readonly { id: StatusMarkStatus; label: string; detail: string }[] = [
		{ id: 'early', label: 'Early', detail: 'More than a minute before schedule' },
		{ id: 'on_time', label: 'On time', detail: 'Within the scheduled window' },
		{ id: 'late', label: 'Late', detail: 'At least five minutes after schedule' },
		{ id: 'unknown', label: 'Unknown', detail: 'No usable location report' },
	];
	const scaleSteps = ['0–5%', '5–10%', '10–20%', '20–30%', '30% or more'].map((label, tier) => ({
		label, swatch: `var(--dataviz-heatmap-neutral-${tier})`,
	}));
	const crowdingSteps = ['Seats free', 'Some standing', 'Full'].map((label, tier) => ({
		label, swatch: `var(--dataviz-heatmap-neutral-${tier * 2})`,
	}));

	function routeLabels({ width, height, exclusions }: MapViewport) {
		return placeMapLabels({
			bounds: { x: 0, y: 0, width, height },
			obstacles: exclusions,
			labels: [{ id: '24', candidates: [
				{ x: width - 76, y: height - 126, width: 64, height: 35 },
				{ x: width / 2 - 32, y: 32, width: 64, height: 35 },
				{ x: 24, y: height - 48, width: 64, height: 35 },
			] }],
		});
	}
</script>

<svelte:head><title>Map legends · yesid.design</title></svelte:head>
<svelte:window bind:innerWidth={windowWidth} />

{#snippet liveGlyph(status: StatusMarkStatus)}
	{@const glyph = statusGlyph(status)}
	<svg viewBox={glyph.viewBox} class="symbol" style:color={`var(--dataviz-status-${status.replace('_', '-')})`} aria-hidden="true">
		<path d={glyph.path} fill="currentColor" fill-rule="evenodd" />
	</svg>
{/snippet}
{#snippet early()}{@render liveGlyph('early')}{/snippet}
{#snippet onTime()}{@render liveGlyph('on_time')}{/snippet}
{#snippet late()}{@render liveGlyph('late')}{/snippet}
{#snippet unknown()}{@render liveGlyph('unknown')}{/snippet}
{#snippet unavailable()}<span class="unavailable"></span>{/snippet}
{#snippet route()}<span class="route"></span>{/snippet}
{#snippet stop()}<span class="stop"></span>{/snippet}

{#snippet liveLegend()}
	{@const glyphs = { early, on_time: onTime, late, unknown, severe: late }}
	{@const items = liveStatuses.map(({ id, label, detail }): MapLegendItem => ({ label, detail, symbol: glyphs[id] }))}
	<MapLegend title="Live legend" collapsible persistKey="gallery-live-legend"
		groups={[{ title: 'Vehicle status', items }]} />
{/snippet}

<section class="examples">
	<h1>Map legends</h1>
	{#snippet routeDetails()}<p>Frequency and travel time</p>{/snippet}
	<MapFrame
		label="Live service map"
		legendLabel="Show map legend"
		legend={liveLegend}
		details={windowWidth === undefined || windowWidth >= 1024 ? { label: 'Route details', content: routeDetails } : undefined}
	>
		{#snippet panel()}<p>Route 24</p>{/snippet}
		{#snippet children(viewport)}
			<div class="map-art" aria-hidden="true">
				<svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
					<path d="M0 95 H105 L160 65 H320" fill="none" stroke="var(--line-amber)" stroke-width="3" />
				</svg>
				{#each routeLabels(viewport) as { id, bounds } (id)}
					<span class="map-label" style:left={`${bounds.x}px`} style:top={`${bounds.y}px`} data-testid="map-legend-label">{id}</span>
				{/each}
			</div>
			<span hidden data-testid="map-legend-exclusions" data-count={viewport.exclusions.length} data-width={viewport.width}></span>
		{/snippet}
	</MapFrame>

	{#snippet shortLegend()}
		<MapLegend title="Short map legend" items={[{ label: 'Route', symbol: route }, { label: 'Stop', symbol: stop }]} />
	{/snippet}
	<div class="short-host" data-testid="short-map-host">
		<MapFrame label="Map in a short host" legendLabel="Open the short map legend" legend={shortLegend} fillHeight legendSide="start">
			{#snippet children()}
				<div class="map-art" aria-hidden="true">
					<svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
						<path d="M0 60 H140 L190 110 H320" fill="none" stroke="var(--line-amber)" stroke-width="3" />
					</svg>
				</div>
			{/snippet}
		</MapFrame>
	</div>

	<MapLegend title="Service legend" detailLayout="inline" scalePlacement="before-groups" data-testid="inline-legend"
		scale={{ title: 'Crowding by trip', steps: crowdingSteps }}
		groups={[{ title: 'Service frequency', items: [
			{ label: 'Frequent', detail: 'every ten minutes or better, all day', symbol: route },
			{ label: 'Regular', detail: 'every fifteen to thirty minutes', symbol: route },
			{ label: 'Stop', symbol: stop },
		] }]} />

	<MapLegend title="Stops legend" scale={{ title: 'Late departures by stop', steps: scaleSteps,
		states: [{ label: 'No observation', detail: 'No service data for this stop', symbol: unavailable }] }}
		groups={[{ title: 'Map features', items: [{ label: 'Stop', symbol: stop }, { label: 'Route', symbol: route }] }]} />

	<MapLegend title="Corridors legend" groups={[{ title: 'Network', items: [
		{ label: 'Service corridor', detail: 'Shown along the route', symbol: route },
		{ label: 'Unavailable', detail: 'Not enough observations to compare', symbol: unavailable },
	] }]} />

	<section aria-label="Status glyphs" class="status-examples">
		{#each liveStatuses as { id, label } (id)}
			<StatusMark status={id} {label} />
		{/each}
		<StatusMark status="severe" label="Severe" />
	</section>
</section>

<style>
	.examples { display: grid; gap: 1rem; }
	h1 { font-size: var(--text-title); }
	.map-art { position: absolute; inset: 0; background: var(--surface-2); }
	.map-art > svg { inline-size: 100%; block-size: 100%; }
	.map-label {
		position: absolute;
		display: grid;
		place-items: center;
		inline-size: 64px;
		block-size: 35px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--signage-text);
		background: var(--signage-bg);
	}
	.short-host { block-size: 15rem; }
	.status-examples { display: flex; flex-wrap: wrap; gap: 0.75rem; }
	.symbol { inline-size: 1em; block-size: 1em; }
	.route { inline-size: 100%; block-size: 0.2em; background: var(--line-amber); }
	.stop, .unavailable { inline-size: 0.75em; block-size: 0.75em; border: 1px solid currentColor; }
	.stop { border-radius: 50%; }
	.unavailable { border-style: dashed; }
</style>
