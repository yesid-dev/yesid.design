<script lang="ts" module>
	export interface SwitchProps {
		label: string;
		stateLabels: { on: string; off: string };
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		disabled?: boolean;
		class?: string;
	}
</script>

<script lang="ts">
	import { cn } from '../../cn/index.js';

	let { label, stateLabels, checked = $bindable(false), onCheckedChange, disabled = false, class: className }: SwitchProps = $props();

	function toggle() {
		if (disabled) return;
		checked = !checked;
		onCheckedChange?.(checked);
	}
</script>

<button type="button" role="switch" aria-checked={checked} {disabled}
	class={cn('switch', className)} data-slot="switch" onclick={toggle}>
	<span>{label}</span>
	<span class="state" aria-hidden="true">{checked ? stateLabels.on : stateLabels.off}</span>
</button>

<style>
	.switch {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25em 0.75em;
		min-inline-size: var(--size-tap-min);
		min-block-size: var(--size-tap-min);
		max-inline-size: 100%;
		padding: 0.25em 0.625em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--background);
		color: var(--foreground);
		font: inherit;
		text-align: start;
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	.state {
		padding-inline: 0.4em;
		border: 1px solid currentColor;
		border-radius: var(--radius-sm);
		color: var(--muted-foreground);
	}
	[aria-checked='true'] .state { color: var(--primary); }
	.switch:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
	.switch:disabled { color: var(--muted-foreground); cursor: default; }
	.switch:disabled .state { color: inherit; }
	@media (forced-colors: active) {
		.switch:disabled { color: GrayText; border-color: GrayText; }
		.switch:focus-visible { outline-color: Highlight; }
	}
</style>
