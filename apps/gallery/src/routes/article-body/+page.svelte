<script lang="ts">
	import { CollapsibleSection, HeadingPermalink } from '@yesid/ui/brand';

	const en = 'Link to this section';
	const fr = 'Lien vers cette section';
	const sections = [
		{ anchor: 'method', title: 'Method', headerVariant: 'default', collapsible: true },
		{ anchor: 'results', title: 'Results over the complete observation period', headerVariant: 'article-summary', collapsible: true },
		{ anchor: 'sources', title: 'Sources', headerVariant: 'default', collapsible: false },
	] as const;
</script>

<svelte:head><title>Article body</title></svelte:head>

<h1 class="font-heading text-title font-bold">Article body</h1>
<p class="mt-2 text-muted-foreground">Reading roles for long prose, with a permalink on each heading.</p>

{#snippet heading(level: 'h2' | 'h3' | 'h4', id: string, text: string, label: string)}
	<!-- The text span names the heading, so the permalink stays out of the heading's own name. -->
	<svelte:element this={level} {id} aria-labelledby={`${id}-text`}>
		<span id={`${id}-text`}>{text}</span><HeadingPermalink target={id} {label} />
	</svelte:element>
{/snippet}

<div class="reading-detail mt-8">
	<article class="article-body" data-testid="article-body">
		{@render heading('h2', 'safety', 'Safety first', en)}
		<p>Check the platform before boarding. Run <code>bun run check</code> before a release, and read the <a href="#hours">opening hours</a>.</p>
		{@render heading('h3', 'hours', 'Opening hours', en)}
		<ul>
			<li>Weekdays from 06:00 to 22:00.</li>
			<li>Weekends from 08:00 to 20:00.</li>
		</ul>
		<ol>
			<li>Choose a station.</li>
			<li>Read the notices.</li>
		</ol>
		{@render heading('h4', 'service', 'Service levels', en)}
		<table>
			<thead><tr><th scope="col">Line</th><th scope="col">Every</th></tr></thead>
			<tbody>
				<tr><th scope="row">Green</th><td>6 minutes</td></tr>
				<tr><th scope="row">Orange</th><td>8 minutes</td></tr>
			</tbody>
		</table>
		<!-- A scrolling block takes keyboard focus so it can be scrolled without a pointer. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre tabindex="0"><code>select line, headway from timetable where service_day = current_date order by line;</code></pre>
		<blockquote><p>A missing observation is reported as missing, never as on time.</p></blockquote>
		<hr />
		<div lang="fr">
			{@render heading('h2', 'acces', 'Accès aux stations', fr)}
			<p>Les ascenseurs sont indiqués sur chaque quai.</p>
		</div>
	</article>
	<aside class="reading-support mt-8" aria-label="Related notes">
		<p>Supporting notes read one step smaller.</p>
	</aside>
</div>

<div class="mt-12 space-y-4">
	{#each sections as { anchor, title, headerVariant, collapsible } (anchor)}
		<CollapsibleSection
			{title}
			{anchor}
			{headerVariant}
			{collapsible}
			subtitle={headerVariant === 'article-summary' ? 'Completed week' : undefined}
			permalink
			permalinkLabel={en}
		>
			<p>Detail for this section.</p>
		</CollapsibleSection>
	{/each}
	<CollapsibleSection title="Method without a permalink" anchor="method-plain">
		<p>Detail for this section.</p>
	</CollapsibleSection>
</div>
