<script lang="ts" module>
	export interface NetworkOption {
		id: string;
		name: string;
		city: string;
		shortCode: string;
	}

	export interface NetworkPickerProps {
		label: string;
		networks: readonly NetworkOption[];
		/** Selected network ID. Use an ID from the supplied list. */
		value: string;
		onValueChange: (id: string) => void;
	}
</script>

<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { label, networks, value, onValueChange }: NetworkPickerProps = $props();
	const selected = $derived(networks.find((network) => network.id === value) ?? networks[0]);
	const name = (network: NetworkOption) => `${network.city} · ${network.name}`;

	function selectNetwork(input: HTMLSelectElement): void {
		const next = input.value;
		input.value = selected?.id ?? '';
		onValueChange(next);
	}
</script>

{#if selected}
	<label class="network-picker" data-slot="network-picker" title={name(selected)}>
		<span class="network-name" aria-hidden="true">{name(selected)}</span>
		<span class="network-code" aria-hidden="true">{selected.shortCode}</span>
		<ChevronDown class="picker-chevron" size="1em" aria-hidden="true" />
		<select aria-label={label} value={selected.id} onchange={(event) => selectNetwork(event.currentTarget)}>
			{#each networks as network (network.id)}
				<option value={network.id}>{name(network)}</option>
			{/each}
		</select>
	</label>
{/if}

<style>
	label {
		--picker-edge: var(--network-picker-border-width, 1px);
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		max-inline-size: 100%;
		min-inline-size: var(--size-tap-min);
		min-block-size: var(--size-tap-min);
		padding-inline: 0.65em;
		border: var(--picker-edge) solid var(--network-picker-border-color, var(--border));
		border-radius: var(--radius-pill);
		background: var(--network-picker-background, var(--muted));
		box-shadow: var(--network-picker-shadow, none);
		color: var(--foreground);
		font-size: var(--text-control);
	}

	label:has(select:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	select {
		position: absolute;
		/* Absolute sizing starts inside the label's border. The native control covers it too. */
		inset: calc(-1 * var(--picker-edge));
		inline-size: calc(100% + 2 * var(--picker-edge));
		block-size: calc(100% + 2 * var(--picker-edge));
		border-radius: inherit;
		opacity: 0;
		cursor: pointer;
	}

	.network-name { display: var(--network-picker-name-display, inline); }
	.network-code { display: var(--network-picker-code-display, none); }
	.network-name, .network-code {
		min-inline-size: 0;
		overflow: hidden;
		overflow-wrap: anywhere;
		text-overflow: ellipsis;
	}
	label :global(.picker-chevron) {
		flex-shrink: 0;
		color: var(--muted-foreground);
	}
	select, option {
		background-color: var(--popover);
		color: var(--popover-foreground);
	}

	@media (width < 37.5em) {
		.network-name { display: var(--network-picker-name-display, none); }
		.network-code { display: var(--network-picker-code-display, inline); }
	}

	@media (forced-colors: active) {
		label:has(select:focus-visible) { outline-color: CanvasText; }
	}
</style>
