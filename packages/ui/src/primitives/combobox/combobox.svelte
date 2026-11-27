<!--
  Combobox — a bits-ui single choice control with searchable and select-only modes.

  Built on bits-ui Combobox.Root (type="single"): a text input filters the option
  list diacritics-insensitively as you type, a portal-rendered listbox shows the
  matches, and selecting one sets `value`. Clearing the field (empty + blur, or the
  reset affordance) sets `value` to `null`. With `clearable={false}` the choice
  always keeps its value: no clear affordance, picking the chosen option again keeps
  it, and closing restores its label. WAI-ARIA combobox semantics + roving
  listbox focus come from bits-ui; we only style + wire the token chrome.

  a11y (AA): the Input is the labelled combobox (aria-label from `label`), the
  Trigger toggles the listbox, each Item is an option with a mono glyph + label +
  optional sublabel. Selection is announced via the option's accessible name; the
  clear button carries its own label. --primary is used ONLY for the highlighted /
  selected option (an interaction accent), never as a data mark. Tokens, no hex.

  Reusable + surface-agnostic: the caller supplies the options (already
  glyph-tagged), searchable text, and copy.
-->
<script lang="ts" module>
	import { Combobox as ComboboxPrimitive } from 'bits-ui';

	/** One selectable option in the combobox. */
	export interface ComboboxOption {
		/** The stable, non-empty id set on `value` when picked. An empty string means no selection. */
		readonly value: string;
		/** Primary visible label. */
		readonly label: string;
		/** Optional secondary line under the label. */
		readonly sublabel?: string | null;
		/** Optional leading mono glyph (decorative identity). */
		readonly glyph?: string;
		/** Folded search haystack (diacritics-stripped) the caller precomputes. */
		readonly search: string;
	}

	/** One option in a select-only combobox. Its value must be a non-empty string. */
	export type ComboboxSelectOption = Omit<ComboboxOption, 'search'> & {
		/** Unused in select-only mode. */
		readonly search?: string;
	};

	type ComboboxBehaviorProps = Pick<
		ComboboxPrimitive.RootProps,
		| 'disabled'
		| 'required'
		| 'name'
		| 'open'
		| 'onOpenChange'
		| 'onOpenChangeComplete'
		| 'loop'
		| 'scrollAlignment'
	>;

	export interface ComboboxProps extends ComboboxBehaviorProps {
		/** Enables typing to filter options (default `true`). */
		searchable?: true;
		/** The full option catalogue (unfiltered). */
		options: readonly ComboboxOption[];
		/** The selected option id, or null when none is chosen (bindable). */
		value?: string | null;
		/** Called once when this component commits a new nullable selection. */
		onValueChange?: (value: string | null) => void;
		/** Accessible label for the combobox control. */
		label: string;
		/** Placeholder shown before a choice is made. */
		placeholder?: string;
		/**
		 * Shows the clear affordance while a value is chosen (default `true`). `false` makes a
		 * choice that always keeps a value; `ComboboxNonClearableProps` then drops `clearLabel`.
		 */
		clearable?: boolean;
		/** Accessible label for the clear affordance. */
		clearLabel: string;
		/** Shown inside the listbox when the typed query matches nothing. */
		emptyLabel: string;
		/** Pure fold fn (diacritics-insensitive) applied to the typed query. */
		fold: (raw: string) => string;
		/** Optional extra classes on the root. */
		class?: string;
	}

	/** A choice that always keeps a value: no clear affordance, so no `clearLabel` is needed. */
	export interface ComboboxNonClearableProps extends Omit<ComboboxProps, 'clearable' | 'clearLabel'> {
		clearable: false;
		/** Unused while `clearable` is false. */
		clearLabel?: string;
	}

	/** A fixed list of choices opened from a button without an editable field. */
	export interface ComboboxSelectOnlyProps extends Omit<
		ComboboxProps,
		'searchable' | 'options' | 'clearable' | 'clearLabel' | 'emptyLabel' | 'fold'
	> {
		/** Use a trigger button and a fixed option list. */
		searchable: false;
		/** Choices to show in the listbox. */
		options: readonly ComboboxSelectOption[];
		/** The select-only control has no clear affordance. */
		clearable?: false;
		/** Unused in select-only mode. */
		clearLabel?: string;
		/** Unused in select-only mode. */
		emptyLabel?: string;
		/** Unused in select-only mode. */
		fold?: ComboboxProps['fold'];
	}

	/** The props accepted by the searchable and select-only modes. */
	type ComboboxModeProps = ComboboxProps | ComboboxNonClearableProps | ComboboxSelectOnlyProps;
