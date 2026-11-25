<script lang="ts">
	import { BandBar, HourGrid, RangeMark, StopLadder, type BandBarBand, type HourGridCell, type StopLadderStop } from '@yesid/ui/chart';
	import { Card } from '@yesid/ui/card';

	const mix: readonly BandBarBand[] = [
		{ id: 'early', label: 'Early', share: 8, valueLabel: '8%', status: 'early' },
		{ id: 'on-time', label: 'On time', share: 83, valueLabel: '83%', status: 'on_time' },
		{ id: 'late', label: 'Late', share: 8, valueLabel: '8%', status: 'late', detail: 'Five minutes after the schedule or later' },
		{ id: 'unknown', label: 'Unknown', share: 1, valueLabel: '1%', status: 'unknown' },
	];
	const columns = Array.from({ length: 8 }, (_, i) => ({ id: String(i + 6), label: `${i + 6}:00` }));
	const measured = (day: string, hour: string, level: NonNullable<HourGridCell['level']>): HourGridCell => ({
		text: String(level), level, name: `${day}, ${hour}, ${level} late departures`,
	});
	const hours = [
		{ id: 'mon', label: 'Monday', cells: columns.map(({ label }, i) => measured('Monday', label, i % 5 as NonNullable<HourGridCell['level']>)) },
		{
			id: 'tue', label: 'Tuesday', cells: columns.map(({ label }, i): HourGridCell => {
				if (i === 0) return { text: 'Few', level: null, state: 'few', name: 'Tuesday, 6:00, too few trips' };
				if (i === 1) return { text: 'None', level: null, state: 'none', name: 'Tuesday, 7:00, no service' };
				if (i === 2) return { text: '—', level: null, name: 'Tuesday, 8:00, no measurement' };
				return measured('Tuesday', label, 1);
			}),
		},
	];
	const stops: readonly StopLadderStop[] = [
		{ id: 'a', name: 'Main Street', code: '201', href: '#main-street', timingPoint: true, value: 0, valueLabel: 'On time' },
		{ id: 'b', name: 'City Library', code: '202', value: 7, valueLabel: '7 minutes late' },
		{ id: 'c', name: 'Riverside Station', code: '203', value: null, valueLabel: 'No value', state: 'Too few trips' },
		{ id: 'd', name: 'Pier', code: '204', href: '#pier', timingPoint: true, value: 3, valueLabel: '3 minutes late' },
	];
</script>

<svelte:head><title>Service charts · yesid.design</title></svelte:head>

<main class="chart-examples">
	<h1>Service charts</h1>
	<section>
		<h2>Departures by status</h2>
		<BandBar label="8% early, 83% on time, 8% late, 1% unknown" bands={mix} />
		<BandBar label="Early 8%, on time 83%, late 8%, unknown 1%" bands={mix} rows={false} />
		<BandBar label="No status measurements" bands={[]}>
			{#snippet absent()}<p>No measured departures.</p>{/snippet}
		</BandBar>
	</section>
	<section>
		<h2>Departures by hour</h2>
		<Card edge="neutral" textSize="inherit" class="p-3" data-testid="hour-grid-card">
			<HourGrid label="Late departures by hour" {columns} rows={hours}
				scale={{ label: 'Delay scale', steps: ['0 late', '1 late', '2 late', '3 late', '4 late'] }}
				stateLabels={{ few: 'Too few trips', none: 'No service', unmeasured: 'No measurement' }} />
		</Card>
		<p><a href="/chart-parts/hour-grid">24-hour grid example</a></p>
	</section>
	<section>
		<h2>Estimated wait</h2>
		<RangeMark label="Estimated wait 12 minutes, between 9 and 15" low={9} high={15} value={12} domain={[0, 20]}
			reference={{ value: 10, label: 'Network wait is 10 minutes' }} caption="9–15 minutes" />
		<p>Too few observations for a weekend estimate.</p>
	</section>
	<section>
		<h2>Delay by stop</h2>
		<StopLadder label="Stops along route 24" {stops} max={10}
			threshold={{ value: 5, label: 'Five-minute threshold' }}
			highlight={{ fromId: 'b', toId: 'c', label: 'River crossing' }}
			columns={{ stop: 'Stop', value: 'Delay' }} />
		<p id="main-street">Main Street is the first stop.</p>
		<p id="pier">Pier is the last stop.</p>
	</section>
</main>

<style>
	.chart-examples {
		display: grid;
		gap: 1.5rem;
		inline-size: min(100%, 48rem);
		margin-inline: auto;
		padding: 1rem;
		overflow-wrap: anywhere;
	}
	section { min-inline-size: 0; }
	h1 { font-size: var(--text-title); }
	h2 { margin-block-end: 0.75rem; font-size: var(--text-heading); }
	p { margin-block-start: 0.75rem; }
</style>
