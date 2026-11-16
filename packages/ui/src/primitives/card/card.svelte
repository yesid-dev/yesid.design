<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '../../cn/index.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		interactive = false,
		edge = 'brand',
		textSize = 'small',
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		size?: 'default' | 'sm';
		/** Marks a card that acts (a whole-card link or button): only these react to hover. */
		interactive?: boolean;
		/** `neutral` draws the static edge in `--border` instead of the brand orange. */
		edge?: 'brand' | 'neutral';
		/** `inherit` drops the 14px base so text and fields inside keep the page size (16px or more). */
		textSize?: 'small' | 'inherit';
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	data-interactive={interactive ? 'true' : undefined}
	data-edge={edge === 'neutral' ? 'neutral' : undefined}
	class={cn(
		'card-surface text-card-foreground gap-4 overflow-hidden py-4',
		textSize === 'small' && 'text-sm',
		'has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>

<style>
	/* A solid panel one step above the page (never alpha, so the grid can't bleed through) with a
	   lit top bevel. Only a card that acts reacts to hover and to keyboard focus (on the card, inside
	   it, or on a whole-card link that wraps it): the border firms and the card lifts 1px, beside the
	   2px focus ring. Identical in light and dark: lift and edge, no shadow (owner rulings,
	   15 November 2026). The inset bevel is the same at rest and on hover. A static card never
	   suggests an action. */
	.card-surface {
		background: var(--surface-2);
		border: 2px solid var(--border-brand);
		border-radius: var(--radius-lg);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		transition:
			border-color var(--duration-normal) var(--ease-default),
			transform var(--duration-normal) var(--ease-default);
	}
	.card-surface[data-edge='neutral'] {
		border-color: var(--border);
	}
	.card-surface[data-interactive='true']:is(:hover, :focus-visible, :has(:global(:focus-visible))),
	:global(:focus-visible) > .card-surface[data-interactive='true'] {
		border-color: var(--border-brand-active);
		transform: translateY(-1px);
	}
	@media (prefers-reduced-motion: reduce) {
		.card-surface[data-interactive='true']:is(:hover, :focus-visible, :has(:global(:focus-visible))),
		:global(:focus-visible) > .card-surface[data-interactive='true'] {
			transform: none;
		}
	}
</style>
