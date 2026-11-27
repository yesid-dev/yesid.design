<!--
  A captioned data table built from column definitions and a cell snippet per column. Below a
  breakpoint it either stacks each row into label/value pairs (`stack`), reflows into compact rows
  (`rows`), or scrolls sideways (`scroll`); a scrolling table that overflows becomes a focusable
  region named by its caption with edge fades on sides where more content is hidden.
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
		| {
				mode: 'scroll';
				minWidth?: string;
				minWidthCompact?: string;
				/** Which horizontal edge starts in view when the table overflows. Defaults to `'start'`. */
				initialScroll?: 'start' | 'end';
		  }
		| {
				mode: 'rows';
				primary: string;
				value: string;
				/** In-row labels in compact rows. Defaults to `true`. Use `false` to hide all labels or `'details'` to hide the value label. */
				labels?: boolean | 'details';
		  };

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
		readonly loading?: boolean;
		/** Placeholder row count while loading. Defaults to 4. */
		readonly skeletonRows?: number;
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
		/** `middle` centres body cells vertically while cells keep table layout; stacked and compact rows ignore it. */
		readonly rowAlign?: 'top' | 'middle';
		/**
		 * Compact `rows` mode only: one muted detail line rendered under the row's first line in
		 * place of the non-primary, non-value columns when the table is at most 28 rem wide.
		 * Use text that summarizes the original cells, which remain available to assistive technology.
		 */
		readonly rowDetail?: Snippet<[T]>;
		/**
		 * Compact `rows` mode only: marks a row with no data so its value cell is visually clipped and its
		 * detail can read inline beside the primary cell on one line.
		 */
		readonly rowEmpty?: (row: T) => boolean;
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
	import { Skeleton } from '../primitives/skeleton/index.js';
	import {
		attachScrollEdges,
		EMPTY_SCROLL_EDGES,
		type ScrollEdgeState,
	} from '../internal/scroll-edges.js';
	import ShowMore from './ShowMore.svelte';

	let {
		rows,
		columns,
		key,
		caption,
		loading = false,
		skeletonRows = 4,
		responsive = DEFAULT_RESPONSIVE,
		sort,
		onSort,
		sortLabels,
		pageSize,
		pageLabels,
		frame = 'none',
		borderCollapse = 'collapse',
		headerBand = 'none',
		rowAlign = 'top',
		rowDetail,
		rowEmpty,
		tableClass,
		class: className,
		...restProps
	}: DataTableProps<T> = $props();

	let frameElement = $state<HTMLDivElement | null>(null);
	let body = $state<HTMLTableSectionElement>();
	let scrollEdges = $state<ScrollEdgeState>();
	let fadeBounds = $state({ width: 0, height: 0, start: '0px', bottom: '0px' });
	let handleScroll = $state<(() => void) | undefined>(undefined);
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
	const scrollLayout = $derived(responsive.mode === 'scroll' ? responsive : undefined);
	const scrollMode = $derived(responsive.mode === 'scroll');
	const reflows = $derived(!!stackAt || !!rowLayout);
	const scrollRegion = $derived((scrollMode || reflows) && (scrollEdges?.scrollable ?? scrollMode));
	const showStackLabels = $derived(reflows && rowLayout?.labels !== false);
	const hasRowDetail = $derived(!!rowLayout && !!rowDetail);
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
	const placeholderCount = $derived(Number.isSafeInteger(skeletonRows) && skeletonRows >= 0 ? skeletonRows : 4);
	const scrollMinWidth = $derived(scrollLayout?.minWidth);
	const scrollMinWidthCompact = $derived(scrollLayout?.minWidthCompact);
	const initialScroll = $derived(scrollLayout?.initialScroll ?? 'start');

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

	$effect(() => {
		const element = scrollMode || reflows ? frameElement : null;
		if (!element) {
			scrollEdges = undefined;
			handleScroll = undefined;
			return;
		}
		const reflowTable = reflows ? element.firstElementChild : null;
		const controller = attachScrollEdges(element, {
			initialScroll,
			observeContent: !!reflowTable,
			onUpdate(next) {
			scrollEdges = reflowTable && getComputedStyle(reflowTable).display !== 'block' ? EMPTY_SCROLL_EDGES : next;
			},
			onResize() {
				const style = getComputedStyle(element);
				fadeBounds = {
					width: element.clientWidth,
					height: element.clientHeight,
					start: style.paddingInlineStart,
					bottom: style.paddingBlockEnd,
				};
			},
		});
		handleScroll = controller.onScroll;
		return () => {
			controller.destroy();
			handleScroll = undefined;
		};
	});

	const onFrameScroll: HTMLAttributes<HTMLDivElement>['onscroll'] = (event) => {
		handleScroll?.();
		if (!scrollMode) restProps.onscroll?.call(event.currentTarget, event);
	};
