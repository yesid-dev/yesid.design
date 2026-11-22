<script lang="ts" module>
	export interface DateRange {
		/** Calendar date as YYYY-MM-DD. */
		start: string;
		/** Calendar date as YYYY-MM-DD, inclusive. */
		end: string;
	}

	export interface DateRangePreset extends DateRange {
		/** Unique, nonempty ID. */
		id: string;
		label: string;
	}

	export interface DateRangeSelection extends DateRange {
		presetId?: string;
	}

	export interface DateRangePickerLabels {
		legend: string;
		presets: string;
		custom: string;
		start: string;
		end: string;
		apply: string;
		missing: string;
		bounds: string;
		order: string;
	}

	export interface DateRangePickerProps {
		presets: readonly DateRangePreset[];
		value: DateRangeSelection;
		/** Inclusive calendar bounds as YYYY-MM-DD. */
		min: string;
		max: string;
		labels: DateRangePickerLabels;
		onValueChange: (value: DateRangeSelection) => void;
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '../primitives/button/index.js';

	let { presets, value, min, max, labels, onValueChange }: DateRangePickerProps = $props();
	const id = $props.id();
	let presetId = $derived(presets.find((preset) => preset.id === value.presetId && available(preset))?.id ?? '');
	let start = $derived(value.start);
	let end = $derived(value.end);
	let startInput = $state<HTMLInputElement>();
	let endInput = $state<HTMLInputElement>();
	let error = $state<{ key: 'missing' | 'bounds' | 'order'; field: 'start' | 'end' }>();

	function withinBounds(date: string): boolean {
		return date >= min && date <= max;
	}

	function available(preset: DateRangePreset): boolean {
		return withinBounds(preset.start) && withinBounds(preset.end) && preset.start <= preset.end;
	}

	function selectPreset(id: string): void {
		error = undefined;
		presetId = id;
		start = value.start;
		end = value.end;
		const preset = presets.find((item) => item.id === id);
		if (preset && available(preset)) onValueChange({ start: preset.start, end: preset.end, presetId: id });
	}

	async function apply(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!start || !end) error = { key: 'missing', field: !start ? 'start' : 'end' };
		else if (!withinBounds(start) || !withinBounds(end)) {
			error = { key: 'bounds', field: !withinBounds(start) ? 'start' : 'end' };
		} else if (start > end) error = { key: 'order', field: 'end' };
		else {
			error = undefined;
			onValueChange({ start, end });
			return;
		}
		const input = error.field === 'start' ? startInput : endInput;
		await tick();
		input?.focus();
	}
</script>

<fieldset class="date-range-picker" data-slot="date-range-picker">
	<legend class="label-reading">{labels.legend}</legend>
	{#if presets.length}
		<label>
			<span>{labels.presets}</span>
			<select value={presetId} onchange={(event) => selectPreset(event.currentTarget.value)}>
				{#each presets as preset (preset.id)}
					<option value={preset.id} disabled={!available(preset)}>{preset.label}</option>
				{/each}
				<option value="">{labels.custom}</option>
			</select>
		</label>
	{/if}
	{#if !presetId}
		<form novalidate onsubmit={apply}>
			<label>
				<span>{labels.start}</span>
				<input
					bind:this={startInput} bind:value={start} oninput={() => (error = undefined)}
					type="date" {min} {max} required
					aria-invalid={error?.field === 'start' ? true : undefined}
					aria-describedby={error?.field === 'start' ? id : undefined}
				/>
			</label>
			<label>
				<span>{labels.end}</span>
				<input
					bind:this={endInput} bind:value={end} oninput={() => (error = undefined)}
					type="date" {min} {max} required
					aria-invalid={error?.field === 'end' ? true : undefined}
					aria-describedby={error?.field === 'end' ? id : undefined}
				/>
			</label>
			{#if error}<p {id} role="alert">{labels[error.key]}</p>{/if}
			<Button wrap type="submit" size="cta-sm">{labels.apply}</Button>
		</form>
	{/if}
</fieldset>

<style>
	fieldset, form {
		display: grid;
		min-inline-size: 0;
		max-inline-size: 100%;
		gap: 0.5em;
	}
	fieldset { margin: 0; padding: 0; border: 0; }
	legend { padding: 0; }
	label {
		display: grid;
		min-inline-size: 0;
		gap: 0.25em;
	}
	input, select {
		box-sizing: border-box;
		inline-size: 100%;
		min-inline-size: 0;
		min-block-size: var(--size-tap-min);
		padding: 0.25em 0.5em;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--background);
		color: var(--foreground);
		font: inherit;
		font-size: var(--text-control);
	}
	:global([data-theme='dark']) input { color-scheme: dark; }
	p { color: var(--destructive); }
</style>
