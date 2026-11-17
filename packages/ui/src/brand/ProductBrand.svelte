<!--
  @component
  Experimental. The product-brand cluster: the still house wordmark, a divider and the product's
  name as a link, as in "yesid. | Login". Pass it through SiteHeader's `brand` snippet or
  SiteFooter's `brand` snippet. The product owns the name, links and accessible names.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export interface ProductBrandProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
		/** The product name as the product writes it, for example "Login" or "Transit". */
		product: string;
		/** The product's home. */
		href: string;
		/** Where the house wordmark leads. */
		houseHref: string;
		/** Opens the house link in a new tab with `rel="noopener noreferrer"`. Defaults to false. */
		houseExternal?: boolean;
		/** The house link's accessible name, for example one that says it opens a new tab. */
		houseLabel?: string;
		/** Inline styles for the house link, for example an independent rem font size. */
		houseStyle?: string;
		/** Inline styles for the product link. Preserve its focus ring and minimum target. */
		productStyle?: string;
		/** Inline styles for the decorative divider, for example container-driven visibility. */
		dividerStyle?: string;
		/** Marks the product link as the current page. */
		current?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import Wordmark from './Wordmark.svelte';

	let {
		product,
		href,
		houseHref,
		houseExternal = false,
		houseLabel,
		houseStyle,
		productStyle,
		dividerStyle,
		current = false,
		class: className,
		...rest
	}: ProductBrandProps = $props();
</script>

<span class={cn('product-brand', className)} data-slot="product-brand" {...rest}>
	<Wordmark
		href={houseHref}
		external={houseExternal}
		animate={false}
		aria-label={houseLabel}
		style={houseStyle}
	/>
	<span class="product-brand-divider" style={dividerStyle} aria-hidden="true"></span>
	<a {href} class="product-brand-name" style={productStyle} data-slot="product-brand-name" aria-current={current ? 'page' : undefined}
		>{product}</a
	>
</span>

<style>
	/* :where keeps the default size overridable by a caller's class. */
	:where(.product-brand) {
		font-size: var(--text-nav-brand-desktop);
	}
	.product-brand {
		display: inline-flex;
		align-items: center;
		/* Inside SiteHeader's pill the divider takes the pill's one split space, the same on both
		   sides as every other navbar `|`; elsewhere the cluster keeps its own 0.5em. */
		gap: var(--nav-split-space, 0.5em);
		min-width: 0;
		line-height: 1.2;
	}
	.product-brand-divider {
		width: 2px;
		height: 1em;
		flex-shrink: 0;
		background: var(--border-brand);
	}
	/* A long name wraps between words beside the house mark; a short one keeps a 44px target. */
	.product-brand-name {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		min-inline-size: var(--size-tap-min);
		overflow-wrap: break-word;
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--foreground);
		text-decoration: none;
		border-radius: var(--radius-sm);
		transition: color var(--duration-fast) var(--ease-default);
	}
	.product-brand-name:hover {
		color: var(--primary);
	}
	.product-brand-name:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.product-brand-name {
			transition: none;
		}
	}
</style>
