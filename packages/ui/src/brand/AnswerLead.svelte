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
	}
</script>

<script lang="ts">
	import MetricValue from './MetricValue.svelte';

	let { value, sentence, absent, stamp, meta, comparison, actions, size = 'lg' }: AnswerLeadProps = $props();
	const sentenceId = $props.id();
</script>

<section class="answer-lead" data-slot="answer-lead" aria-labelledby={sentenceId}>
	<div class="answer-layout">
		<div class="answer-context">
			<div class="answer-statement">
				{#if value !== null}
					<p class="answer-value"><MetricValue {value} {size} /></p>
				{:else if absent}
					<div class="answer-absent">{@render absent()}</div>
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
	.answer-lead {
		container-type: inline-size;
		min-inline-size: 0;
		overflow-wrap: anywhere;
	}
	.answer-layout, .answer-context, .answer-statement {
		display: grid;
		gap: 0.75rem;
		min-inline-size: 0;
	}
	p { margin: 0; }
	.answer-value :global(.metric-value.text-title) {
		font-size: clamp(2.25rem, var(--text-display), 2.875rem);
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
		@container (min-width: 26rem) {
			.answer-statement { display: flex; align-items: baseline; gap: 1rem; }
			.answer-value, .answer-absent {
				flex: none;
				min-inline-size: 0;
				max-inline-size: min(55%, calc(100% - 13rem));
			}
			.answer-sentence { flex: 1 1 12rem; min-inline-size: 12rem; }
		}
	}
	@media (min-width: 64em) {
		@container (min-width: 56rem) {
			.answer-layout { grid-template-columns: minmax(0, 1fr) fit-content(35%); gap: 1.5rem; }
			.answer-actions { justify-content: end; }
		}
	}
</style>