</script>

{#snippet cellContent(column: DataTableColumn<T>, entry?: { row: T })}
	{#if showStackLabels && !(rowLayout?.labels === 'details' && rowPosition(column.key) === 'value')}
		<span class="data-table-stack-label" aria-hidden="true">{column.header}</span>
	{/if}
	<div class="data-table-cell-content">{#if entry}{@render column.cell(entry.row)}{:else}{@render placeholder(column.numeric)}{/if}</div>{#if rowLayout && !hasRowDetail && !rowPosition(column.key) && column.key !== lastDetail}
		<span class="data-table-row-separator" aria-hidden="true">&#8288;</span>
	{/if}
{/snippet}

{#snippet placeholder(numeric = false)}
	<Skeleton busy class="data-table-placeholder" style={numeric ? 'inline-size: 3ch' : 'inline-size: 8ch'} />
{/snippet}

{#snippet tableMarkup()}
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
							<button type="button" class="data-table-sort" aria-label={sortLabels?.by(column.header)} disabled={loading} onclick={() => { if (!loading) onSort?.(column.key); }}>
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
			{#if loading}
				{#each { length: placeholderCount } as _}
					<tr aria-hidden="true">
						{#each columns as column (column.key)}
							<svelte:element
								this={column.rowHeader ? 'th' : 'td'}
								aria-hidden="true"
								data-column={column.key}
								data-row-position={rowPosition(column.key)}
								data-col={column.header}
								data-align={columnAlignment(column)}
								data-numeric={column.numeric || undefined}
							>
								{@render cellContent(column)}
							</svelte:element>
						{/each}
						{#if hasRowDetail}
							<td class="data-table-row-detail" aria-hidden="true">{@render placeholder()}</td>
						{/if}
					</tr>
				{/each}
			{:else}
			{#each visibleRows as row, index (key(row, index))}
			{@const rowHeaderIds = rowLayout
				? rowHeaderColumns.map((columnIndex) => `${tableId}-row-${index}-${columnIndex}`).join(' ')
				: ''}
			{@const isRowEmpty = rowLayout ? (rowEmpty?.(row) ?? false) : false}
				<tr
					role={reflows ? 'row' : undefined}
					tabindex={paging ? -1 : undefined}
					data-row-empty={isRowEmpty || undefined}
				>
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
								{@render cellContent(column, { row })}
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
								{@render cellContent(column, { row })}
							</td>
						{/if}
					{/each}
					{#if hasRowDetail && rowDetail}
						<td class="data-table-row-detail" aria-hidden="true">{@render rowDetail(row)}</td>
					{/if}
				</tr>
			{/each}
			{/if}
		</tbody>
	</table>
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
		data-row-align={rowAlign === 'middle' ? 'middle' : undefined}
		data-row-labels={rowLayout?.labels === false ? 'none' : rowLayout?.labels === 'details' ? 'details' : undefined}
		data-has-row-detail={hasRowDetail || undefined}
		data-scrollable={scrollEdges?.scrollable ?? (reflows ? undefined : false)}
		data-scroll-start={scrollEdges?.start || undefined}
		data-scroll-end={scrollEdges?.end || undefined}
		data-initial-scroll={initialScroll === 'end' ? 'end' : undefined}
		style:--dt-min-width={scrollMinWidth}
		style:--dt-min-width-compact={scrollMinWidthCompact}
		role={scrollRegion ? 'region' : restProps.role}
		aria-label={scrollRegion ? accessibleCaption : restProps['aria-label']}
		aria-labelledby={scrollRegion && reflows ? undefined : restProps['aria-labelledby']}
		aria-busy={loading || restProps['aria-busy']}
		tabindex={scrollRegion ? 0 : restProps.tabindex}
		{...(scrollRegion ? { 'data-lenis-prevent': '' } : {})}
		onscroll={scrollMode || reflows ? onFrameScroll : restProps.onscroll}
>
	{@render tableMarkup()}
	{#if scrollEdges?.scrollable}
		<div
			class="data-table-fades"
			aria-hidden="true"
			style:--dt-scroll-width={`${fadeBounds.width}px`}
			style:--dt-scroll-height={`${fadeBounds.height}px`}
			style:--dt-padding-start={fadeBounds.start}
			style:--dt-padding-bottom={fadeBounds.bottom}
		>
			<span class="data-table-scroll-fade data-table-scroll-fade-start" data-slot="scroll-fade-start"></span>
			<span class="data-table-scroll-fade data-table-scroll-fade-end" data-slot="scroll-fade-end"></span>
		</div>
	{/if}
</div>
{#if !loading && paging && pageLabels}
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
	/* The rows frame is its own query container. Allow scrolling until its first measurement. */
	.data-table-frame[data-responsive='rows']:not([data-scrollable]) {
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
	}

	.data-table-frame:is([data-responsive='scroll'], [data-scrollable='true']) {
		--scroll-fade-surface: var(--background);
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		overscroll-behavior-inline: contain;
		touch-action: pan-x pan-y;
	}
	:global([data-slot='card']) .data-table-frame:is([data-responsive='scroll'], [data-scrollable='true']),
	.data-table-frame:is([data-responsive='scroll'], [data-scrollable='true'])[data-frame='card'] {
		--scroll-fade-surface: var(--card);
	}

	.data-table-frame[data-initial-scroll='end']:not([data-scroll-hydrated]) {
		display: flex;
		flex-direction: row-reverse;
	}

	.data-table-frame[data-initial-scroll='end']:not([data-scroll-hydrated]) > .data-table {
		flex: 0 0 auto;
	}

	.data-table-frame:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	/* A zero-size sticky origin stays at the padded content's inline start, even at full scroll. */
	.data-table-fades {
		position: sticky;
		inset-inline-start: 0;
		inline-size: 0;
		block-size: 0;
		z-index: 2;
		pointer-events: none;
	}

	.data-table-scroll-fade {
		display: none;
		position: absolute;
		inset-block-end: calc(-1 * var(--dt-padding-bottom));
		block-size: var(--dt-scroll-height);
		inline-size: min(2rem, calc(var(--dt-scroll-width) * 0.18));
		box-sizing: border-box;
		pointer-events: none;
	}

	.data-table-frame[data-scroll-start='true'] .data-table-scroll-fade-start {
		display: block;
		inset-inline-start: calc(-1 * var(--dt-padding-start));
		border-inline-start: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
		background-image:
			linear-gradient(
				to right,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to right,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}

	.data-table-frame[data-scroll-end='true'] .data-table-scroll-fade-end {
		display: block;
		inset-inline-end: calc(var(--dt-padding-start) - var(--dt-scroll-width));
		border-inline-end: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
		background-image:
			linear-gradient(
				to left,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to left,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}

	.data-table-frame[data-scroll-start='true']:dir(rtl) .data-table-scroll-fade-start {
		background-image:
			linear-gradient(
				to left,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to left,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}

	.data-table-frame[data-scroll-end='true']:dir(rtl) .data-table-scroll-fade-end {
		background-image:
			linear-gradient(
				to right,
				color-mix(in srgb, var(--border) 22%, transparent) 0%,
				transparent 70%
			),
			linear-gradient(
				to right,
				var(--scroll-fade-surface) 0%,
				color-mix(in srgb, var(--scroll-fade-surface) 82%, transparent) 40%,
				transparent 100%
			);
	}

	.data-table-frame[data-frame='card'] {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--card);
	}

	.data-table-frame[data-frame='card'] .data-table-scroll-fade-start {
		border-start-start-radius: calc(var(--radius-lg) - 1px);
		border-end-start-radius: calc(var(--radius-lg) - 1px);
	}

	.data-table-frame[data-frame='card'] .data-table-scroll-fade-end {
		border-start-end-radius: calc(var(--radius-lg) - 1px);
		border-end-end-radius: calc(var(--radius-lg) - 1px);
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

	/* Stacked and compact rows make cells block, grid or flex items, where this has no effect. */
	.data-table-frame[data-row-align='middle'] .data-table tbody :is(th, td) {
		vertical-align: middle;
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
	.data-table :global(.data-table-placeholder) {
		display: inline-block;
		max-inline-size: 100%;
		block-size: 0.7em;
		vertical-align: 0.05em;
	}

	.data-table-stack-label,
	.data-table-row-separator,
	.data-table-row-detail {
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
	.data-table-sort:disabled { cursor: default; }
	.data-table-sort:focus-visible, .data-table tr[tabindex]:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}

	@media (forced-colors: active) {
		.data-table-scroll-fade {
			display: none !important;
		}
	}

	@media (max-width: 48rem) {
		.data-table-frame[data-responsive='scroll'] .data-table {
			min-width: var(--dt-min-width-compact, var(--dt-min-width, 100%));
		}
	}

	@media (max-width: 28rem) {
		.data-table-frame[data-stack-at='compact']:not([data-scrollable]) {
			overflow-x: auto;
			overflow-y: hidden;
			scrollbar-width: thin;
		}

		/* Base styles set overflow-x: auto on tables. Reset it when the table becomes a block. */
		.data-table-frame[data-stack-at='compact'] > .data-table {
			overflow: visible;
		}

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
			overflow-wrap: anywhere;
			word-break: normal;
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
		.data-table-frame[data-stack-at='tablet']:not([data-scrollable]) {
			overflow-x: auto;
			overflow-y: hidden;
			scrollbar-width: thin;
		}

		.data-table-frame[data-stack-at='tablet'] > .data-table {
			overflow: visible;
		}

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
			overflow-wrap: anywhere;
			word-break: normal;
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
			overflow: visible;
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
			max-inline-size: 100%;
			padding: 0;
			border: 0;
		}
		.data-table-frame:is([data-row-labels='none'], [data-row-labels='details'], [data-has-row-detail]) > .data-table > thead th[aria-sort] .data-table-sort {
			color: var(--foreground);
			font-weight: 600;
		}
		.data-table-frame[data-responsive='rows'] .data-table-sort {
			overflow-wrap: anywhere;
			word-break: normal;
		}
		.data-table-frame[data-responsive='rows'] .data-table-sort > span {
			min-inline-size: 0;
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
			/* Keep normal word boundaries, including inside shrink-to-fit cell content. */
			overflow-wrap: anywhere;
			word-break: normal;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='primary'] {
			flex: 1 1 0%;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] {
			order: 1;
			display: flex;
			flex-direction: column;
			/* Keep oversized values reachable from the inline start of the scroll region. */
			align-items: safe flex-end;
			align-self: start;
			inline-size: max-content;
			max-inline-size: 45%;
			font-weight: 600;
			text-align: end;
		}
		.data-table-frame[data-responsive='rows']:is([data-row-labels='none'], [data-row-labels='details']) > .data-table > tbody > tr > [data-row-position='value'] {
			align-self: baseline;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] .data-table-cell-content {
			order: -1;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] .data-table-stack-label {
			line-height: 1.25;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > :is(th, td):not([data-row-position]):not(.data-table-row-detail) {
			order: 2;
			display: inline;
			flex: 0 1 auto;
			margin-block-start: 0.125rem;
			color: var(--muted-foreground);
			font-family: inherit;
			font-weight: 400;
		}
		.data-table-frame[data-has-row-detail] > .data-table > tbody > tr,
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr[data-row-empty] {
			position: relative;
		}
		/* Keep the real cells in the table and reveal their controls when focused. */
		.data-table-frame[data-has-row-detail] > .data-table > tbody > tr > :is(th, td):not([data-row-position], .data-table-row-detail, :focus-within),
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr[data-row-empty] > [data-row-position='value']:not(:focus-within),
		.data-table-frame[data-has-row-detail] > .data-table > tbody > tr > [data-row-position='value']:has(> .data-table-cell-content:empty):not(:focus-within) {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			inline-size: 1px;
			block-size: 1px;
			margin: 0;
			overflow: hidden;
			clip-path: inset(50%);
			pointer-events: none;

			& > .data-table-cell-content {
				display: block;
				inline-size: 1px;
				block-size: 1px;
				white-space: normal;
				overflow-wrap: anywhere;
				overflow: hidden;
			}
		}
		.data-table-frame[data-has-row-detail] > .data-table > tbody > tr > :is(th, td):not([data-row-position], .data-table-row-detail):focus-within {
			flex-basis: 100%;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > .data-table-row-detail {
			display: block;
			order: 2;
			flex: 1 0 100%;
			margin-block-start: 0.125rem;
			color: var(--muted-foreground);
			font-family: inherit;
			font-weight: 400;
			line-height: 1.35;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > .data-table-row-detail:empty {
			display: none;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr[data-row-empty]::after,
		.data-table-frame[data-responsive='rows'][data-has-row-detail] > .data-table > tbody > tr:has(> [data-row-position='value'] > .data-table-cell-content:empty)::after {
			display: none;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr[data-row-empty] > [data-row-position='primary'],
		.data-table-frame[data-responsive='rows'][data-has-row-detail] > .data-table > tbody > tr:has(> [data-row-position='value'] > .data-table-cell-content:empty) > [data-row-position='primary'] {
			flex: 0 1 auto;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr[data-row-empty] > .data-table-row-detail,
		.data-table-frame[data-responsive='rows'][data-has-row-detail] > .data-table > tbody > tr:has(> [data-row-position='value'] > .data-table-cell-content:empty) > .data-table-row-detail {
			order: 1;
			flex: 0 1 auto;
			margin-block-start: 0;
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
	/* At 14rem or less a long name or route plate no longer fits beside the value, so the value moves below the primary. */
	@container yesid-table (inline-size <= 14rem) {
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='primary'],
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr[data-row-empty] > [data-row-position='primary'],
		.data-table-frame[data-responsive='rows'][data-has-row-detail] > .data-table > tbody > tr:has(> [data-row-position='value'] > .data-table-cell-content:empty) > [data-row-position='primary'] {
			flex-basis: 100%;
		}
		.data-table-frame[data-responsive='rows'] > .data-table > tbody > tr > [data-row-position='value'] {
			align-items: flex-start;
			max-inline-size: 100%;
			text-align: start;
		}
	}
</style>
