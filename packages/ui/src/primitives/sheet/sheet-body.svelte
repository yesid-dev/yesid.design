<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '../../cn/index.js';

	export type SheetBodyProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

	let { ref = $bindable(null), class: className, children, ...restProps }: SheetBodyProps = $props();
</script>

<div bind:this={ref} data-slot="sheet-body" class={cn('px-4', className)} {...restProps}>
	{@render children?.()}
</div>
