<!--
  ListingBody `presentation="regions"` inside a card that owns its frame, padding, title, stamp,
  16px title-to-body spacing and evidence footer.
-->
<script lang="ts">
	import {
		FilterSummary,
		SearchInput,
		SegmentedChoice,
		Stamp,
		filterCountText,
	} from '@yesid/ui/brand';
	import { ListingBody } from '@yesid/ui/layout';
	import { ShowMore } from '@yesid/ui/table';

	const countLabel = { singular: '{count} line', plural: '{count} lines' };
	const rows = ['24 Sherbrooke', '51 Édouard-Montpetit', '161 Van Horne'];
	const sortOptions = [
		{ key: 'code', label: 'Line' },
		{ key: 'onTime', label: 'On time' },
	];

	let query = $state('');
	let sortKey = $state('code');
</script>

<svelte:head><title>yesid.design — listing body regions</title></svelte:head>

{#snippet stamp()}
	<Stamp kind="record" label="Record" />
{/snippet}
{#snippet search()}
	<SearchInput
		visibleLabel
		textSize="body"
		label="Search lines"
		placeholder="Number or name"
		bind:value={query}
	/>
{/snippet}
{#snippet summary()}
	<FilterSummary
		count={rows.length}
		{countLabel}
		locale="en-CA"
		clearLabel="Clear filters"
		onClear={() => {
			query = '';
		}}
	/>
{/snippet}
{#snippet sort()}
	<SegmentedChoice
		label="Sort lines"
		options={sortOptions}
		value={sortKey}
		variant="fit-row"
		onSelect={(key) => {
			sortKey = key;
		}}
	/>
{/snippet}
{#snippet results()}
	<ul class="rows">
		{#each rows as row (row)}
			<li>{row}</li>
		{/each}
	</ul>
{/snippet}
{#snippet more()}
	<ShowMore
		shown={rows.length}
		total={12}
		pageSize={3}
		labels={{
			showing: (shown, total) => `Showing ${shown} of ${total}`,
			more: (count) => `Show ${count} more`,
		}}
		onMore={() => {}}
	/>
{/snippet}

<div class="cards">
	<h1>Listing body regions</h1>

	<article class="card" data-testid="regions-card-full" aria-labelledby="regions-full-title">
		<header>
			<h2 id="regions-full-title">Every measured line</h2>
			{@render stamp()}
		</header>
		<ListingBody
			presentation="regions"
			{search}
			{summary}
			resultCountText={filterCountText(rows.length, countLabel, 'en-CA')}
			{sort}
			{more}
		>
			{@render results()}
		</ListingBody>
		<footer>Evidence: 12 lines measured.</footer>
	</article>

	<article class="card" data-testid="regions-card-sparse" aria-labelledby="regions-sparse-title">
		<header>
			<h2 id="regions-sparse-title">Find a stop</h2>
			{@render stamp()}
		</header>
		<ListingBody
			presentation="regions"
			{search}
			resultCountText={filterCountText(rows.length, countLabel, 'en-CA')}
		>
			{@render results()}
		</ListingBody>
		<footer>Evidence: summary, sort and paging are absent.</footer>
	</article>

	<article class="card" data-testid="regions-card-results" aria-labelledby="regions-results-title">
		<header>
			<h2 id="regions-results-title">Results only</h2>
		</header>
		<ListingBody presentation="regions">
			{@render results()}
		</ListingBody>
		<footer>Evidence: every optional region is absent.</footer>
	</article>

	<article class="card" data-testid="regions-card-titled" aria-labelledby="regions-titled-title">
		<header>
			<h2 id="regions-titled-title">Line directory</h2>
		</header>
		<ListingBody
			presentation="regions"
			title="Frequent lines"
			titleLevel={3}
			titleAside={stamp}
			{sort}
		>
			{@render results()}
		</ListingBody>
		<footer>Evidence: the regions bring their own title row.</footer>
	</article>
</div>

<style>
	.cards {
		display: grid;
		gap: var(--space-card-gap);
		min-width: 0;
	}

	h1,
	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		line-height: 1.25;
	}

	h1 {
		font-size: var(--text-title);
	}

	h2 {
		font-size: var(--text-card-title);
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
		padding: var(--space-card-gap);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		color: var(--card-foreground);
	}

	.card > header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 0.75rem;
	}

	.card > footer {
		color: var(--muted-foreground);
		font-size: var(--text-small);
	}

	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		padding-block: 0.5rem;
		border-bottom: 1px solid var(--border);
		font-size: var(--text-small);
	}
</style>
