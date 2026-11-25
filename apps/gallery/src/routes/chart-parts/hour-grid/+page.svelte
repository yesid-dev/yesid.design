<script lang="ts">
	import { Card } from '@yesid/ui/card';
	import { HourGrid, type HourGridCell } from '@yesid/ui/chart';

	const columns = Array.from({ length: 24 }, (_, hour) => ({
		id: String(hour), label: `${String(hour).padStart(2, '0')}h`,
	}));
	const emptyStateLabels = { few: '', none: '', unmeasured: '' };
	const rows = ['Mon', 'Tue', 'Wed'].map((day, row) => ({
		id: day,
		label: day,
		cells: columns.map(({ label }, hour): HourGridCell => {
			if (row === 2 || (row === 1 && hour % 4 === 0)) {
				return { text: 'few', level: null, state: 'few', name: `${day}, ${label}, too few to judge` };
			}
			const value = (hour * 3 + row * 5) % 25;
			const level = Math.min(4, Math.floor(value / 5)) as NonNullable<HourGridCell['level']>;
			return { text: String(value), level, name: `${day}, ${label}, ${value}% late` };
		}),
	}));
</script>

<svelte:head><title>24-hour grid · yesid.design</title></svelte:head>

<div class="hour-grid-example">
	<Card edge="neutral" textSize="inherit" class="p-3" data-testid="hour-grid-full-day">
		<h1>24-hour reporting grid</h1>
		<HourGrid label="Hourly reporting by day" {columns} {rows}
			scale={{ label: '', steps: [] }} stateLabels={emptyStateLabels} />
	</Card>
	<Card edge="neutral" textSize="inherit" class="p-3" data-testid="hour-grid-partial-legend">
		<h2>Grid with partially supplied legend labels</h2>
		<HourGrid label="Hours with legend labels" columns={columns.slice(0, 2)}
			rows={[{ id: 'mon', label: 'Mon', cells: [rows[2]!.cells[0]!, { text: '—', level: null, state: 'none', name: 'No service' }] }]}
			scale={{ label: '', steps: ['', '1–4', '  ', '5+'] }}
			stateLabels={{ ...emptyStateLabels, none: 'No service' }} />
	</Card>
</div>

<style>
	.hour-grid-example {
		display: grid;
		gap: var(--space-card-gap);
		margin-inline: auto;
	}
	/* Reproduce Transit’s available card width beside the reading rail. */
	@media (width >= 1280px) {
		.hour-grid-example { inline-size: min(100%, calc(100vw - 384px)); }
	}
	h1, h2 {
		margin-block-end: 0.75rem;
		font-size: var(--text-heading);
	}
</style>