</script>

<script lang="ts">
	import { Combobox as BitsCombobox, Select as BitsSelect } from 'bits-ui';
	import { flushSync } from 'svelte';
	import { cn } from '../../cn/index.js';

	const listboxId = $props.id();

	let {
		options,
		searchable = true,
		value = $bindable(null),
		open = $bindable(false),
		disabled,
		required,
		name,
		onValueChange,
		onOpenChange,
		onOpenChangeComplete,
		loop,
		scrollAlignment,
		label,
		placeholder,
		clearable = true,
		clearLabel,
		emptyLabel,
		fold,
		class: className,
	}: ComboboxModeProps = $props();

	// The typed query is EPHEMERAL local state (a keystroke stream, not view state);
	// it filters the option list but is never persisted or mirrored. Folded once so
	// the match is diacritics-insensitive + word-order-tolerant (substring per token).
	// `null` means the field is not being edited.
	let search = $state<string | null>(null);
	let selectTrigger = $state<HTMLButtonElement | null>(null);
	const foldedQuery = $derived(searchable && fold ? fold(search ?? '') : '');

	const filtered = $derived.by(() => {
		if (!foldedQuery) return options;
		// Token-AND: every whitespace-separated token must appear in the option's
		// precomputed folded haystack, so "80 nord" narrows without caring about order.
		const tokens = foldedQuery.split(/\s+/).filter(Boolean);
		return options.filter((o) => tokens.every((tk) => o.search?.includes(tk)));
	});

	// The visible input text: while typing we show the raw query; otherwise the
	// label of the current selection (so a hydrated value shows its label).
	// Without a clear affordance an emptied field stays empty while it is edited,
	// and closing always restores the selection label.
	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');
	const inputValue = $derived(clearable ? search || selectedLabel : (search ?? selectedLabel));

	function commitValue(nextValue: string | null): void {
		value = nextValue;
		onValueChange?.(nextValue);
	}

	function clear(): void {
		search = null;
		commitValue(null);
	}

	function filterBeforeHighlight(event: Event): void {
		const nextSearch = (event.currentTarget as HTMLInputElement).value;
		flushSync(() => (search = nextSearch));
	}

	function handleSelectKeydown(event: KeyboardEvent, onkeydown: (event: KeyboardEvent) => void): void {
		if (open && event.key === ' ' && !event.isComposing) {
			// Bits Select can treat Space as part of its typeahead buffer. Here it always commits.
			event.preventDefault();
			onkeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
			return;
		}
		if (open || event.key === ' ' || [...event.key].length !== 1 ||
			event.altKey || event.ctrlKey || event.metaKey || event.isComposing) {
			onkeydown(event);
			return;
		}

		event.preventDefault();
		const prefix = event.key.toLowerCase();
		const index = options.findIndex((option) => option.label.toLowerCase().startsWith(prefix));
		// Use the trigger's normal activation to open and reset Bits Select's typeahead.
		flushSync(() => selectTrigger?.click());
		if (!open || index < 0) return;
		// Navigate by visible label, even when the option starts with a decorative glyph.
		onkeydown(new KeyboardEvent('keydown', { key: 'Home' }));
		for (let offset = 0; offset < index; offset++) {
			onkeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
		}
	}
</script>

