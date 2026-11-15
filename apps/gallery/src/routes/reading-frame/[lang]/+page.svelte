<script lang="ts">
	import { ReadingFrame } from '@yesid/ui/layout';
	import { FRAME_COPY, FRAME_SECTION_KEYS, LANGS } from '../../reading-surfaces/fixture';

	let { data } = $props();
	const copy = $derived(FRAME_COPY[data.lang]);
	const sections = $derived(FRAME_SECTION_KEYS.map((id) => ({ id, title: copy.sections[id].title })));
</script>

<svelte:head><title>Reading frame ({data.lang})</title></svelte:head>

<div lang={data.lang} data-ripple-exempt>
	<nav aria-label="Fixture languages" class="langs">
		{#each LANGS as lang (lang)}
			<a href={`/reading-frame/${lang}`} aria-current={lang === data.lang ? 'page' : undefined}>{lang.toUpperCase()}</a>
		{/each}
	</nav>
	<ReadingFrame
		title={copy.title}
		updated={{ datetime: '2026-11-02', label: copy.updatedLabel, text: copy.updatedText }}
		{sections}
		contentsLabel={copy.contents}
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
		min-height: 44px;
		align-items: center;
	}
</style>
