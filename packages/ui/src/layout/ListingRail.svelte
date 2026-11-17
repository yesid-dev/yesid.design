<!-- The listing left rail, shared by listing and standalone page headings. -->
<script lang="ts" module>
	interface ListingRailBase {
		heading: string;
		/** Defaults to true; false lets the departing title scroll away without a header mask. */
		clipAtHeader?: boolean;
	}
	/** Decorative rails require a separate accessible heading. Semantic rails own the heading at every width. */
	export type ListingRailProps = ListingRailBase & (
		| { decorative: true; level?: never; titleId?: never }
		| { decorative?: false; level?: 1 | 2 | 3 | 4 | 5 | 6; titleId?: string }
	);
</script>

<script lang="ts">
	import RailTitle from '../brand/RailTitle.svelte';
	let { heading, decorative = false, level = 1, titleId, clipAtHeader }: ListingRailProps = $props();
</script>

<div class="edge-title-column" data-slot="listing-edge-title" aria-hidden={decorative ? true : undefined} class:semantic={!decorative}>
	<RailTitle {heading} {decorative} {level} {titleId} size="clamp(3rem, 4vw, 3.5rem)" class="edge-title" {clipAtHeader} />
	<div class="metro-dots metro-dots-top" aria-hidden="true">
		<div class="metro-line"></div>
		<div class="metro-dot metro-dot-sm"></div>
		<div class="metro-dot metro-dot-sm"></div>
		<div class="metro-dot metro-dot-sm"></div>
		<div class="metro-dot metro-dot-lg"></div>
	</div>
	<div class="metro-dots metro-dots-bottom" aria-hidden="true">
		<div class="metro-dot metro-dot-lg"></div>
		<div class="metro-dot metro-dot-sm"></div>
		<div class="metro-dot metro-dot-sm"></div>
		<div class="metro-dot metro-dot-sm"></div>
		<div class="metro-line"></div>
	</div>
</div>

<div class="accent-rail" data-slot="listing-accent-rail" aria-hidden="true"></div>

<style>
	.edge-title-column, .accent-rail { display: none; }
	.edge-title-column.semantic { display: block; min-width: 0; padding: 1rem var(--space-page-x); }
	.metro-dots { display: none; }
	@media (min-width: 1024px) {
		.edge-title-column, .edge-title-column.semantic {
			display: flex;
			align-items: center;
			justify-content: center;
			position: sticky;
			top: 0;
			height: 100dvh;
			padding: 1rem 1.5rem;
		}

		/* The column itself stays in view and centres the rail title, which may wrap onto a second
		   vertical line to keep clear of the header pill and the column's metro dots. */
		.edge-title-column :global([data-slot='rail-title'].rail-title) {
			position: static;
			align-self: center;
		}

		.edge-title-column :global([data-slot='rail-title'] .rail-title-text) {
			max-height: calc(100dvh - 16rem);
			white-space: normal;
			overflow-wrap: anywhere;
		}

		.accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 35%, transparent);
		}

		.metro-dots { display: flex; }
	}
	.metro-dots {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		flex-direction: column;
		align-items: center;
		gap: 12px;
		writing-mode: horizontal-tb;
	}

	.metro-dots-top {
		top: 16px;
	}

	.metro-dots-bottom {
		bottom: 16px;
	}

	.metro-line {
		width: 2px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 25%, transparent);
	}

	.metro-dot {
		border-radius: 50%;
	}

	.metro-dot-sm {
		width: 6px;
		height: 6px;
		border: 1.5px solid color-mix(in srgb, var(--primary) 35%, transparent);
	}

	.metro-dot-lg {
		width: 10px;
		height: 10px;
		background: color-mix(in srgb, var(--primary) 25%, transparent);
		border: 2px solid color-mix(in srgb, var(--primary) 45%, transparent);
	}
</style>
