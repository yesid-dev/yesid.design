<script lang="ts">
	import { ConstructionFloodlight, ConstructionGround, Wordmark } from '@yesid/ui/brand';
	import { SiteFooter } from '@yesid/ui/layout';
	import { theme } from '@yesid/ui/state';
	import { COPY, type Lang } from './copy';

	let { lang = 'en' }: { lang?: Lang } = $props();
	const c = $derived(COPY[lang]);
</script>

<div class="ground-page" {lang} data-testid="construction-ground-page">
	<header class="ground-header">
		<p class="font-heading text-heading font-bold">
			yesid<span class="text-primary">.</span>dev-design
		</p>
		<button
			type="button"
			class="tap-press min-h-11 rounded-md border border-border px-3 py-1 text-small text-muted-foreground hover:text-foreground"
			onclick={() => theme.toggle()}
		>
			{c.toggleTheme}
		</button>
	</header>

	<main id="main" class="ground-main">
		<section class="intro-block">
			<h1>{c.title}</h1>
			<p>{c.intro}</p>
		</section>

		{#each c.sections as section (section.id)}
			<section id={section.id} class="content-card">
				<h2>{section.heading}</h2>
				<p>{section.body}</p>
			</section>
		{/each}
	</main>

	<div class="ground-wrapper" data-testid="construction-ground-host">
		<ConstructionGround layout="spread" lighting>
			{#snippet fixtures()}
				<!-- The beam stands far above the ground; both pieces move from --ground-progress alone. -->
				<div class="stationary-fixture" data-testid="ground-stationary-fixture">
					<span class="beam" data-testid="ground-beam" aria-hidden="true"></span>
					<span class="lamp" data-testid="ground-lamp"><ConstructionFloodlight lit /></span>
				</div>
			{/snippet}
		</ConstructionGround>
	</div>

	<SiteFooter
		edge="hazard"
		tagline={c.footer.tagline}
		groups={c.footer.groups}
	>
		{#snippet brand()}
			<Wordmark href="#corridor-summary" animate={false} />
		{/snippet}
		{#snippet statusStart()}
			<span>{c.footer.statusStart}</span>
		{/snippet}
	</SiteFooter>
</div>

<style>
	.ground-page {
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
	}

	.ground-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--background);
		padding: 0.75rem var(--space-page-x);
	}

	.ground-main {
		display: grid;
		gap: 1.5rem;
		width: 100%;
		max-width: 60rem;
		margin-inline: auto;
		padding: 2rem var(--space-page-x) 2.5rem;
	}

	.intro-block {
		display: grid;
		gap: 0.75rem;
	}

	.intro-block h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: var(--text-title);
		font-weight: 700;
		line-height: 1.15;
	}

	.intro-block p {
		margin: 0;
		max-width: 46rem;
		color: var(--muted-foreground);
		font-size: var(--text-body);
		line-height: 1.6;
	}

	.content-card {
		display: grid;
		align-content: start;
		gap: 0.75rem;
		min-block-size: 20rem;
		padding: var(--space-card-gap);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-2);
	}

	.content-card h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: var(--text-card-title);
		font-weight: 700;
	}

	.content-card p {
		margin: 0;
		max-width: 46rem;
		color: var(--muted-foreground);
		font-size: var(--text-body);
		line-height: 1.6;
	}

	.ground-wrapper {
		--construction-ground-height: 240px;
		--construction-end-inset: clamp(6rem, 12vw, 9rem);
		/* The beam's top above the ground line; what stands above the ground is reserved. */
		--beam-top: 364px;
		--construction-ground-headroom: calc(var(--beam-top) - var(--construction-ground-height));
		padding-block-start: var(--construction-ground-headroom);
		width: 100%;
	}

	.stationary-fixture {
		--lamp-width: 64px;
		position: absolute;
		bottom: 0;
		inset-inline-end: clamp(1rem, 4vw, 3rem);
		width: var(--lamp-width);
		line-height: 0;
		pointer-events: none;
	}

	/* The lamp rises over the first fifth of the reveal. */
	.lamp {
		display: block;
		translate: 0 calc((1 - clamp(0, var(--ground-progress) / 0.2, 1)) * 100%);
	}

	/* A cone from the lens (the lamp is 52 units tall in a 64-unit box), on from 10% to 30%. */
	.beam {
		position: absolute;
		inset-block-end: calc(var(--lamp-width) * 52 / 64 - 2px);
		inset-inline-end: 0;
		inline-size: min(20rem, 70vw);
		block-size: calc(var(--beam-top) - var(--lamp-width) * 52 / 64 + 2px);
		background: linear-gradient(
			to top,
			color-mix(in srgb, var(--accent) 55%, transparent),
			color-mix(in srgb, var(--accent) 14%, transparent)
		);
		clip-path: polygon(0 0, 100% 0, calc(100% - var(--lamp-width) * 0.3) 100%, calc(100% - var(--lamp-width) * 0.7) 100%);
		opacity: clamp(0, (var(--ground-progress) - 0.1) / 0.2, 1);
	}

	@media (min-width: 1280px) {
		.ground-wrapper {
			--beam-top: 430px;
		}
	}

	@media (max-width: 767px) {
		.ground-wrapper {
			--construction-ground-height: 100px;
			--construction-end-inset: 4.25rem;
			--beam-top: 330px;
		}
		.stationary-fixture {
			--lamp-width: 40px;
		}
	}
</style>
