<!--
  Site footer: the street edge (D22: one dashed road marking, yellow and white dashes alternating,
  along its top edge), a brand block with tagline, one labelled navigation per link group,
  and a status row with a live lamp and today's date. `data-in-view` reports whether the footer
  is on screen, for chrome that should step aside.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface SiteFooterLink {
		href: string;
		label: string;
		ariaLabel?: string;
		/** Opens in a new tab with `rel="noopener noreferrer"`. */
		external?: boolean;
		/** Adds `rel="me"`: the page links to its owner's own profile. */
		me?: boolean;
	}

	export interface SiteFooterGroup {
		label: string;
		/** Accessible name of the group's navigation; defaults to `label`. */
		navLabel?: string;
		testId?: string;
		links: readonly SiteFooterLink[];
		/** Rendered after the links, inside the group. */
		after?: Snippet;
	}

	export type SiteFooterEdge = 'street' | 'hazard';

	export type SiteFooterProps = {
		brand: Snippet;
		tagline: string;
		groups: readonly SiteFooterGroup[];
		/** Start of the status row, such as an address or attribution. */
		statusStart?: Snippet;
		/**
		 * The decorative edge along the footer's top. `street` is the default road marking (D22);
		 * `hazard` draws the kit's hazard tape instead, for a product that opts into it. Groups,
		 * links and the status row are the same either way.
		 */
		edge?: SiteFooterEdge;
	} & (
		| {
				/** Supply both status props to render the lamp and date. */
				statusPrefix: string;
				/** Screen-reader text for the live lamp. Required with statusPrefix. */
				liveLabel: string;
			}
		| {
				/** Omit both status props to hide the lamp and date. */
				statusPrefix?: never;
				liveLabel?: never;
			}
	);
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { FooterGroup, FooterLink } from '../primitives/footer/index.js';
	import { Separator } from '../primitives/separator/index.js';
	import StatusDot from '../brand/StatusDot.svelte';

	let { brand, tagline, groups, statusStart, statusPrefix, liveLabel, edge = 'street' }: SiteFooterProps = $props();

	// Decorative only (D22). One object because Svelte's checker flags `aria-hidden` beside
	// `role="none"`, a valid ARIA pair.
	const decorativeAttributes = { role: 'none', 'aria-hidden': 'true' } as const;

	const now = new Date();
	const systemDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

	let footer: HTMLElement;
	let inView = $state(false);
	onMount(() => {
		if (typeof IntersectionObserver === 'undefined') return;
		const observer = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
		observer.observe(footer);
		return () => observer.disconnect();
	});
</script>

<footer
	bind:this={footer}
	data-in-view={inView}
	data-testid="footer"
	data-slot="footer"
	data-balanced-blocks={groups.length === 3 || groups.length === 4 ? groups.length + 1 : undefined}
	class="relative z-[var(--z-content)] bg-[var(--muted)]"
	style="--footer-groups: {groups.length};"
