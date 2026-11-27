<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';
	import { twMergeConfig } from '../../cn/index.js';

	export const sheetVariants = tv(
		{
			base: 'bg-popover text-popover-foreground shadow-sheet fixed flex flex-col gap-4 ease-(--ease-out) data-[state=closed]:duration-(--duration-fast) data-[state=open]:duration-(--duration-normal) motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:transition-none',
			variants: {
				side: {
					right:
						'data-[state=closed]:slide-out-to-right-[12px] data-[state=open]:slide-in-from-right-[12px] inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border',
					bottom:
						'data-[state=closed]:slide-out-to-bottom-[12px] data-[state=open]:slide-in-from-bottom-[12px] inset-x-0 bottom-0 max-h-[90svh] w-full rounded-t-xl border-t border-border',
					center:
						'bg-card text-card-foreground shadow-[0_4px_12px_rgb(0_0_0_/_0.15)] data-[state=closed]:slide-out-to-bottom-[8px] data-[state=open]:slide-in-from-bottom-[8px] inset-0 m-auto h-fit max-h-[min(80dvh,44rem)] w-[min(var(--sheet-center-width,40rem),calc(100vw-2rem))] overflow-hidden rounded-lg border border-border [&>[data-slot=sheet-header]]:shrink-0 [&>[data-slot=sheet-footer]]:shrink-0 [&>[data-slot=sheet-body]]:min-h-0 [&>[data-slot=sheet-body]]:overflow-y-auto [&>[data-slot=sheet-body]]:overscroll-contain [&_[data-slot=sheet-title]]:text-[18px] [&_[data-slot=sheet-title]]:font-semibold',
				},
			},
			defaultVariants: {
				// Bottom drawer is the mobile-first default.
				side: 'bottom',
			},
		},
		{ twMergeConfig },
	);

	export type SheetSide = VariantProps<typeof sheetVariants>['side'];
</script>

<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import XIcon from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import SheetOverlay from './sheet-overlay.svelte';
	import { cssHeight, validateDetents, type SheetDetent } from './detents.js';
	import { sheetDrag } from './drag.js';
	import {
		cn,
		type WithoutChildren,
		type WithoutChildrenOrChild,
	} from '../../cn/index.js';

	export type SheetContentProps = WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		modal?: boolean;
		detent?: string;
		ondetentchange?: (id: string) => void;
		portalProps?: WithoutChildren<SheetPrimitive.PortalProps>;
		children: Snippet;
	} & (
		| { detents: readonly SheetDetent[]; handleLabel: string; side?: 'bottom' }
		| {
			detents?: undefined;
			handleLabel?: never;
			side?: SheetSide | { base: NonNullable<SheetSide>; md: NonNullable<SheetSide> };
		}
	) & (
		| { showCloseButton?: boolean; closeLabel: string }
		| { showCloseButton: false; closeLabel?: string }
	);

	let {
		ref = $bindable(null),
		class: className,
		side = 'bottom',
		modal = true,
		detents,
		detent = $bindable(),
		ondetentchange,
		handleLabel,
		portalProps,
		showCloseButton = true,
		closeLabel,
		children,
		...restProps
	}: SheetContentProps = $props();
	// Matches the kit's tablet minimum. Subscribe only while resolving a responsive side.
	const md = $derived(typeof side === 'object' && side !== null ? new MediaQuery('min-width: 768px') : undefined);
	const resolvedSide = $derived.by(() => {
		if (!side || typeof side !== 'object') return side;
		return md?.current ? side.md : side.base;
	});
	let dragHeight = $state<number>();
	let dismiss: HTMLButtonElement | null = $state(null);
	const index = $derived(Math.max(0, detents?.findIndex(d => d.id === detent) ?? 0));
	const active = $derived(detents?.[index]);
	const contentClasses = $derived(cn(
		sheetVariants({ side: resolvedSide }),
		showCloseButton && '[&_[data-slot=sheet-header]]:pr-12',
		detents && 'max-h-none gap-0 overflow-hidden',
		className,
	));
	$effect(() => {
		if (!detents) return;
		if (side !== 'bottom') throw new Error('Sheet detents require side="bottom"');
		validateDetents(detents);
		if (!detents.some(d => d.id === detent)) detent = detents[0].id;
	});
	function change(next: number) {
		const id = detents?.[next]?.id;
		if (id === undefined || id === detent) return;
		detent = id;
		ondetentchange?.(id);
	}
	function handleKey(e: KeyboardEvent) {
		if (!detents) return;
		let next: number;
		switch (e.key) {
			case 'ArrowUp': case 'ArrowRight': case 'PageUp': next = Math.min(index + 1, detents.length - 1); break;
			case 'ArrowDown': case 'ArrowLeft': case 'PageDown': next = Math.max(index - 1, 0); break;
			case 'Home': next = 0; break;
			case 'End': next = detents.length - 1; break;
			case 'Enter': case ' ': next = (index + 1) % detents.length; break;
			default: return;
		}
		e.preventDefault();
		change(next);
	}
	function nonModalKey(e: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		restProps.onkeydowncapture?.(e);
		if (e.defaultPrevented) return;
		restProps.onkeydown?.(e);
		if (e.key === 'Tab') e.stopImmediatePropagation();
		if (e.defaultPrevented || e.key !== 'Escape' || restProps.escapeKeydownBehavior !== undefined) return;
		restProps.onEscapeKeydown?.(e);
		if (!e.defaultPrevented) { e.stopPropagation(); dismiss?.click(); }
	}
