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

	let figureBox = $state<HTMLParagraphElement>();
	let measure = $state<HTMLSpanElement>();

	$effect(() => {
		if (!figureBox || !measure || typeof ResizeObserver === 'undefined') return;
		const box = figureBox;
		const natural = measure;
		const observer = new ResizeObserver(() => {
			const available = box.getBoundingClientRect().width;
			const width = natural.getBoundingClientRect().width;
			if (available > 0.5 && width > available) {
				const fontSize = Number.parseFloat(getComputedStyle(natural).fontSize);
				box.style.setProperty('--answer-value-fit', `${fontSize * (available - 0.5) / width}px`);
			} else {
				box.style.removeProperty('--answer-value-fit');
			}
		});
		observer.observe(box);
		observer.observe(natural);
		return () => observer.disconnect();
	});
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
					<p class="answer-value" class:answer-value-lg={size === 'lg'} id={figureId} bind:this={figureBox}>
						<MetricValue {value} {size} />
						<span class="answer-measure">
							<span class="answer-measure-width font-heading font-extrabold leading-none tabular-nums"
								data-value={value} bind:this={measure}></span>
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
	.answer-value {
		--answer-value-size: var(--text-heading);
		min-inline-size: 0;
		white-space: nowrap;
	}
	.answer-value-lg { --answer-value-size: clamp(2.25rem, var(--text-display), 2.875rem); }
	.answer-value > :global(.metric-value) {
		font-size: var(--answer-value-fit, var(--answer-value-size));
	}
	/* The unscaled copy keeps the figure's intrinsic width stable in both layouts
	   and lets the observer react to font loads and text changes. */
	.answer-measure {
		display: block;
		block-size: 0;
		overflow: clip;
		visibility: hidden;
	}
	.answer-measure-width {
		display: block;
		inline-size: max-content;
		font-size: var(--answer-value-size);
	}
	.answer-measure-width::before { content: attr(data-value); }
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
		@container (min-width: 56rem) {
			.answer-layout { grid-template-columns: minmax(0, 1fr) fit-content(35%); gap: 1.5rem; }
			.answer-actions { justify-content: end; }
		}
	}
</style>
