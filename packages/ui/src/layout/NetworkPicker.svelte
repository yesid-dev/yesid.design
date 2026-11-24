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
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		max-inline-size: 100%;
		min-inline-size: var(--size-tap-min);
		min-block-size: var(--size-tap-min);
		padding-inline: 0.65em;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--muted);
		color: var(--foreground);
		font-size: var(--text-control);
	}

	label:has(select:focus-visible) {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	select {
		position: absolute;
		/* Absolute sizing starts inside the label's 1px border. The native control covers it too. */
		inset: -1px;
		inline-size: calc(100% + 2px);
		block-size: calc(100% + 2px);
		border-radius: inherit;
		opacity: 0;
		cursor: pointer;
	}

	.network-code { display: none; }
	.network-name, .network-code { min-inline-size: 0; overflow-wrap: anywhere; }
	label :global(.picker-chevron) { flex-shrink: 0; }
	select, option {
		background-color: var(--popover);
		color: var(--popover-foreground);
	}

	@media (width < 37.5em) {
		.network-name { display: none; }
		.network-code { display: inline; }
	}
	@container site-header (width < 1024px) {
		:global([data-slot='site-header-network']) .network-name { display: none; }
		:global([data-slot='site-header-network']) .network-code { display: inline; }
	}
	:global([data-network-below]:not([data-network-measuring]) [data-slot='site-header-network']) .network-name { display: none; }
	:global([data-network-below]:not([data-network-measuring]) [data-slot='site-header-network']) .network-code { display: inline; }

	@media (forced-colors: active) {
		label:has(select:focus-visible) { outline-color: CanvasText; }
	}
</style>