</script>

{#snippet body()}
	{#if detents && active}
		<div data-sheet-handle role="slider" tabindex="0" aria-label={handleLabel}
			aria-orientation="vertical" aria-valuemin={0} aria-valuemax={detents.length - 1}
			aria-valuenow={index} aria-valuetext={active.label}
			class="flex h-11 w-full shrink-0 items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			onkeydown={handleKey} onclick={() => change((index + 1) % detents.length)}>
			<span class="bg-border-strong rounded-pill h-1 w-9" aria-hidden="true"></span>
		</div>
	{/if}
	{@render children?.()}
	{#if !modal}<SheetPrimitive.Close bind:ref={dismiss} hidden tabindex={-1} aria-hidden="true" />{/if}
	{#if showCloseButton}
		<SheetPrimitive.Close class="ring-offset-background focus-visible:ring-ring text-muted-foreground hover:text-foreground absolute top-0.5 right-0.5 inline-flex size-11 items-center justify-center rounded-sm opacity-80 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
			<XIcon aria-hidden="true" /><span class="sr-only">{closeLabel}</span>
		</SheetPrimitive.Close>
	{/if}
{/snippet}

<SheetPrimitive.Portal {...portalProps}>
	{#if modal}<SheetOverlay />{/if}
	<SheetPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		style="z-index: calc(var(--z-index-sheet) + 1);"
		class={contentClasses}
		{...(!modal ? { trapFocus: false, preventScroll: false, interactOutsideBehavior: 'ignore' as const, escapeKeydownBehavior: 'ignore' as const } : {})}
		{...restProps}
	>
		{#snippet child({ props })}
			{#if detents}
				<!-- Bits supplies aria-modal and a Tab loop after caller props; override on the element. -->
				<div {...props} aria-modal={modal ? 'true' : 'false'}
					onkeydown={modal ? restProps.onkeydown : undefined}
					onkeydowncapture={!modal ? nonModalKey : restProps.onkeydowncapture}
					data-detent={active?.id} data-sheet-detents={detents ? '' : undefined}
					style:height={active ? dragHeight === undefined ? cssHeight(detents, index) : `${dragHeight}px` : undefined}
					style:touch-action={detents ? 'none' : undefined}
					style:transition-property={detents ? 'height' : undefined}
					style:transition-duration={detents ? dragHeight === undefined ? 'var(--duration-normal)' : '0s' : undefined}
					style:transition-timing-function={detents ? 'var(--ease-out)' : undefined}
					use:sheetDrag={() => ({ detents: detents ?? [], change, height: value => dragHeight = value })}>
					{@render body()}
				</div>
			{:else if !modal}
				<div {...props} aria-modal="false" onkeydown={undefined} onkeydowncapture={nonModalKey}>
					{@render body()}
				</div>
			{:else}
				<div {...props}>{@render body()}</div>
			{/if}
		{/snippet}
	</SheetPrimitive.Content>
</SheetPrimitive.Portal>

<style>
	@media (prefers-reduced-motion: reduce) {
		:global([data-sheet-detents]) { transition-duration: 0s !important; }
	}
</style>
