<!--
  A captioned data table built from column definitions and a cell snippet per column. Below a
  breakpoint it either stacks each row into label/value pairs (`stack`) or scrolls sideways
  (`scroll`); a scrolling table that overflows becomes a focusable region named by its caption.
  Attributes go to the frame; `tableClass` styles the table itself.
-->
<script module lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { ShowMoreLabels } from './ShowMore.svelte';

	export type DataTableAlign = 'start' | 'end';
	export type DataTableResponsive =
		| { mode: 'none' }
		| { mode: 'stack'; at: 'compact' | 'tablet' }
		| { mode: 'scroll'; minWidth?: string; minWidthCompact?: string }
		| { mode: 'rows'; primary: string; value: string };

	export interface DataTableColumn<T> {
		readonly key: string;
		readonly header: string;
		readonly align?: DataTableAlign;
		readonly numeric?: boolean;
		readonly width?: string;
		readonly rowHeader?: true;
		readonly sortable?: boolean;
		readonly cell: Snippet<[T]>;
	}

	export interface DataTableProps<T> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		readonly rows: readonly T[];
		readonly columns: readonly DataTableColumn<T>[];
		readonly key: (row: T, index: number) => string;
		readonly caption: string;
		readonly responsive?: DataTableResponsive;
		readonly sort?: { key: string; direction: 'asc' | 'desc' };
		readonly onSort?: (key: string) => void;
		readonly sortLabels?: { by: (column: string) => string };
		readonly pageSize?: number;
		readonly pageLabels?: ShowMoreLabels;
		/** `card` draws a rounded, bordered card around the table. */
		readonly frame?: 'none' | 'card';
		readonly borderCollapse?: 'collapse' | 'separate';
		readonly headerBand?: 'none' | 'terminal';
		readonly tableClass?: string;
		readonly class?: string;
	}

	const DEFAULT_RESPONSIVE: DataTableResponsive = { mode: 'none' };
</script>

<script lang="ts" generics="T">
	import { tick } from 'svelte';
	import ArrowDownUp from '@lucide/svelte/icons/arrow-down-up';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import { cn } from '../cn/index.js';
	import ShowMore from './ShowMore.svelte';

	let {
		rows,
		columns,
		key,
		caption,
		responsive = DEFAULT_RESPONSIVE,
		sort,
		onSort,
		sortLabels,
		pageSize,
		pageLabels,
		frame = 'none',
		borderCollapse = 'collapse',
		headerBand = 'none',
		tableClass,
		class: className,
		...restProps
	}: DataTableProps<T> = $props();

	let frameElement = $state<HTMLDivElement | null>(null);
	let body = $state<HTMLTableSectionElement>();
	let scrollable = $state(false);
	let requestedCount = $state(0);
	let pageContext = '';

	const accessibleCaption = $derived.by(() => {
		const value = caption.trim();
		if (value.length === 0) {
			throw new Error('DataTable caption must be a non-empty string after trimming.');
		}
		return value;
	});
	const stackAt = $derived(responsive.mode === 'stack' ? responsive.at : undefined);
	const rowLayout = $derived(responsive.mode === 'rows' ? responsive : undefined);
	const reflows = $derived(!!stackAt || !!rowLayout);
	const lastDetail = $derived(rowLayout && columns
		.filter(({ key }) => key !== rowLayout.primary && key !== rowLayout.value).at(-1)?.key);
	const tableId = $props.id();
	const rowHeaderColumns = $derived(rowLayout
		? columns.flatMap((column, index) => column.rowHeader ? [index] : [])
		: []);
	const hasSortButtons = $derived(!!onSort && columns.some((column) => column.sortable));
	const paging = $derived(pageLabels && pageSize && pageSize > 0 && Number.isInteger(pageSize) ? pageSize : 0);
	const shown = $derived(paging ? Math.min(Math.max(requestedCount, paging), rows.length) : rows.length);
	const visibleRows = $derived(paging ? rows.slice(0, shown) : rows);
	const scrollMinWidth = $derived(responsive.mode === 'scroll' ? responsive.minWidth : undefined);
	const scrollMinWidthCompact = $derived(
		responsive.mode === 'scroll' ? responsive.minWidthCompact : undefined,
	);

	function columnAlignment(column: DataTableColumn<T>): DataTableAlign {
		return column.numeric ? 'end' : (column.align ?? 'start');
	}

	function rowPosition(key: string): 'primary' | 'value' | undefined {
		if (!rowLayout) return undefined;
		if (key === rowLayout.primary) return 'primary';
		return key === rowLayout.value ? 'value' : undefined;
	}

	$effect.pre(() => {
		const context = `${paging}:${sort?.direction ?? ''}:${sort?.key ?? ''}`;
		if (context !== pageContext) requestedCount = 0;
		pageContext = context;
	});

	async function showMore(count: number): Promise<void> {
		const firstNew = shown;
		requestedCount = shown + count;
		await tick();
		body?.rows[firstNew]?.focus();
	}

	function measure(): void {
		const element = frameElement;
		if (!element || responsive.mode !== 'scroll') {
			scrollable = false;
			return;
		}
		scrollable = element.scrollWidth - element.clientWidth > 1;
	}

	$effect(() => {
		const element = frameElement;
		if (!element) return;
		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		if (element.firstElementChild) observer.observe(element.firstElementChild);
		return () => observer.disconnect();
	});
