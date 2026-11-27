<script lang="ts">
	import { AppFrame, type SurfaceRailContext } from '@yesid/ui/layout';

	let mobileVisible = $state(true);
</script>

<svelte:head><title>Rail motion on a long report</title></svelte:head>

{#snippet rail({ closeSheet, presentation }: SurfaceRailContext)}
	<p>Presentation: {presentation}</p>
	<label>Report name <input type="text" /></label>
	{#each Array.from({ length: 18 }, (_, index) => index + 1) as day (day)}
		<label class="min-h-11"><input type="checkbox" /> Day {day}</label>
	{/each}
	<button class="min-h-11" onclick={closeSheet}>Apply controls</button>
	<button class="min-h-11" onclick={() => (mobileVisible = false)}>Hide controls</button>
	<a class="inline-flex min-h-11 items-center" href="#last-section">Go to last section</a>
{/snippet}

<AppFrame mainLabel="Service report" controlsRail={{
	rail, label: 'Controls', openAria: 'Open controls', closeAria: 'Close controls', mobileVisible
}}>
	{#snippet header()}<a class="inline-flex min-h-11 items-center px-4" href="/">Gallery home</a>{/snippet}
	<h1 class="text-title">Service report</h1>
	<button class="min-h-11" onclick={() => (mobileVisible = true)}>Show controls</button>
	{#each Array.from({ length: 20 }, (_, index) => index + 1) as section (section)}
		<section class="min-h-[464px] border-t border-border p-4" id={section === 20 ? 'last-section' : undefined}>
			<h2>Reporting period {section}</h2>
			<p>Scheduled services and reported arrivals</p>
			<table class="w-full">
				<thead><tr><th scope="col">Day</th><th scope="col">Scheduled</th><th scope="col">Reported</th></tr></thead>
				<tbody>
					{#each Array.from({ length: 12 }, (_, index) => index + 1) as row (row)}
						<tr><th scope="row">{row}</th><td>{100 + row}</td><td>{99 + row}</td></tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/each}
</AppFrame>
