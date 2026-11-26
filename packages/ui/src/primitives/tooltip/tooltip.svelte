<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';

	export type TooltipProps = {
		content: string;
		trigger: NonNullable<TooltipPrimitive.TriggerProps['child']>;
	};

	let { content, trigger }: TooltipProps = $props();
</script>

<TooltipPrimitive.Provider delayDuration={400}>
	<TooltipPrimitive.Root>
		<TooltipPrimitive.Trigger child={trigger} />
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				role="tooltip"
				data-slot="tooltip-content"
				sideOffset={4}
				collisionPadding={8}
				class="z-(--z-overlay) max-w-[min(var(--container-xs),calc(100dvw-8*var(--spacing)))] wrap-anywhere rounded-md border border-border bg-popover px-3 py-2 text-small text-popover-foreground"
			>
				{content}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
