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
	import { tick, untrack } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { Button } from '../primitives/button/index.js';

	let { presets, value, min, max, labels, onValueChange }: DateRangePickerProps = $props();
	const id = $props.id();
	const committedStart = $derived(value.start);
	const committedEnd = $derived(value.end);
	const committedPreset = $derived(value.presetId ?? '');
	let presetId = $state(untrack(() => committedPreset));
	let start = $state(untrack(() => committedStart));
	let end = $state(untrack(() => committedEnd));
	const activePreset = $derived(presets.find((preset) => preset.id === presetId && available(preset))?.id ?? '');
	let startInput = $state<HTMLInputElement>();
	let endInput = $state<HTMLInputElement>();
	type RangeError = { key: 'missing' | 'bounds' | 'order'; start: boolean; end: boolean };
	let error = $state<RangeError>();
	let announcement = $state('');

	$effect(() => {
		start = committedStart;
		end = committedEnd;
		presetId = committedPreset;
	});

	$effect(() => {
		// Track the committed fields and limits, not the identity of the props object.
		void committedStart;
		void committedEnd;
		void committedPreset;
		void min;
		void max;
		clearError();
	});

	function isCalendarDate(value: string): boolean {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
		const [year, month, day] = value.split('-').map(Number);
		const date = new Date(Date.UTC(2000, 0, 1));
		date.setUTCFullYear(year, month - 1, day);
		return year > 0 &&
			date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
	}

	function withinBounds(date: string): boolean {
		return date >= min && date <= max;
	}

	function available(preset: DateRangePreset): boolean {
		return isCalendarDate(preset.start) && isCalendarDate(preset.end) &&
			withinBounds(preset.start) && withinBounds(preset.end) && preset.start <= preset.end;
	}

	function clearError(): void {
		error = undefined;
		announcement = '';
	}

	function selectPreset(id: string): void {
		clearError();
		presetId = id;
		start = value.start;
		end = value.end;
		const preset = presets.find((item) => item.id === id);
		if (preset && available(preset)) onValueChange({ start: preset.start, end: preset.end, presetId: id });
	}

	function validate(): RangeError | undefined {
		const invalidStart = !isCalendarDate(start);
		const invalidEnd = !isCalendarDate(end);
		if (invalidStart || invalidEnd) {
			return {
				key: 'missing',
				start: invalidStart || !withinBounds(start),
				end: invalidEnd || !withinBounds(end),
			};
		}
		const startOutOfBounds = !withinBounds(start);
		const endOutOfBounds = !withinBounds(end);
		if (startOutOfBounds || endOutOfBounds) return { key: 'bounds', start: startOutOfBounds, end: endOutOfBounds };
		if (start > end) return { key: 'order', start: false, end: true };
	}

	async function apply(): Promise<void> {
		const issue = validate();
		announcement = '';
		error = issue;
		if (!issue) {
			onValueChange({ start, end });
			return;
		}
		await tick();
		if (!error) return;
		(issue.start ? startInput : endInput)?.focus();
		announcement = labels[issue.key];
	}
</script>

<fieldset class="date-range-picker" data-slot="date-range-picker">
	<legend class="label-reading">{labels.legend}</legend>
	{#if presets.length}
		<label>
			<span>{labels.presets}</span>
			<span class="preset-select">
				<select value={activePreset} onchange={(event) => selectPreset(event.currentTarget.value)}>
					{#each presets as preset (preset.id)}
						<option value={preset.id} disabled={!available(preset)}>{preset.label}</option>
					{/each}
					<option value="">{labels.custom}</option>
				</select>
				<ChevronDown class="preset-chevron" size="1em" aria-hidden="true" />
			</span>
		</label>
	{/if}
	{#if !activePreset}
		<div class="custom-dates">
			<label>
				<span>{labels.start}</span>
				<input
					bind:this={startInput} bind:value={start} oninput={clearError}
					type="date" {min} {max} required
					aria-invalid={error?.start ? true : undefined}
					aria-describedby={error?.start ? id : undefined}
				/>
			</label>
			<label>
				<span>{labels.end}</span>
				<input
					bind:this={endInput} bind:value={end} oninput={clearError}
					type="date" {min} {max} required
					aria-invalid={error?.end ? true : undefined}
					aria-describedby={error?.end ? id : undefined}
				/>
			</label>
			{#if error}<p {id}>{labels[error.key]}</p>{/if}
			<Button class="min-h-[var(--size-tap-min)]" wrap type="button" size="cta-sm" onclick={apply}>{labels.apply}</Button>
		</div>
	{/if}
	<span class="sr-only" role="alert" aria-atomic="true">{announcement}</span>
</fieldset>

<style>
	fieldset, .custom-dates {
		display: grid;
		min-inline-size: 0;
		max-inline-size: 100%;
		gap: 0.5em;
	}
	:global([data-slot='app-frame-controls']) .custom-dates {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12em), 1fr));
		gap: 0.25em 0.5em;
		align-items: end;
	}
	.custom-dates > p { grid-column: 1 / -1; }
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
	.preset-select { position: relative; }
	select { padding-inline-end: 2em; }
	.preset-select :global(.preset-chevron) {
		position: absolute;
		inset-inline-end: 0.5em;
		inset-block-start: 50%;
		translate: 0 -50%;
		pointer-events: none;
	}
	:global([data-theme='dark']) input { color-scheme: dark; }
	p { color: var(--destructive); }
</style>
