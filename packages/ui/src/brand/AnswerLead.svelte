<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface AnswerLeadProps {
		value: string | null;
		sentence: string;
		absent?: Snippet;
		stamp?: Snippet;
		meta?: Snippet;
		comparison?: string;
		actions?: Snippet;
		size?: 'md' | 'lg';
		/** `fit` sets the figure beside the sentence whenever both fit, at any width. */
		layout?: 'threshold' | 'fit';
	}
</script>

<script lang="ts">
	import MetricValue from './MetricValue.svelte';

	let {
		value, sentence, absent, stamp, meta, comparison, actions, size = 'lg', layout = 'threshold',
	}: AnswerLeadProps = $props();
	const sentenceId = $props.id();
	const figureId = `${sentenceId}-figure`;
	// The section reads its statement in order: the figure, or what stands in for it, then the sentence.
	const labelledBy = $derived(value !== null || absent ? `${figureId} ${sentenceId}` : sentenceId);
</script>

<section
	class="answer-lead"
	data-slot="answer-lead"
	data-layout={layout === 'fit' ? 'fit' : undefined}
	aria-labelledby={labelledBy}
>
	<div class="answer-layout">
		<div class="answer-context">
			<div class="answer-statement">
				{#if value !== null}
					<p class="answer-value" class:answer-value-lg={size === 'lg'} id={figureId}>
						<span class="answer-fit">
							<span class="answer-figure"><MetricValue {value} {size} /></span>
							<span class="answer-measure font-heading font-extrabold leading-none tabular-nums"
								data-value={value}></span>
						</span>
					</p>
				{:else if absent}
					<div class="answer-absent" id={figureId}>{@render absent()}</div>
				{/if}
				<p class="answer-sentence" id={sentenceId}>{sentence}</p>
			</div>
			{#if stamp}<div>{@render stamp()}</div>{/if}
			{#if comparison}<p>{comparison}</p>{/if}
			{#if meta}<div class="answer-meta">{@render meta()}</div>{/if}
		</div>
		{#if actions}<div class="answer-actions">{@render actions()}</div>{/if}
	</div>
</section>

<style>
	/* Capture the two container widths before calculating their ratio.
	   https://kizu.dev/fit-to-width/ */
	@property --yesid-answer-available {
		syntax: "<length>";
		initial-value: 0px;
		inherits: true;
	}
	@property --yesid-answer-natural {
		syntax: "<length> | clip";
		initial-value: clip;
		inherits: false;
	}
	.answer-lead {
		container: answer-lead / inline-size;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.answer-layout, .answer-context, .answer-statement {
		display: grid;
		gap: 0.75rem;
		min-inline-size: 0;
	}
	p { margin: 0; }
	.answer-value {
		--answer-value-size: var(--text-heading);
		min-inline-size: 0;
		overflow-x: auto;
		white-space: nowrap;
	}
	.answer-value-lg { --answer-value-size: clamp(2.25rem, var(--text-display), 2.875rem); }
	.answer-figure > :global(.metric-value) {
		font-size: var(--answer-value-size);
	}
	.answer-measure { display: none; }

	@supports (container-type: inline-size) and (zoom: tan(atan2(1px, 1px))) {
		.answer-statement {
			container-type: inline-size;
			/* Without @property, keep the scale capped at its normal size. */
			--yesid-answer-available: initial;
			--answer-fit-fallback: var(--yesid-answer-available, 1000000px);
		}
		.answer-value {
			--yesid-answer-available: 100cqi;
			/* Keep the full figure scrollable if typed properties are unavailable. */
			overflow-x: var(--yesid-answer-natural, auto);
		}
		.answer-fit {
			display: grid;
			grid-template-columns: max-content;
			/* The measurement track can be wider than the visible figure. */
			overflow-x: var(--yesid-answer-natural, visible);
		}
		.answer-figure, .answer-measure { grid-area: 1 / 1; }
		.answer-figure { container-type: inline-size; }
		/* The hidden copy sizes the grid track to the normal figure width. Its
		   sibling exposes that width in cqi without contributing to the track. */
		.answer-measure {
			display: block;
			block-size: 0;
			font-size: var(--answer-value-size);
			visibility: hidden;
			user-select: none;
		}
		.answer-measure::before { content: attr(data-value); }
		.answer-figure > :global(.metric-value) {
			--yesid-answer-natural: 100cqi;
			/* Scale the whole inline box so inherited letter and word spacing fit too. */
			zoom: clamp(0.001, tan(atan2(
				var(--yesid-answer-available) + var(--answer-fit-fallback),
				max(1px, var(--yesid-answer-natural))
			)), 1);
		}
	}
	.answer-sentence { font-size: var(--text-body); }
	.answer-meta {
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}
	.answer-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: start;
		gap: 0.5rem;
		min-inline-size: 0;
	}
	@media (min-width: 40em) {
		/* A 13rem figure, a 1rem gap and at least 12rem for the sentence. */
		@container answer-lead (min-width: 26rem) {
			.answer-statement { display: flex; align-items: baseline; gap: 1rem; }
			.answer-value, .answer-absent {
				flex: none;
				min-inline-size: 0;
				max-inline-size: min(55%, calc(100% - 13rem));
			}
			.answer-sentence { flex: 1 1 12rem; min-inline-size: 12rem; }
			.answer-lead:not([data-layout='fit']) .answer-value {
				--yesid-answer-available: min(55cqi, calc(100cqi - 13rem));
			}
		}
	}
	/* The sentence wraps below once it no longer has 12rem beside the figure.
	   The figure stays whole and scales down only when it exceeds its available width. */
	.answer-lead[data-layout='fit'] .answer-statement {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.75rem 1rem;
	}
	.answer-lead[data-layout='fit'] :is(.answer-value, .answer-absent) {
		flex: 0 1 auto;
		min-inline-size: 0;
		max-inline-size: 100%;
	}
	.answer-lead[data-layout='fit'] .answer-absent { overflow-wrap: break-word; }
	.answer-lead[data-layout='fit'] .answer-sentence {
		flex: 1 1 12rem;
		min-inline-size: 0;
	}
	@media (min-width: 64em) {
		@container answer-lead (min-width: 56rem) {
			.answer-layout { grid-template-columns: minmax(0, 1fr) fit-content(35%); gap: 1.5rem; }
			.answer-actions { justify-content: end; }
		}
	}
</style>
