<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { RailTitle } from '@yesid/ui/brand';

	// Fit cases for rail-title.spec.ts: `?offset=` sets --chrome-offset in px, `?scroller=` puts the
	// sections in an overflow container of that height, and the buttons change the props in place.
	const titles = {
		short: 'Services',
		medium: 'Réalisations sélectionnées pour le transport collectif',
		long: 'Prochain arrêt : une étude complète de la fiabilité des horaires, des correspondances et de l’accessibilité des stations du réseau montréalais',
	} as const;
	type Length = keyof typeof titles;

	let params = $state(new URLSearchParams());
	onMount(() => (params = new URLSearchParams(page.url.searchParams.toString())));
	const offset = $derived(params.get('offset'));
	const scroller = $derived(params.get('scroller'));
	let length = $state<Length>('short');
	let dot = $state(true);
	let size = $state<string | undefined>(undefined);
	const paragraph =
		'Chaque trajet commence par une question sur qui attend, et où. La réponse devient un petit outil honnête, utilisable sur le quai, sur un téléphone, dans l’une ou l’autre langue.';
</script>

<svelte:head>
	<title>yesid.design | RailTitle fit</title>
</svelte:head>

<main id="main" lang="fr" style={offset ? `--chrome-offset: ${offset}px` : undefined}>
	<div class="flex flex-wrap gap-2 p-4" role="group" aria-label="Titre de test">
		{#each Object.keys(titles) as key (key)}
			<button type="button" class="min-h-11 rounded-md border border-border px-3" data-testid="title-{key}" onclick={() => (length = key as Length)}>{key}</button>
		{/each}
		<button type="button" class="min-h-11 rounded-md border border-border px-3" data-testid="toggle-dot" onclick={() => (dot = !dot)}>dot</button>
		<button type="button" class="min-h-11 rounded-md border border-border px-3" data-testid="size-large" onclick={() => (size = '5rem')}>5rem</button>
	</div>
	<div
		data-testid="rail-scroller"
		style={scroller ? `height: ${scroller}px; overflow: auto; border: 1px solid var(--border);` : undefined}
	>
		{#key scroller}
		{#each ['fit', 'after'] as id (id)}
			<section id={id} aria-labelledby="{id}-title" data-testid="rail-section-{id}" class="py-12">
				<RailTitle heading={id === 'fit' ? titles[length] : 'Suite'} side={id === 'fit' ? 'left' : 'right'} titleId="{id}-title" dot={id === 'fit' ? dot : true} size={id === 'fit' ? size : undefined}>
					<div class="mx-auto grid max-w-3xl gap-4 px-[var(--space-page-x)]" data-testid="rail-content-{id}">
						{#each { length: 12 } as _, index (index)}
							<p class="rounded-md border border-border p-4">{paragraph}</p>
						{/each}
					</div>
				</RailTitle>
			</section>
		{/each}
		{/key}
	</div>
</main>
