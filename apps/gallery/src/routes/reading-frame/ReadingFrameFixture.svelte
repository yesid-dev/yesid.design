<script lang="ts">
	import { ReadingFrame } from '@yesid/ui/layout';
	import { FRAME_COPY, FRAME_SECTION_KEYS, LANGS, type Lang } from '../reading-surfaces/fixture';

	let { lang: current }: { lang: Lang } = $props();
	let drawn = $state(false);
	const copy = $derived(FRAME_COPY[current]);
	const sections = $derived(FRAME_SECTION_KEYS.map((id) => ({ id, title: copy.sections[id].title })));
</script>

<div lang={current} data-ripple-exempt>
	<nav aria-label="Fixture languages" class="langs">
		{#each LANGS as lang (lang)}
			<a href={`/reading-frame/${lang}`} aria-current={lang === current ? 'page' : undefined}>{lang.toUpperCase()}</a>
		{/each}
	</nav>
	<button type="button" onclick={() => drawn = !drawn} aria-pressed={drawn}>Hand-drawn contents boundaries</button>
	<ReadingFrame
		title={copy.title}
		updated={{ datetime: '2026-11-02', label: copy.updatedLabel, text: copy.updatedText }}
		{sections}
		contentsLabel={copy.contents}
		contentsRule={drawn ? 'hand-drawn' : 'line'}
		data-fixture="reading-frame"
	>
		{#snippet summary()}<p>{copy.summary}</p>{/snippet}
		{#each FRAME_SECTION_KEYS as id (id)}
			<section aria-labelledby={id}>
				<h2 {id}>{copy.sections[id].title}</h2>
				<p>{copy.sections[id].body}</p>
				<p>{copy.sections[id].body}</p>
			</section>
		{/each}
	</ReadingFrame>
</div>

<style>
	.langs {
		display: flex;
		gap: 1rem;
	}
	.langs a {
		display: inline-flex;
		min-block-size: var(--size-tap-min, 44px);
		min-inline-size: var(--size-tap-min, 44px);
		align-items: center;
		justify-content: center;
	}
</style>