>
	{#if edge === 'hazard'}
		<Separator variant="hazard" hazardSize="sm" class="footer-hazard-edge" data-slot="footer-hazard-edge" />
	{:else}
		<div class="footer-street-edge" data-slot="footer-street-edge" {...decorativeAttributes}></div>
	{/if}
	<div
		class="footer-columns grid w-full gap-10 px-6 pb-8 pt-10 sm:px-10 sm:pt-12 lg:gap-8 lg:px-16 lg:pt-14"
		class:with-status={!!statusStart || statusPrefix !== undefined}
	>
		<div class="footer-brand flex flex-col items-start">
			{@render brand()}
			<span class="mt-2 font-mono text-xs text-[var(--muted-foreground)]">{tagline}</span>
		</div>
		{#each groups as group (group.label)}
			<nav aria-label={group.navLabel ?? group.label} data-testid={group.testId}>
				<FooterGroup label={group.label}>
					{#each group.links as link (link.href)}
						{#if link.external}
							<FooterLink
								href={link.href}
								target="_blank"
								rel={link.me ? 'me noopener noreferrer' : 'noopener noreferrer'}
								aria-label={link.ariaLabel}>{link.label}</FooterLink
							>
						{:else}
							<FooterLink href={link.href} aria-label={link.ariaLabel}>{link.label}</FooterLink>
						{/if}
					{/each}
					{@render group.after?.()}
				</FooterGroup>
			</nav>
		{/each}
	</div>
	{#if statusStart || statusPrefix !== undefined}
		<div
			class="footer-status-border flex w-full flex-col items-center gap-2 px-6 py-4 font-mono text-caption text-[var(--muted-foreground)] sm:flex-row sm:justify-between sm:px-10 lg:px-16"
		>
			{@render statusStart?.()}
			{#if statusPrefix !== undefined}
			<span class="flex items-center gap-1.5 text-[var(--accent-text)]">
				<StatusDot color="orange" pulse label={liveLabel} />
				{statusPrefix}
				{systemDate}
			</span>
			{/if}
		</div>
	{/if}
</footer>

<style>
	footer {
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.footer-columns {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
	}
	@media (min-width: 64rem) {
		.footer-columns {
			display: flex;
			flex-wrap: wrap;
		}
		/* Leave room for a classic scrollbar at the desktop floor. */
		.footer-brand { flex: 1.5 1 min(100%, 10.125rem); }
		.footer-columns > nav { flex: 1 1 min(100%, 6.75rem); }
		.footer-columns > :is(.footer-brand, nav) { min-inline-size: 0; }
		:global([data-slot='app-frame'][data-rail-layout='compact']) .footer-columns {
			display: grid;
		}
	}
	:global([data-slot='app-frame'][data-rail-layout='compact']) .footer-columns {
		padding-block: var(--space-card-gap);
	}
	:global([data-slot='app-frame'][data-rail-layout='compact']) .footer-columns.with-status {
		padding-block-end: calc(var(--space-card-gap) / 2);
	}
	@media (min-width: 1024px) {
		/* Large text can put the footer into rows on desktop. Keep the space for the links. */
		:global([data-slot='app-frame'][data-rail-layout='compact']) .footer-columns {
			gap: calc(var(--space-card-gap) / 4) var(--space-card-gap);
			padding: calc(var(--space-card-gap) / 4) var(--space-card-gap);
		}
		:global([data-slot='app-frame'][data-rail-layout='compact']) .footer-columns.with-status {
			padding-block-end: calc(var(--space-card-gap) / 8);
		}
		:global([data-slot='app-frame'][data-rail-layout='compact']) .footer-columns :global([data-slot='footer-group']) {
			row-gap: calc(var(--space-card-gap) / 8);
		}
	}
	.footer-columns :global(:is([data-slot='footer-group-label'], [data-slot='footer-link'])) {
		overflow-wrap: normal;
		word-break: normal;
	}

	footer[data-balanced-blocks] {
		container: footer-balance / inline-size;
	}
	footer[data-balanced-blocks] > .footer-columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
	}
	@media (width < 40rem) {
		footer:not([data-balanced-blocks]) {
			container: footer-balance / inline-size;
		}
		.footer-columns,
		footer[data-balanced-blocks] > .footer-columns {
			display: flex;
			flex-wrap: wrap;
			column-gap: var(--footer-phone-gap, var(--space-card-gap));
		}
		.footer-brand { flex: 1 0 100%; }
		/* Pair two groups when each has room for its labels, and let a lone group fill its row. */
		.footer-columns > nav {
			flex: 1 0 min(100%, max(10rem, calc((100% - var(--space-card-gap)) / 2)));
		}
	}
	/* Keep the balanced grid and its usual gap whenever the footer is wide enough. */
	@container footer-balance (inline-size >= 29.5rem) {
		/* Two 12rem tracks, the usual 2.5rem gap, and 3rem of horizontal padding. */
		footer:not([data-balanced-blocks]) > .footer-columns {
			display: grid;
			--footer-phone-gap: calc(var(--spacing, 0.25rem) * 10);
		}
	}
	@container footer-balance (inline-size >= 34rem) {
		footer[data-balanced-blocks='4'] > .footer-columns {
			display: grid;
			--footer-phone-gap: calc(var(--spacing, 0.25rem) * 10);
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@container footer-balance (inline-size >= 39rem) {
		footer[data-balanced-blocks='5'] > .footer-columns {
			display: grid;
			--footer-phone-gap: calc(var(--spacing, 0.25rem) * 10);
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@container footer-balance (inline-size >= 63rem) {
		footer[data-balanced-blocks] > .footer-columns {
			grid-template-columns: minmax(0, 1.5fr) repeat(var(--footer-groups), minmax(0, 1fr));
		}
	}

	/* The street edge (D22): one dashed road marking along the footer's top edge, edge to edge.
	   Its 20px dashes alternate yellow (`--hazard-a`) and white (`--reflective`), both
	   theme-invariant like real paint, with 20px gaps: one yellow, one white per 80px, the grid's
	   major step. A hairline in the reading ink edges each white dash so it reads on the light
	   footer too; on the dark footer it fades into the dash. Whole pixels only, so it stays crisp
	   at 1x and 2x. Decorative and static. */
	.footer-street-edge {
		--street-edge-hairline: color-mix(in srgb, var(--foreground) 35%, transparent);
		height: 4px;
		background-image:
			repeating-linear-gradient(90deg, transparent 0 41px, var(--reflective) 41px 59px, transparent 59px 80px),
			repeating-linear-gradient(90deg, var(--hazard-a) 0 20px, transparent 20px 40px, var(--street-edge-hairline) 40px 60px, transparent 60px 80px);
		background-size:
			100% 2px,
			100% 4px;
		background-position:
			0 1px,
			0 0;
		background-repeat: no-repeat;
		pointer-events: none;
	}

	.footer-status-border {
		border-top: 2px solid var(--border-rule-accent);
	}

	@media (prefers-reduced-motion: reduce) {
		footer :global([data-slot='footer-link']) {
			transition: none;
		}
	}
</style>
