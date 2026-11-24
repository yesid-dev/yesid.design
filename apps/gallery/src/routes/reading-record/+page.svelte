<script lang="ts">
 import { MetricDisplay, SearchInput, SegmentedChoice, FilterGroup } from '@yesid/ui/brand';
 import { records } from './copy';
 let language = $state<keyof typeof records>('en');
 const c = $derived(records[language]);
 let window = $state('week');
 let direction = $state<string | null>(null);
 let search = $state('');
 let searchRef = $state<HTMLInputElement | null>(null);
 let confirming = $state<number | null>(null);
 let removed = $state<number[]>([]);
 const stops = ['Bonaventure', 'Peel', 'Guy-Concordia'];
 const matches = $derived(stops.filter(stop => stop.toLowerCase().includes(search.toLowerCase())));
</script>
<svelte:head><title>Gallery: public-data reading record</title></svelte:head>
<article data-register="reading" lang={language}>
 <label>Fixture language <select bind:value={language}><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option></select></label>
 <h1>{c.title}</h1><p>{c.demo}</p>
 <section aria-label={c.window} data-register="task">
  <SearchInput label={c.search} placeholder={c.search} description={c.description} visibleLabel textSize="body" bind:value={search} bind:ref={searchRef} type="search" />
  <SegmentedChoice label={c.window} value={window} onSelect={key => window = key} variant="fit-row" options={[{key:'day',label:c.day},{key:'week',label:c.week},{key:'month',label:c.month}]} />
  <SegmentedChoice label="View" value="record" variant="fit-row" onSelect={() => {}} options={[
   { key: 'live', label: 'Live now', disabled: true },
   { key: 'record', label: 'Record', disabled: true },
  ]} />
  <FilterGroup label={c.filter} allLabel={c.all} activeKey={direction} selectedStyle="consistent" items={[{key:'east',label:c.east},{key:'west',label:c.west}]} onSelect={key => direction = key} />
  <ul aria-label={c.search}>{#each matches as stop}<li>{stop}</li>{/each}</ul>
 </section>
 <section aria-label={c.metric}>
  <MetricDisplay value="84" label={c.metric} tone="reading" labelRole="reading" layout="phone-row" sublabel={c.period}>
   {#snippet info()}<a class="inline-flex min-h-[var(--size-tap-min)] items-center underline" href="#evidence">{c.evidence}</a>{/snippet}
  </MetricDisplay>
  <MetricDisplay value={null} label={c.scheduled} tone="reading" layout="phone-row">
   {#snippet absent()}<span>{c.absent}</span>{/snippet}
  </MetricDisplay>
  <p id="evidence">{c.source}</p>
 </section>
 <section><h2>{c.comparison}</h2>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard scrolling for the scoped comparison) -->
  <div class="table-scroll" role="region" aria-label={c.comparison} tabindex="0" data-ripple-exempt>
   <table><caption>{c.period}</caption><thead><tr><th scope="col">{c.direction}</th><th scope="col">{c.completed}</th><th scope="col">{c.scheduled}</th></tr></thead>
    <tbody><tr><th scope="row">{c.east}</th><td>42</td><td>45</td></tr><tr><th scope="row">{c.west}</th><td>42</td><td>45</td></tr></tbody>
   </table>
  </div>
 </section>
 <section><h2>{c.facts}</h2><dl><dt>{c.coverage}</dt><dd>{c.coverageValue}</dd><dt>{c.limitation}</dt><dd>{c.limitationValue}</dd></dl></section>
 <section><h2>{c.members}</h2>
  <ul class="members">{#each Array.from({length:25}, (_,i) => i+1) as person (person)}
   <li data-member={person}><strong>{c.member} {person}</strong><span>{c.role}: {c.editor}</span><span>{c.state}: {removed.includes(person) ? c.removed : c.active}</span>
    {#if confirming === person}<div role="group" aria-label={c.confirm}><p>{c.confirm}</p><button onclick={() => {removed = [...removed, person]; confirming = null;}}>{c.yes}</button><button onclick={() => confirming = null}>{c.cancel}</button></div>
    {:else if !removed.includes(person)}<button onclick={() => confirming = person}>{c.remove}</button>{/if}
   </li>
  {/each}</ul>
 </section>
</article>
<style>
 article { max-width: 72rem; margin: auto; padding: 6rem 1rem 3rem; overflow-wrap: anywhere; }
 h1 { font-size: var(--text-title); } h2 { font-size: var(--text-heading); }
 section { margin-block: 2rem; } section[ data-register='task'] { display: grid; gap: 1rem; max-width: 36rem; }
 button, select { min-height: 44px; padding: 0.5rem; border: 1px solid var(--input); border-radius: var(--radius-md); }
 button { color: var(--primary); } .table-scroll { max-width: 100%; overflow-x: auto; }
 table { border-collapse: collapse; min-width: 36rem; width: 100%; } th, td { padding: 0.75rem; border-bottom: 1px solid var(--border); text-align: start; }
 td { text-align: end; font-variant-numeric: tabular-nums; } dt { font-weight: 700; } dd { margin: 0 0 1rem; }
 .members { list-style: none; padding: 0; } .members li { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: baseline; padding-block: 1rem; border-bottom: 1px solid var(--border); } .members li > div { flex-basis: 100%; }
</style>
