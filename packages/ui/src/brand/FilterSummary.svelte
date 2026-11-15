<!-- Result count for the active filters and a control that clears them. -->
<script lang="ts" module>
	export interface FilterSummaryProps {
		count: number;
		/** Localized templates with a `{count}` placeholder, e.g. `{count} result` / `{count} results`. */
		countLabel: { singular: string; plural: string };
		/** BCP 47 locale for the plural rule; French counts 0 as singular. */
		locale: string;
		clearLabel: string;
		onClear: () => void;
	}

	/**
	 * The count in words, as FilterSummary shows it: `countLabel`'s singular or plural template for
	 * `locale`'s plural rule, with `{count}` filled in. Pass it to ListingFrame's `resultCountText`
	 * so screen readers hear the same words when the count changes.
	 */
	export function filterCountText(
		count: number,
		countLabel: { singular: string; plural: string },
		locale: string,
	): string {
		const singular = new Intl.PluralRules(locale).select(count) === 'one';
		return (singular ? countLabel.singular : countLabel.plural).replace('{count}', String(count));
	}
</script>

<script lang="ts">
	let { count, countLabel, locale, clearLabel, onClear }: FilterSummaryProps = $props();

	const summaryText = $derived(filterCountText(count, countLabel, locale));
</script>

<div class="mb-3 flex items-center gap-2" data-slot="filter-summary">
	<span class="text-xs text-[var(--muted-foreground)]" data-slot="filter-summary-count">
		{summaryText}
	</span>
	<button
		type="button"
		class="tap-feedback inline-flex items-center min-h-11 px-2 font-mono text-caption text-primary underline transition-colors hover:text-[var(--foreground)] active:text-[var(--foreground)]"
		data-slot="clear-filters"
		onclick={onClear}
	>
		{clearLabel}
	</button>
</div>
