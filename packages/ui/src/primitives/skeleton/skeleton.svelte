<script lang="ts">
	import type { WithElementRef } from '../../cn/index.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '../../cn/index.js';

	interface SkeletonProps extends WithElementRef<HTMLAttributes<HTMLDivElement>> {
		busy?: boolean;
	}

	let {
		busy = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: SkeletonProps = $props();
</script>

<!--
Loading placeholder. Surface = bg-muted (solid, no alpha; surfaces stay
opaque per doctrine). The scoped pulse and reduced-motion guard below
halt animation for users who opt out.
-->
<div
	bind:this={ref}
	data-slot="skeleton"
	aria-hidden="true"
	class={cn('skeleton-pulse rounded-md bg-muted', className)}
	{...restProps}
	data-skeleton-busy={busy || undefined}
>
	{@render children?.()}
</div>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.skeleton-pulse[data-skeleton-busy],
		:global([aria-busy='true']) .skeleton-pulse {
			animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