{#snippet itemContent(option: ComboboxSelectOption, selected: boolean)}
	{#if option.glyph}
		<span class="combobox-item-glyph" aria-hidden="true">{option.glyph}</span>
	{/if}
	<span class="combobox-item-body">
		<span class="combobox-item-label">{option.label}</span>
		{#if option.sublabel}
			<span class="combobox-item-sub">{option.sublabel}</span>
		{/if}
	</span>
	{#if selected}
		<span class="combobox-item-check" aria-hidden="true">✓</span>
	{/if}
{/snippet}

{#if !searchable}
	<BitsSelect.Root
		type="single"
		value={value ?? ''}
		bind:open
		{disabled}
		{onOpenChange}
		{onOpenChangeComplete}
		{loop}
		{scrollAlignment}
		allowDeselect={false}
		onValueChange={(nextValue) => commitValue(nextValue || null)}
	>
		<div class={cn('combobox', className)} data-slot="combobox" data-clearable="false">
			<BitsSelect.Trigger
				bind:ref={selectTrigger}
				data-slot="combobox-trigger"
				class="combobox-select-trigger"
				aria-label={label}
				aria-required={required || undefined}
			>
				{#snippet child({ props })}
					<button {...props} onkeydown={(event) => handleSelectKeydown(event, props.onkeydown as (event: KeyboardEvent) => void)}>
						<span class="combobox-select-label">{selectedLabel || placeholder}</span>
						<span class="combobox-select-chevron" aria-hidden="true">⌄</span>
					</button>
				{/snippet}
			</BitsSelect.Trigger>
			{#if !disabled && (name || required)}
				<!-- Native interactive validation focuses the invalid select. Forward focus to the visible trigger. -->
				<select class="combobox-form-select" tabindex="-1" aria-hidden="true" {name} {required}
					onfocus={() => selectTrigger?.focus()}>
					<option value={value ?? ''}>{selectedLabel}</option>
				</select>
			{/if}
		</div>

		<BitsSelect.Portal>
			<BitsSelect.Content
				data-slot="combobox-content"
				class="combobox-content combobox-select-content"
				aria-label={label}
				sideOffset={6}
				strategy="fixed"
			>
				<BitsSelect.Viewport class="combobox-viewport">
					{#each options as option (option.value)}
						<BitsSelect.Item data-slot="combobox-item" class="combobox-item" value={option.value} label={option.label}>
							{#snippet children({ selected })}
								{@render itemContent(option, selected)}
							{/snippet}
						</BitsSelect.Item>
					{/each}
				</BitsSelect.Viewport>
			</BitsSelect.Content>
		</BitsSelect.Portal>
	</BitsSelect.Root>
{:else}
<BitsCombobox.Root
	type="single"
	value={value ?? ''}
	bind:open
	{disabled}
	{required}
	{name}
	{onOpenChange}
	{loop}
	{scrollAlignment}
	{inputValue}
	allowDeselect={clearable}
	onValueChange={(nextValue) => {
		commitValue(nextValue || null);
	}}
	onOpenChangeComplete={(nextOpen) => {
		// On close, drop the transient typed query so the input snaps back to the
		// selection label (never a stale half-typed fragment).
		if (!nextOpen) search = null;
		onOpenChangeComplete?.(nextOpen);
	}}
	items={filtered.map((o) => ({ value: o.value, label: o.label }))}
>
	<div
		class={cn('combobox', className)}
		data-slot="combobox"
		data-clearable={clearable ? undefined : 'false'}
	>
		<BitsCombobox.Input
			data-slot="combobox-input"
			class="combobox-input"
			aria-label={label}
			aria-controls={listboxId}
			{placeholder}
			defaultValue={selectedLabel}
			oninput={filterBeforeHighlight}
		/>
		{#if clearable && value}
			<button
				type="button"
				class="combobox-clear"
				data-slot="combobox-clear"
				aria-label={clearLabel}
				{disabled}
				onclick={clear}
			>
				<span aria-hidden="true">✕</span>
			</button>
		{/if}
		<BitsCombobox.Trigger
			data-slot="combobox-trigger"
			class="combobox-trigger"
			aria-label={label}
		>
			<span aria-hidden="true">⌄</span>
		</BitsCombobox.Trigger>
	</div>

	<BitsCombobox.Portal>
		<BitsCombobox.Content
			data-slot="combobox-content"
			class="combobox-content"
			sideOffset={6}
			strategy="fixed"
		>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<div {...props} id={listboxId} aria-label={label}>
						<BitsCombobox.Viewport class="combobox-viewport">
							{#each filtered as option (option.value)}
								<BitsCombobox.Item
									data-slot="combobox-item"
									class="combobox-item"
									value={option.value}
									label={option.label}
								>
									{#snippet children({ selected })}
										{@render itemContent(option, selected)}
									{/snippet}
								</BitsCombobox.Item>
							{:else}
								<p class="combobox-empty">{emptyLabel}</p>
							{/each}
						</BitsCombobox.Viewport>
					</div>
				</div>
			{/snippet}
		</BitsCombobox.Content>
	</BitsCombobox.Portal>
</BitsCombobox.Root>
{/if}

<style>
	/* The trigger row: a mono input carrying the same card/border/focus chrome as
	   SearchInput, with a clear (✕) + open (⌄) affordance tucked at the trailing
	   edge. Tokens only; --primary is reserved for the highlighted option below. */
	.combobox {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
	}
	:global(.combobox-input),
	:global(.combobox-select-trigger) {
		flex: 1 1 auto;
		min-width: 0;
		/* Tap-target floor (P5.3d §C4 P10): the input row was 39px tall → 44px. */
		min-height: var(--size-tap-min);
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		/* Right padding reserves room for the 44px clear + trigger hit areas. */
		padding: 0.5rem 5.25rem 0.5rem 0.75rem;
		line-height: 1.4;
	}
	/* With no clear affordance, the input reserves room for the trigger alone. */
	.combobox[data-clearable='false'] :global(.combobox-input) {
		padding-right: var(--size-tap-min);
	}
	:global(.combobox-input::placeholder) {
		color: var(--muted-foreground);
	}
	:global(.combobox-input:focus-visible),
	:global(.combobox-select-trigger:focus-visible) {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.combobox-clear,
	:global(.combobox-trigger) {
		position: absolute;
		top: 50%;
		translate: 0 -50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* Tap-target floor (P5.3d §C4 P10): the clear/open affordances were 28px
		   square → a full --size-tap-min hit area (the glyph stays visually small). */
		width: var(--size-tap-min);
		height: var(--size-tap-min);
		color: var(--muted-foreground);
		background: transparent;
		border: 0;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-mono);
	}
	.combobox-clear {
		right: 2.5rem;
		font-size: var(--text-small);
	}
	:global(.combobox-trigger) {
		right: 0;
		font-size: var(--text-body);
	}
	.combobox-clear:hover,
	:global(.combobox-trigger:hover) {
		color: var(--foreground);
	}
	.combobox-clear:focus-visible,
	:global(.combobox-trigger:focus-visible) {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
	}
	:global(.combobox-select-trigger) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		text-align: start;
		cursor: pointer;
	}
	:global(.combobox-select-trigger[data-placeholder]),
	.combobox-select-chevron {
		color: var(--muted-foreground);
	}
	.combobox-form-select {
		position: absolute;
		inset-inline-start: 0;
		width: 1px;
		height: 1px;
		clip-path: inset(50%);
		pointer-events: none;
	}
	:global(.combobox-select-trigger:disabled) {
		cursor: default;
	}
	.combobox-select-label {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.combobox-select-chevron {
		flex: none;
		font-size: var(--text-body);
	}

	/* The portal-rendered listbox: a bordered card popover, capped height with
	   scroll, anchored to the input width. */
	:global(.combobox-content) {
		z-index: var(--z-menu);
		width: var(--bits-combobox-anchor-width);
		max-height: min(20rem, var(--bits-combobox-content-available-height));
		overflow-y: auto;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md, 0 4px 12px rgb(0 0 0 / 0.15));
		padding: 0.25rem;
	}
	:global(.combobox-select-content) {
		width: min(var(--bits-select-anchor-width), var(--bits-select-content-available-width));
		max-height: min(20rem, var(--bits-select-content-available-height));
	}
	:global(.combobox-item) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.625rem;
		border-radius: var(--radius-sm);
		font-size: var(--text-small);
		color: var(--foreground);
		cursor: pointer;
		user-select: none;
	}
	/* Highlight (keyboard/pointer) + selected = an INTERACTION accent → --primary. */
	:global(.combobox-item[data-highlighted]),
	:global(.combobox-item[data-selected]) {
		background: color-mix(in oklab, var(--primary) 14%, transparent);
	}
	:global(.combobox-item-glyph) {
		font-family: var(--font-mono);
		color: var(--muted-foreground);
		flex: none;
	}
	.combobox-item-body {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.combobox-item-label {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.combobox-item-sub {
		font-size: var(--text-micro);
		color: var(--muted-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.combobox-select-content) .combobox-item-label,
	:global(.combobox-select-content) .combobox-item-sub {
		white-space: normal;
		overflow-wrap: anywhere;
	}
	:global(.combobox-item-check) {
		margin-left: auto;
		color: var(--primary);
		flex: none;
	}
	.combobox-empty {
		padding: 0.625rem 0.75rem;
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}
</style>
