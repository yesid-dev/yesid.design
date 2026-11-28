<script lang="ts">
	import { createRawSnippet } from 'svelte';
	import ArticleHeader from '../ArticleHeader.svelte';
	import DetailFrame from '../DetailFrame.svelte';
	import ErrorPage from '../ErrorPage.svelte';
	import Masthead from '../Masthead.svelte';
	import PageSection from '../PageSection.svelte';
	import PageSections from '../PageSections.svelte';
	import type { PageBoundaryStroke, PageDivider } from '../page-sections.js';

	let { mode, divider, stroke }: {
		mode: 'wrapped' | 'masthead' | 'late' | 'frames' | 'editorial' | 'outside';
		divider?: PageDivider;
		stroke?: PageBoundaryStroke;
	} = $props();
	let showLead = $state(false);
	const body = createRawSnippet(() => ({ render: () => '<p>Body</p>' }));
	const header = createRawSnippet(() => ({ render: () => '<h1>Header</h1>' }));
</script>

{#if mode === 'wrapped'}
	<!-- The last page section is wrapped twice; a plain and a nested section never register. -->
	<PageSections data-testid="sections" {divider}>
		<PageSection id="a" aria-label="A">
			<p>A</p>
			<section id="plain" aria-label="Plain"><p>Decorative</p></section>
		</PageSection>
		<div class="wrap">
			<PageSection id="b" aria-label="B">
				<PageSection id="nested" aria-label="Nested"><p>Nested</p></PageSection>
			</PageSection>
		</div>
		<div><div><PageSection id="c" aria-label="C"><p>C</p></PageSection></div></div>
	</PageSections>
	<footer id="footer">Footer</footer>
{:else if mode === 'masthead'}
	<!-- Mastheads as whole sections: the boundary owns every edge, in the final section too. -->
	<PageSections>
		<PageSection id="a" aria-label="A"><Masthead heading="First" tape="dimension" /></PageSection>
		<PageSection id="b" aria-label="B"><Masthead heading="Second" /></PageSection>
		<div><PageSection id="c" aria-label="C"><Masthead heading="Last" tape="dimension" /></PageSection></div>
	</PageSections>
	<footer id="footer">Footer</footer>
	<div id="outside"><Masthead heading="Outside" tape="dimension" /></div>
{:else if mode === 'late'}
	<button type="button" onclick={() => (showLead = !showLead)}>Toggle lead</button>
	<PageSections {divider}>
		{#if showLead}
			<PageSection id="lead" aria-label="Lead"><p>Lead</p></PageSection>
		{/if}
		<PageSection id="a" aria-label="A"><p>A</p></PageSection>
		<PageSection id="b" aria-label="B"><p>B</p></PageSection>
	</PageSections>
{:else if mode === 'frames'}
	<PageSections>
		<PageSection id="a" aria-label="A">
			<DetailFrame rule="dimension" children={body} data-testid="headless-frame" />
		</PageSection>
		<PageSection id="b" aria-label="B">
			<DetailFrame rule="dimension" {header} children={body} data-testid="headed-frame" />
		</PageSection>
		<PageSection id="c" aria-label="C">
			<ErrorPage status={404} heading="Missing" body="Gone." tape="dimension" />
		</PageSection>
	</PageSections>
{:else if mode === 'editorial'}
	<PageSections divider="hand-drawn" {stroke}>
		<PageSection id="a">
			<ArticleHeader title="Field notes" backHref="/" backLabel="Back" presentation="reading" />
			<p>Article text</p>
		</PageSection>
		<PageSection id="b"><p>References</p></PageSection>
		<PageSection id="c"><p>Related stories</p></PageSection>
	</PageSections>
	<footer id="footer">Footer</footer>
{:else}
	<PageSection id="alone" aria-label="Alone"><Masthead heading="Alone" tape="dimension" /></PageSection>
{/if}
