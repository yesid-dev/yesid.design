<script lang="ts">
	import { Card } from '@yesid/ui/card';
	import { CollapsibleSection, SectionHeading, TocNav } from '@yesid/ui/brand';
	import type { TocEntry } from '@yesid/ui/brand';
	import { LANGS, SURFACE_COPY } from './fixture';

	const toc: TocEntry[] = [
		{ id: 'cards', title: 'Static and interactive cards', level: 2, children: [] },
		{ id: 'sections', title: 'Section cards', level: 2, children: [] },
		{ id: 'labels', title: 'Reading labels and signage', level: 2, children: [] },
	];
</script>

<svelte:head><title>Reading surfaces</title></svelte:head>

<div data-register="reading" data-ripple-exempt class="reading-surfaces">
	<h1 class="text-title font-heading font-bold">Reading surfaces</h1>
	<p>
		Static cards keep still under the pointer; only a card that acts reacts. Demonstration fixture: no figure is a
		live measurement.
	</p>

	<h2 id="cards" class="text-heading font-heading font-bold">Static and interactive cards</h2>
	<div class="grid">
		<Card class="p-4" data-fixture="static-brand">
			<p class="label-reading">Brand edge, static (default)</p>
			<p>Hover leaves the border and shadow unchanged.</p>
		</Card>
		<Card class="p-4" edge="neutral" data-fixture="static-neutral">
			<p class="label-reading">Neutral edge, static</p>
			<p>The calm reading surface: a neutral border and no glow.</p>
		</Card>
		<a href="#cards" class="card-link">
			<Card class="p-4" interactive data-fixture="interactive-brand">
				<p class="label-reading">Whole-card link, brand edge</p>
				<p>Hover and keyboard focus firm the border and rise one pixel, with no shadow.</p>
			</Card>
		</a>
		<a href="#cards" class="card-link">
			<Card class="p-4" interactive edge="neutral" data-fixture="interactive-neutral">
				<p class="label-reading">Whole-card link, neutral edge</p>
				<p>Hover and keyboard focus firm the border in orange and rise one pixel, with no shadow.</p>
			</Card>
		</a>
		<Card class="p-4" interactive data-fixture="interactive-inside">
			<p class="label-reading">Consumer link inside the card</p>
			<p>
				<a href="#cards" data-testid="inside-card-link">A product-owned link</a>, not a kit control,
				still firms the border and rises one pixel on keyboard focus.
			</p>
		</Card>
	</div>

	{#each LANGS as lang (lang)}
		{@const copy = SURFACE_COPY[lang]}
		<div {lang} class="grid">
			<Card class="p-4" edge="neutral" textSize="inherit" data-fixture={`field-${lang}`}>
				<label class="label-reading" for={`email-${lang}`}>{copy.field}</label>
				<input id={`email-${lang}`} type="email" autocomplete="email" class="field" aria-describedby={`hint-${lang}`} />
				<p id={`hint-${lang}`} class="hint">{copy.hint}</p>
			</Card>
			<Card class="p-4" edge="neutral" data-fixture={`metric-${lang}`}>
				<p class="label-reading">{copy.label}</p>
				<p class="value">{copy.value}</p>
			</Card>
		</div>
	{/each}

	<h2 id="sections" class="text-heading font-heading font-bold">Section cards</h2>
	<div class="stack">
		<div data-fixture="section-default">
			<CollapsibleSection title="Default section card" anchor="section-default">
				<p>Brand edge at 3px. The hovered heading turns orange, the clickable hue.</p>
			</CollapsibleSection>
		</div>
		{#each LANGS as lang (lang)}
			{@const copy = SURFACE_COPY[lang]}
			<div {lang} data-fixture={`section-neutral-${lang}`}>
				<CollapsibleSection
					title={copy.section}
					anchor={`section-${lang}`}
					edge="neutral"
					edgeWeight="thin"
					textSize="inherit"
				>
					{#snippet summary()}<p>{copy.summary}</p>{/snippet}
					<p>{copy.hint}</p>
				</CollapsibleSection>
			</div>
		{/each}
		<div data-fixture="section-regular">
			<CollapsibleSection title="Regular weight, brand edge" anchor="section-regular" edgeWeight="regular">
				<p>A 2px edge for denser pages.</p>
			</CollapsibleSection>
		</div>
	</div>

	<h2 id="labels" class="text-heading font-heading font-bold">Reading labels and signage</h2>
	<div class="grid">
		<div data-fixture="label-reading">
			<p class="label-reading">Observation period</p>
			<p>November 4 to 10, 2026</p>
		</div>
		<div data-fixture="label-station">
			<p class="label-station">Line 51</p>
			<p>Signage: a route plate keeps the mono uppercase role.</p>
		</div>
		<div data-fixture="overline">
			<SectionHeading overline="Platform B" level={3} />
			<p>An overline is signage only: a board or platform name, never a label above a heading.</p>
		</div>
	</div>

	<div class="grid">
		<div data-fixture="toc-default">
			<TocNav heading="With counter" entries={toc} activeId="cards" collapsible={false} />
		</div>
		<div data-fixture="toc-no-counter">
			<TocNav heading="Without counter" entries={toc} activeId="cards" counter={false} collapsible={false} />
		</div>
	</div>

	<h2 id="titles" class="text-heading font-heading font-bold">Screen titles</h2>
	<p>The compact title size for task and reading screens, with and without the dot.</p>
	<div class="stack">
		<div data-fixture="title-dot">
			<SectionHeading size="title" level={3} heading="Check your details before you continue" />
		</div>
		<div data-fixture="title-undotted">
			<SectionHeading size="title" level={3} dot={false} heading="Account settings" />
		</div>
		<div data-fixture="title-sub">
			<SectionHeading size="title" level={3} heading="Weekly summary" subheading="Figures from the last seven days" />
		</div>
	</div>
</div>

<style>
	.reading-surfaces {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-wrap: anywhere;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: 1rem;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.card-link {
		display: block;
		color: inherit;
		text-decoration: none;
	}
	.field {
		display: block;
		width: 100%;
		min-height: 44px;
		margin-block: 0.5rem;
		padding-inline: 0.75rem;
		border: 1px solid var(--input);
		border-radius: var(--radius-md);
		background: var(--background);
		color: var(--foreground);
	}
	.hint {
		color: var(--muted-foreground);
	}
	.value {
		font-size: var(--text-body);
		font-variant-numeric: tabular-nums;
	}
</style>
