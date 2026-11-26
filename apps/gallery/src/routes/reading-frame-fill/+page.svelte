<script lang="ts">
	import { ReadingFrame } from '@yesid/ui/layout';
	import { FRAME_COPY, FRAME_SECTION_KEYS } from '../reading-surfaces/fixture';

	// Fill cases for reading-frame-fill.spec.ts: the frame in normal block flow, and in parents that
	// size their children to content (a centred flex column, a grid with centred items), each with
	// the default gutter and with `--reading-gutter: 0`.
	const copy = FRAME_COPY.en;
	const cases = [
		{ id: 'block', layout: 'block', flush: false, label: 'block flow, default gutter' },
		{ id: 'block-flush', layout: 'block', flush: true, label: 'block flow, no gutter' },
		{ id: 'flex', layout: 'flex', flush: false, label: 'centred flex column, default gutter' },
		{ id: 'flex-flush', layout: 'flex', flush: true, label: 'centred flex column, no gutter' },
		{ id: 'grid', layout: 'grid', flush: false, label: 'grid with centred items, default gutter' },
		{ id: 'grid-flush', layout: 'grid', flush: true, label: 'grid with centred items, no gutter' },
	] as const;
</script>

<svelte:head><title>Reading frame fill</title></svelte:head>

<div lang="en" data-ripple-exempt>
	{#each cases as item (item.id)}
		<div class={`case case--${item.layout}`} class:case--flush={item.flush} data-case={item.id}>
			<ReadingFrame
				title={`${copy.title} (${item.label})`}
				sections={FRAME_SECTION_KEYS.map((key) => ({ id: `${item.id}-${key}`, title: copy.sections[key].title }))}
				contentsLabel={copy.contents}
			>
				{#snippet summary()}<p>{copy.summary}</p>{/snippet}
				{#each FRAME_SECTION_KEYS as key (key)}
					<section aria-labelledby={`${item.id}-${key}`}>
						<h2 id={`${item.id}-${key}`}>{copy.sections[key].title}</h2>
						<p>{copy.sections[key].body}</p>
					</section>
				{/each}
			</ReadingFrame>
		</div>
	{/each}
</div>

<style>
	.case {
		outline: 1px dashed var(--border);
	}
	.case + .case {
		margin-block-start: 2rem;
	}
	.case--flex {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.case--grid {
		display: grid;
		justify-items: center;
	}
	.case--flush {
		--reading-gutter: 0;
	}
</style>
