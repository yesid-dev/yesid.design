<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export interface RoutePlateProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
		code: string;
		size?: 'md' | 'lg';
		/** Draws the schedule-only plate with a dashed border. Supply accompanying status copy. */
		scheduleOnly?: boolean;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';

	let { code, size = 'md', scheduleOnly = false, class: className, ...rest }: RoutePlateProps = $props();
</script>

<span
	{...rest}
	class={cn('route-plate', className)}
	data-slot="route-plate"
	data-size={size}
	data-schedule-only={scheduleOnly || undefined}
>{code}</span>

<style>
	.route-plate {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-inline-size: min(2.9em, 100%);
		max-inline-size: 100%;
		padding: 0.2em 0.5em;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--signage-bg);
		color: var(--signage-text);
		font: 700 var(--text-small)/1.25 var(--font-mono);
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}
	.route-plate[data-size='lg'] { font-size: var(--text-heading); }
	.route-plate[data-schedule-only] {
		border-style: dashed;
		border-color: var(--muted-foreground);
		background: transparent;
		color: var(--foreground);
	}
</style>