</script>

{#snippet cellContent(column: DataTableColumn<T>, row: T)}
	{#if reflows}<span class="data-table-stack-label" aria-hidden="true">{column.header}</span>{/if}
	<div class="data-table-cell-content">{@render column.cell(row)}</div>{#if rowLayout && !rowPosition(column.key) && column.key !== lastDetail}
		<span class="data-table-row-separator" aria-hidden="true">&#8288;</span>
	{/if}
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_tabindex (an overflowing table must be keyboard-scrollable) -->
<div
	bind:this={frameElement}
	class={cn('data-table-frame', className)}
	data-slot="data-table-frame"
	{...restProps}
	data-responsive={responsive.mode}
	data-stack-at={stackAt}
	data-sortable={hasSortButtons || undefined}
	data-frame={frame}
	data-collapse={borderCollapse}
	data-header-band={headerBand}
	data-scrollable={scrollable}
	style:--dt-min-width={scrollMinWidth}
	style:--dt-min-width-compact={scrollMinWidthCompact}
	role={scrollable ? 'region' : undefined}
	aria-label={scrollable ? accessibleCaption : undefined}
	tabindex={scrollable ? 0 : undefined}
	onscroll={measure}
>
	<table class={cn('data-table', tableClass)} data-slot="data-table" role={reflows ? 'table' : undefined}>
		<caption class="data-table-caption">{accessibleCaption}</caption>
		<thead role={reflows ? 'rowgroup' : undefined}>
			<tr role={reflows ? 'row' : undefined}>
				{#each columns as column, columnIndex (column.key)}
					{@const direction = sort?.key === column.key ? sort.direction : undefined}
					<th
						scope="col"
						role={reflows ? 'columnheader' : undefined}
						id={rowLayout ? `${tableId}-column-${columnIndex}` : undefined}
						data-column={column.key}
						data-align={columnAlignment(column)}
						data-numeric={column.numeric || undefined}
						data-sortable={column.sortable && hasSortButtons || undefined}
						aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}
						style:width={column.width}
					>
						{#if column.sortable && onSort}
							<button type="button" class="data-table-sort" aria-label={sortLabels?.by(column.header)} onclick={() => onSort?.(column.key)}>
								<span>{column.header}</span>
								{#if direction === 'asc'}<ArrowUp size="1em" aria-hidden="true" />
								{:else if direction === 'desc'}<ArrowDown size="1em" aria-hidden="true" />
								{:else}<ArrowDownUp size="1em" aria-hidden="true" />{/if}
							</button>
						{:else}{column.header}{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody bind:this={body} role={reflows ? 'rowgroup' : undefined}>
			{#each visibleRows as row, index (key(row, index))}
			{@const rowHeaderIds = rowLayout
				? rowHeaderColumns.map((columnIndex) => `${tableId}-row-${index}-${columnIndex}`).join(' ')
				: ''}
				<tr role={reflows ? 'row' : undefined} tabindex={paging ? -1 : undefined}>
					{#each columns as column, columnIndex (column.key)}
						{@const headerId = rowLayout ? `${tableId}-column-${columnIndex}` : undefined}
						{#if column.rowHeader}
							<th
								scope="row"
								role={reflows ? 'rowheader' : undefined}
								id={rowLayout ? `${tableId}-row-${index}-${columnIndex}` : undefined}
								headers={headerId}
								data-column={column.key}
								data-row-position={rowPosition(column.key)}
								data-col={column.header}
								data-align={columnAlignment(column)}
								data-numeric={column.numeric || undefined}
							>
								{@render cellContent(column, row)}
							</th>
						{:else}
							<td
								role={reflows ? 'cell' : undefined}
								headers={headerId && rowHeaderIds ? `${headerId} ${rowHeaderIds}` : headerId}
								data-column={column.key}
								data-row-position={rowPosition(column.key)}
								data-col={column.header}
								data-align={columnAlignment(column)}
								data-numeric={column.numeric || undefined}
							>
								{@render cellContent(column, row)}
							</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
{#if paging && pageLabels}
	<ShowMore {shown} total={rows.length} pageSize={paging} labels={pageLabels} onMore={showMore} />
{/if}

<style>
	.data-table-frame,
	.data-table {
		min-width: 0;
	}

	.data-table-frame {
		width: 100%;
		max-width: 100%;
	}
	.data-table-frame[data-responsive='rows'] { container: yesid-table / inline-size; }

	.data-table-frame[data-responsive='scroll'] {
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		overscroll-behavior-inline: contain;
		touch-action: pan-x pan-y;
	}

	.data-table-frame:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.data-table-frame[data-frame='card'] {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--card);
	}

	.data-table {
		width: 100%;
		margin: 0;
		border-collapse: collapse;
		font-size: var(--text-small);
		overflow-wrap: anywhere;
	}

	.data-table-frame[data-collapse='separate'] .data-table {
		table-layout: fixed;
		border-collapse: separate;
		border-spacing: 0;
	}

	.data-table-frame[data-responsive='scroll'] .data-table {
		min-width: var(--dt-min-width, 100%);
	}

	.data-table-caption {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.data-table-frame[data-header-band='terminal'] .data-table thead {
		background: var(--terminal-chrome);
	}

	.data-table th,
	.data-table td {
		padding: 0.5rem;
		text-align: left;
		vertical-align: top;
	}

	.data-table thead th {
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: var(--text-micro);
		font-weight: 500;
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.data-table tbody th {
		font-weight: 500;
		color: var(--foreground);
	}

	.data-table tbody td {
		font-family: var(--font-mono);
		color: var(--foreground);
	}

	.data-table tbody tr + tr > * {
		border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
	}

	.data-table [data-align='end'] {
		text-align: right;
	}

	.data-table [data-numeric='true'] {
		font-variant-numeric: tabular-nums;
	}

	.data-table-cell-content {
		min-width: 0;
	}

	.data-table-stack-label,
	.data-table-row-separator {
		display: none;
	}

	.data-table-frame[data-responsive='rows'] > .data-table > thead th {
		vertical-align: middle;
		letter-spacing: normal;
		text-transform: none;
	}

	.data-table-sort {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		min-block-size: var(--size-tap-min);
		min-inline-size: var(--size-tap-min);
		max-inline-size: 100%;
		padding-inline: 0.35em;
		font: inherit;
		text-align: start;
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	.data-table-sort :global(svg) { flex: none; }
	.data-table-sort:focus-visible, .data-table tr[tabindex]:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	@media (max-width: 48rem) {
		.data-table-frame[data-responsive='scroll'] .data-table {
			min-width: var(--dt-min-width-compact, var(--dt-min-width, 100%));
		}
	}

	@media (max-width: 28rem) {
		.data-table-frame[data-stack-at='compact'] .data-table,
		.data-table-frame[data-stack-at='compact'] .data-table :is(thead, tbody, tr, th, td) {
			display: block;
			text-align: left;
			white-space: normal;
		}

		.data-table-frame[data-stack-at='compact']:not([data-sortable]) .data-table thead,
		.data-table-frame[data-stack-at='compact'][data-sortable] .data-table thead th:not([data-sortable]) {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		.data-table-frame[data-stack-at='compact'] .data-table tbody tr {
			padding: 0.5rem 0;
			border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
		}

		.data-table-frame[data-stack-at='compact'] .data-table tbody :is(th, td) {
			display: grid;
			grid-template-columns: minmax(0, 0.45fr) minmax(0, 1fr);
			gap: 0.5rem;
			padding: 0.25rem 0;
			border: 0;
		}

		.data-table-frame[data-stack-at='compact'] .data-table-stack-label {
			display: block;
			grid-column: 1;
			font-family: var(--font-mono);
			font-size: var(--text-micro);
			font-weight: 500;
			letter-spacing: var(--tracking-wide);
			text-transform: uppercase;
			color: var(--muted-foreground);
		}

		.data-table-frame[data-stack-at='compact'] .data-table-cell-content {
			grid-column: 2;
		}

		.data-table-frame[data-stack-at='compact'] [data-align='end'] .data-table-cell-content {
			text-align: right;
		}
	}

	@media (max-width: 1023px) {
		.data-table-frame[data-stack-at='tablet'] .data-table,
		.data-table-frame[data-stack-at='tablet'] .data-table :is(thead, tbody, tr, th, td) {
			display: block;
			text-align: left;
			white-space: normal;
		}

		.data-table-frame[data-stack-at='tablet']:not([data-sortable]) .data-table thead,
		.data-table-frame[data-stack-at='tablet'][data-sortable] .data-table thead th:not([data-sortable]) {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		.data-table-frame[data-stack-at='tablet'] .data-table tbody tr {
			padding: 0.625rem 0;
			border-top: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
		}

		.data-table-frame[data-stack-at='tablet'] .data-table tbody :is(th, td) {
			display: grid;
			grid-template-columns: minmax(0, 0.45fr) minmax(0, 1fr);
			gap: 0.5rem;
			padding: 0.25rem 0;
			border: 0;
		}

		.data-table-frame[data-stack-at='tablet'] .data-table-stack-label {
			display: block;
			grid-column: 1;
			font-family: var(--font-mono);
			font-size: var(--text-micro);
			font-weight: 500;
			letter-spacing: var(--tracking-wide);
			text-transform: uppercase;
			color: var(--muted-foreground);
		}

		.data-table-frame[data-stack-at='tablet'] .data-table-cell-content {
			grid-column: 2;
		}

		.data-table-frame[data-stack-at='tablet'] [data-align='end'] .data-table-cell-content {
			text-align: right;
		}

		.data-table-frame[data-stack-at='tablet'][data-frame='card'][data-collapse='separate'] {
			border: 0;
			border-radius: 0;
			background: transparent;
		}

		.data-table-frame[data-stack-at='tablet'][data-frame='card'][data-collapse='separate']
			.data-table
			tbody {
			display: grid;
			gap: 0.75rem;
		}

		.data-table-frame[data-stack-at='tablet'][data-frame='card'][data-collapse='separate']
			.data-table
			tbody
			tr {
			border: 1px solid var(--border);
			border-radius: var(--radius-lg);
			background: var(--card);
		}
	}
	@container yesid-table (inline-size <= 28rem) {
		.data-table-frame[data-responsive='rows'] > .data-table {
			display: block;
			overflow-wrap: normal;
			word-break: normal;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > :is(thead, tbody) {
			display: block;
		}
		.data-table-frame[data-responsive='rows']:not([data-sortable]) > .data-table > thead,
		.data-table-frame[data-responsive='rows'][data-sortable] > .data-table > thead th:not([data-sortable]) {
			position: absolute;
			inline-size: 1px;
			block-size: 1px;
			padding: 0;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
			border: 0;
		}
		.data-table-frame[data-responsive='rows'][data-sortable] > .data-table > thead tr {
			display: flex;
			flex-wrap: wrap;
			gap: 0 0.25rem;
			border-block-end: 1px solid var(--border);
		}
		.data-table-frame[data-responsive='rows'] > .data-table > thead th[data-sortable] {
			width: auto !important;
			min-inline-size: 0;
			padding: 0;
			border: 0;
		}
		.data-table-frame[data-responsive='rows'] .data-table-sort {
			overflow-wrap: normal;
			word-break: normal;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			column-gap: 0.5rem;
			padding-block: 0.25rem;
			padding-inline: 0.5rem;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr + tr {
			border-block-start: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
		}
		/* A zero-height flex item separates the heading pair from the wrapping details. */
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr::after {
			content: '';
			order: 1;
			flex: 0 0 100%;
			block-size: 0;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > :is(th, td) {
			min-inline-size: 0;
			max-inline-size: 100%;
			padding: 0;
			border: 0;
			text-align: start;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='primary'] {
			flex: 1 1 0%;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] {
			order: 1;
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			align-self: start;
			inline-size: max-content;
			max-inline-size: 45%;
			font-weight: 600;
			text-align: end;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] .data-table-cell-content {
			order: -1;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] .data-table-stack-label {
			line-height: 1.25;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > :is(th, td):not([data-row-position]) {
			order: 2;
			display: inline;
			flex: 0 1 auto;
			margin-block-start: 0.125rem;
			color: var(--muted-foreground);
			font-family: inherit;
			font-weight: 400;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > :is(th, td):not([data-row-position])
			:is(.data-table-row-separator, .data-table-cell-content) {
			display: inline;
		}
		/* The word joiner keeps the mark on the preceding line. Paint the dot in the column gap. */
		.data-table-frame[data-responsive='rows'] .data-table-row-separator {
			position: relative;
		}
		.data-table-frame[data-responsive='rows'] .data-table-row-separator::after {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0.125em;
			content: '·';
			line-height: 1;
			pointer-events: none;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] .data-table-stack-label,
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > :is(th, td):not([data-row-position]) .data-table-stack-label {
			display: inline;
			color: var(--muted-foreground);
			font-weight: 400;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > :is(th, td):not([data-row-position]) .data-table-stack-label {
			margin-inline-end: 0.35em;
		}
	}
</style>
