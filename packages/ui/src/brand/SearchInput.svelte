<!-- Free-text listing search. `label` is the accessible name; the placeholder is only a hint. -->
<script lang="ts" module>
	import type { HTMLInputAttributes } from 'svelte/elements';
	export interface SearchInputProps extends Omit<HTMLInputAttributes, 'value'> {
		ref?: HTMLInputElement | null;
		visibleLabel?: boolean;
		description?: string;
		/** Opt into body text without changing existing compact callers. */
		textSize?: 'small' | 'body';
		value?: string;
		label: string;
		placeholder: string;
		/** Defaults to `testId`, else `listing-search`. */
		name?: string;
		testId?: string;
	}
</script>

<script lang="ts">
	import { cn } from '../cn/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';

	const uid = $props.id();
	let {
		value = $bindable(''),
		ref = $bindable(null),
		visibleLabel = false,
		description,
		textSize = 'small',
		id = uid,
		class: className,
		'aria-describedby': describedBy,
		label,
		placeholder,
		testId,
		name = testId ?? 'listing-search',
		...restProps
	}: SearchInputProps = $props();
</script>

{#snippet searchField()}
<div class="relative" data-slot="listing-search-field">
	<input
		{...restProps}
		bind:this={ref}
		{id}
		type={restProps.type ?? "text"}
		aria-describedby={[describedBy, description ? `${id}-description` : undefined].filter(Boolean).join(" ") || undefined}
		{name}
		aria-label={visibleLabel ? undefined : label}
		{placeholder}
		bind:value
		class={cn("w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-4 py-3.5 min-h-11 pl-10 text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_15%,transparent)]", textSize === "body" ? "font-sans text-body" : "font-mono text-sm", className)}
		data-testid={testId}
	/>
	<SearchIcon
		class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
		size={16}
		strokeWidth={1.5}
		aria-hidden="true"
	/>
</div>

{/snippet}

{#if visibleLabel || description}
	<div>
		{#if visibleLabel}<label for={id} class="block mb-2">{label}</label>{/if}
		{@render searchField()}
		{#if description}<p id={`${id}-description`} class="mt-2 text-body">{description}</p>{/if}
	</div>
{:else}
	{@render searchField()}
{/if}
