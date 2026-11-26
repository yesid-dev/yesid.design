<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';

	export type TooltipProps = {
		content: string;
		trigger: NonNullable<TooltipPrimitive.TriggerProps['child']>;
		'aria-describedby'?: string;
	};

	let { content, trigger, 'aria-describedby': describedBy }: TooltipProps = $props();
	let open = $state(false);
	let scrollport = $state<HTMLElement | null>(null);
	let focusOwner: Element | null = null;
	let dismissed = false;

	function rememberFocus(event: FocusEvent) {
		if (event.currentTarget instanceof Element && event.currentTarget.matches(':focus-visible')) {
			focusOwner = event.currentTarget;
			dismissed = false;
		}
	}

	function releaseFocus() {
		focusOwner = null;
	}

	function resumeHover(event: PointerEvent) {
		if (event.pointerType !== 'touch') dismissed = false;
	}

	function dismiss() {
		dismissed = true;
	}

	function setOpen(next: boolean) {
		// Bits UI owns hover timing and pointer travel. Keyboard focus holds the hint through
		// incidental closes until Escape or trigger activation dismisses it.
		if (dismissed) open = false;
		else if (next || !focusOwner?.matches(':focus')) open = next;
	}

	function scrollHint(event: KeyboardEvent) {
		if (!open || !scrollport || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const { clientHeight, scrollHeight, scrollTop } = scrollport;
		if (scrollHeight <= clientHeight) return;

		let top: number;
		switch (event.key) {
			case 'ArrowDown':
				top = scrollTop + 40;
				break;
			case 'ArrowUp':
				top = scrollTop - 40;
				break;
			case 'PageDown':
				top = scrollTop + clientHeight;
				break;
			case 'PageUp':
				top = scrollTop - clientHeight;
				break;
			case 'Home':
				top = 0;
				break;
			case 'End':
				top = scrollHeight - clientHeight;
				break;
			default:
				return;
		}
		event.preventDefault();
		scrollport.scrollTo({ top, behavior: 'instant' });
	}
</script>

<TooltipPrimitive.Provider delayDuration={400}>
	<TooltipPrimitive.Root bind:open={() => open, setOpen}>
		<TooltipPrimitive.Trigger
			onfocus={rememberFocus}
			onblur={releaseFocus}
			onpointerenter={resumeHover}
			onpointerdown={dismiss}
			onclick={dismiss}
			onkeydown={scrollHint}
		>
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
				bind:ref={scrollport}
				role="tooltip"
				data-slot="tooltip-content"
				sideOffset={4}
				collisionPadding={8}
				onEscapeKeydown={dismiss}
				style="max-block-size: var(--bits-tooltip-content-available-height)"
				class="z-(--z-overlay) max-w-[min(var(--container-xs),calc(100dvw-8*var(--spacing)))] overflow-y-auto wrap-anywhere rounded-md border border-border bg-popover px-3 py-2 text-small text-popover-foreground"
			>
				{content}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
