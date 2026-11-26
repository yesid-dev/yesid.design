<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';

	export type TooltipProps = {
		content: string;
		trigger: NonNullable<TooltipPrimitive.TriggerProps['child']>;
		'aria-describedby'?: string;
	};

	let { content, trigger, 'aria-describedby': describedBy }: TooltipProps = $props();
	let open = $state(false);
	let focusedTrigger: Element | null = null;

	function rememberFocus(event: FocusEvent) {
		if (event.currentTarget instanceof Element && event.currentTarget.matches(':focus-visible')) {
			focusedTrigger = event.currentTarget;
		}
	}

	function releaseFocus() {
		focusedTrigger = null;
	}

	function setOpen(next: boolean) {
		// bits-ui also requests a close on ancestor scroll and pointer exit.
		if (next || !focusedTrigger?.matches(':focus')) open = next;
	}
</script>

<TooltipPrimitive.Provider delayDuration={400}>
	<TooltipPrimitive.Root bind:open={() => open, setOpen}>
		<TooltipPrimitive.Trigger onfocus={rememberFocus} onblur={releaseFocus} onpointerdown={releaseFocus}>
			{#snippet child({ props })}
				{@render trigger({
					props: {
						...props,
						'aria-describedby': [describedBy, props['aria-describedby']].filter(Boolean).join(' ') || undefined,
					},
				})}
			{/snippet}
		</TooltipPrimitive.Trigger>
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				role="tooltip"
				data-slot="tooltip-content"
				sideOffset={4}
				collisionPadding={8}
				onEscapeKeydown={releaseFocus}
				style="max-block-size: var(--bits-tooltip-content-available-height)"
				class="z-(--z-overlay) max-w-[min(var(--container-xs),calc(100dvw-8*var(--spacing)))] overflow-y-auto wrap-anywhere rounded-md border border-border bg-popover px-3 py-2 text-small text-popover-foreground"
			>
				{content}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
