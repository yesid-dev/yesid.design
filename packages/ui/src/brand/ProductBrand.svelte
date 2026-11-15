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
	/>
	<span class="product-brand-divider" aria-hidden="true"></span>
	<a {href} class="product-brand-name" data-slot="product-brand-name" aria-current={current ? 'page' : undefined}
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
		gap: 0.5em;
		min-width: 0;
		line-height: 1.2;
	}
	.product-brand-divider {
		width: 2px;
		height: 1em;
		flex-shrink: 0;
		background: var(--border-brand);
	}
	/* A long name wraps between words beside the house mark; the cluster never overflows. */
	.product-brand-name {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		min-width: 0;
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
