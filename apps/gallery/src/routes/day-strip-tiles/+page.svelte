<!--
  DayStrip counts that wrap: a week inside nested card padding, ten days, and a short strip. The
  figures include the longest shapes a row must hold on one line, with their non-breaking spaces.
-->
<script lang="ts">
	import { Card } from '@yesid/ui/card';
	import { DayStrip, type DayStripCell } from '@yesid/ui/chart';

	const figures = ['8 h', '17.5 h', '100 %', null, '71,5 %'];

	function days(count: number): DayStripCell[] {
		return Array.from({ length: count }, (_, index) => {
			const value = figures[index % figures.length]!;
			return {
				id: String(index),
				label: String(index + 10),
				report: value === null ? null : { value, fraction: ((index % 5) + 6) / 12 },
			};
		});
	}
</script>

<svelte:head><title>yesid.design — day strip tiles</title></svelte:head>

{#snippet strip(count: number, label: string)}
	<DayStrip {label} cells={days(count)} reportedLabel="Hours with reports" missingLabel="No report" />
{/snippet}

<div class="examples">
	<h1>Day strip tiles</h1>

	<div data-testid="strip-card">
		<Card edge="neutral" class="p-4">
			<Card edge="neutral" class="p-4">
				{@render strip(7, 'One week in a card')}
			</Card>
		</Card>
	</div>
	<div data-testid="strip-ten">{@render strip(10, 'Ten days')}</div>
	<div data-testid="strip-short">{@render strip(3, 'Three days')}</div>
</div>

<style>
	.examples {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 2rem;
	}

	h1 {
		margin: 0;
		font-size: var(--text-title);
	}
</style>
