<script lang="ts">
	import { page } from '$app/state';
	import { getContext } from 'svelte';
	import type { NavigationLifecycle } from '@yesid/ui/brand';
	import { AnnouncementBanner, SiteHeader } from '@yesid/ui/layout';
	import { announcementId } from '#lib/gallery/announcement.js';
	import { LABELS } from '#lib/gallery/site-header-fixture.js';

	let { children } = $props();
	const navigation = getContext<NavigationLifecycle>('gallery-navigation');
	const id = $derived(announcementId(page.route.id, page.params.id));
</script>

{#if id}
	<AnnouncementBanner
		{id}
		message={id === 'first'
			? 'See what is coming next on the project roadmap'
			: 'Explore the new project roadmap'}
		href={id === 'first' ? '/announcement-banner/second' : '/announcement-banner'}
		closeLabel="Dismiss announcement"
	/>
{/if}
<SiteHeader {navigation} home="/" links={[]} labels={LABELS} wordmarkAutoPlay={false} />
<main id="main" class="mx-auto max-w-5xl px-6 pb-10" style="padding-top: var(--nav-clearance);">
	{@render children()}
</main>
