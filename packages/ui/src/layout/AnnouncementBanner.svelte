<script lang="ts" module>
	export interface AnnouncementBannerProps {
		/** Stable across translations and pages. Change it when publishing a new message. */
		id: string;
		message: string;
		href: string;
		/** Localized accessible name of the dismissal button. */
		closeLabel: string;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import X from '@lucide/svelte/icons/x';
	import { ANNOUNCEMENT_STORAGE_PREFIX } from '../head/announcement-boot.js';

	let { id, message, href, closeLabel }: AnnouncementBannerProps = $props();
	const labelId = $props.id();
	let ready = $state(false);
	let dismissedId = $state<string>();

	const dismissed = $derived(ready && (dismissedId === id || wasDismissed(id)));
	onMount(() => { ready = true; });

	function wasDismissed(id: string): boolean {
		if (document.documentElement.dataset.announcementDismissed === id) return true;
		try {
			return localStorage.getItem(ANNOUNCEMENT_STORAGE_PREFIX + id) === 'dismissed';
		} catch {
			return false;
		}
	}

	function dismiss() {
		try {
			localStorage.setItem(ANNOUNCEMENT_STORAGE_PREFIX + id, 'dismissed');
			dismissedId = id;
		} catch {
			// Keep the banner visible when the browser will not store its dismissal.
		}
	}
</script>

<section
	class="announcement-banner"
	data-slot="announcement-banner"
	data-announcement-ready={ready ? '' : undefined}
	aria-labelledby={labelId}
	hidden={dismissed}
>
	<a id={labelId} {href}>{message} <ArrowRight class="announcement-arrow" aria-hidden="true" /></a>
	<button type="button" aria-label={closeLabel} disabled={!ready} onclick={dismiss}>
		<X class="announcement-close-icon" aria-hidden="true" />
	</button>
</section>

<style>
	.announcement-banner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5em;
		padding-inline: var(--space-page-x);
		background: var(--muted);
		color: var(--foreground);
		font: var(--text-small) / 1.5 var(--font-body);
	}

	/* One announcement per document. The head script sets this before the SSR bar can paint. */
	:global(html[data-announcement-dismissed]) .announcement-banner:not([data-announcement-ready]),
	.announcement-banner[hidden] {
		display: none;
	}

	a {
		box-sizing: border-box;
		min-block-size: var(--size-tap-min);
		align-content: center;
		padding-block: 0.25em;
		color: var(--foreground);
		text-decoration: underline;
		text-underline-offset: 0.2em;
		overflow-wrap: anywhere;
	}

	button {
		display: grid;
		place-items: center;
		min-inline-size: var(--size-tap-min);
		min-block-size: var(--size-tap-min);
		border: 0;
		border-radius: var(--radius-sm);
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	button:disabled {
		visibility: hidden;
	}

	a:focus-visible, button:focus-visible {
		outline-offset: -2px;
	}

	a:hover, button:hover {
		color: var(--primary);
	}

	a :global(.announcement-arrow), button :global(.announcement-close-icon) {
		display: inline-block;
		inline-size: 1em;
		block-size: 1em;
		vertical-align: middle;
	}
</style>
