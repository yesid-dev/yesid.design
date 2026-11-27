import type { Component, ComponentProps, Snippet } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { Badge, type BadgeProps } from '@yesid/ui/badge';
import { Button, type ButtonProps } from '@yesid/ui/button';
import { CollapsibleContent } from '@yesid/ui/collapsible';
import type { Combobox as ComboboxPrimitive } from 'bits-ui';
import {
	Combobox,
	type ComboboxNonClearableProps,
	type ComboboxOption,
	type ComboboxSelectOnlyProps,
	type ComboboxProps,
} from '@yesid/ui/combobox';
import { Separator, type SeparatorProps } from '@yesid/ui/separator';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger,
	type SheetCloseProps,
	type SheetContentProps,
	type SheetDescriptionProps,
	type SheetFooterProps,
	type SheetHeaderProps,
	type SheetOverlayProps,
	type SheetPortalProps,
	type SheetRootProps,
	type SheetTitleProps,
	type SheetTriggerProps,
} from '@yesid/ui/sheet';
import {
	ChevronToggle,
	CodeBlock,
	CollapsibleSection,
	CornerMarks,
	ErrorIllustration,
	FilterGroup,
	FilterSection,
	FilterSummary,
	MetricDisplay,
	RailTitle,
	SectionsToggle,
	SearchInput,
	SectionHeading,
	SectionIcon,
	SectionLabel,
	StatusDot,
	StopLabel,
	TerminalCursor,
	TerminalPanel,
	TocNav,
	TocPill,
	filterCountText,
	type CodeBlockProps,
	type CollapsibleSectionProps,
	type ErrorIllustrationProps,
	type FilterGroupProps,
	type FilterSectionProps,
	type FilterSummaryProps,
	type MetricDisplayProps,
	type RailTitleProps,
	type SectionsToggleProps,
	type SearchInputProps,
	type StopLabelProps,
	type TerminalCursorProps,
	type TerminalPanelProps,
	type TocEntry,
	type TocNavProps,
	type TocPillProps,
} from '@yesid/ui/brand';
import {
	ArticleHeader,
	DetailFrame,
	ErrorPage,
	ListingFrame,
	PageSections,
	SiteFooter,
	type ArticleHeaderProps,
	type DetailFrameProps,
	type ErrorPageProps,
	type ListingFrameProps,
	type PageSectionsProps,
	type SiteFooterProps,
} from '@yesid/ui/layout';
import type { HourGridProps } from '@yesid/ui/chart';
import type { DataTableProps, DataTableResponsive } from '@yesid/ui/table';

type BindingsOf<T> = T extends Component<any, any, infer Bindings> ? Bindings : never;

const buttonProps: ButtonProps = {
	type: 'submit',
	form: 'checkout',
	ref: null as HTMLButtonElement | null,
	onclick: (event) => expectTypeOf(event.currentTarget).toMatchTypeOf<HTMLButtonElement>(),
};

const buttonLinkProps: ButtonProps = {
	href: '',
	type: 'text/html',
	target: '_blank',
	disabled: true,
	ref: null as HTMLAnchorElement | null,
	onclick: (event) => expectTypeOf(event.currentTarget).toMatchTypeOf<HTMLAnchorElement>(),
};

// @ts-expect-error anchor-only target requires the href discriminant
const invalidButtonTarget: ButtonProps = { target: '_blank' };
// @ts-expect-error button-only form is invalid on the anchor branch
const invalidButtonForm: ButtonProps = { href: '/products', form: 'checkout' };

const badgeProps: BadgeProps = {
	ref: null as HTMLSpanElement | null,
	onclick: (event) => expectTypeOf(event.currentTarget).toMatchTypeOf<HTMLSpanElement>(),
};

const badgeLinkProps: BadgeProps = {
	href: '',
	target: '_blank',
	ref: null as HTMLAnchorElement | null,
	onclick: (event) => expectTypeOf(event.currentTarget).toMatchTypeOf<HTMLAnchorElement>(),
};

// @ts-expect-error anchor-only target requires the href discriminant
const invalidBadgeTarget: BadgeProps = { target: '_blank' };

const divStopLabel: StopLabelProps = {
	stop: '01',
	onclick: (event) => expectTypeOf(event.currentTarget).toMatchTypeOf<HTMLDivElement>(),
};

const headingStopLabel: StopLabelProps = {
	stop: '01',
	as: 'h1',
	onclick: (event) => expectTypeOf(event.currentTarget).toMatchTypeOf<HTMLHeadingElement>(),
};

const ignoredChildren = (() => undefined) as unknown as Snippet;
// @ts-expect-error StopLabel owns its rendered plate content
const invalidStopChildren: StopLabelProps = { stop: '01', children: ignoredChildren };

type CollapsibleContentProps = ComponentProps<typeof CollapsibleContent>;
// @ts-expect-error CollapsibleContent owns the delegated child snippet
const invalidCollapsibleChild: CollapsibleContentProps = { child: ignoredChildren };

type SectionLabelProps = ComponentProps<typeof SectionLabel>;
type ChevronToggleProps = ComponentProps<typeof ChevronToggle>;
// @ts-expect-error fixed-content brand components do not accept children
const invalidSectionChildren: SectionLabelProps = { text: 'Section', children: ignoredChildren };
// @ts-expect-error the decorative SVG owns its path
const invalidChevronChildren: ChevronToggleProps = { open: false, children: ignoredChildren };
// @ts-expect-error the decorative cursor owns its empty span
const invalidCursorChildren: TerminalCursorProps = { children: ignoredChildren };

const sectionsToggleProps: SectionsToggleProps = {
	copy: {
		collapse: 'Collapse all',
		expand: 'Expand all',
		collapseTitle: 'Collapse every section',
		expandTitle: 'Expand every section',
	},
	collapsed: false,
	onToggle: () => undefined,
	activeEffect: 'glow',
};
type SectionsToggleComponentProps = ComponentProps<typeof SectionsToggle>;
const sectionsToggleComponentProps: SectionsToggleComponentProps = sectionsToggleProps;
// @ts-expect-error visual policy is a closed neutral variant
const invalidSectionsToggleEffect: SectionsToggleProps = { ...sectionsToggleProps, activeEffect: 'pulse' };
const invalidSectionsToggleChildren: SectionsToggleProps = {
	...sectionsToggleProps,
	// @ts-expect-error the package owns the single-button body
	children: ignoredChildren,
};

const tocEntries: TocEntry[] = [
	{ id: 'intro', title: 'Intro', level: 2, badge: { kind: 'number', value: 1 }, children: [] },
];
const tocNavProps: TocNavProps = {
	entries: tocEntries,
	activeId: 'intro',
	heading: 'Contents',
	open: true,
	onNavigate: (id) => expectTypeOf(id).toEqualTypeOf<string>(),
};
const tocPillProps: TocPillProps = {
	entries: tocEntries,
	activeId: 'intro',
	openAria: 'open contents',
	closeAria: 'close contents',
};
// @ts-expect-error the pill's accessible name needs the caller's open copy
const invalidTocPill: TocPillProps = { entries: [], activeId: '', closeAria: 'close contents' };

const collapsibleSectionProps: CollapsibleSectionProps = {
	title: 'Section',
	open: false,
	openSignal: 1,
	headerVariant: 'article-summary',
};
const metricDisplayProps: MetricDisplayProps = {
	value: null,
	label: 'Delay',
	absent: ignoredChildren,
	info: ignoredChildren,
};
type StatusDotComponentProps = ComponentProps<typeof StatusDot>;
type SectionIconComponentProps = ComponentProps<typeof SectionIcon>;
// @ts-expect-error status colors are a closed set
const invalidStatusDotColor: StatusDotComponentProps = { color: 'purple' };
// @ts-expect-error icon names are a closed set
const invalidSectionIcon: SectionIconComponentProps = { name: 'star' };

const filterGroupProps: FilterGroupProps = {
	label: 'Mode',
	items: [{ key: 'bus', label: 'Bus' }],
	activeKey: 'bus',
	allLabel: 'All',
	collapsible: true,
	density: 'spacious',
	onSelect: (key) => expectTypeOf(key).toEqualTypeOf<string | null>(),
};
// @ts-expect-error the reset button copy is the caller's
const invalidFilterGroupAll: FilterGroupProps = { label: 'Mode', items: [], onSelect: () => undefined };
// @ts-expect-error density is a closed set
const invalidFilterDensity: FilterGroupProps = { ...filterGroupProps, density: 'roomy' };
const filterSectionProps: FilterSectionProps = { children: ignoredChildren };
const filterSummaryProps: FilterSummaryProps = {
	count: 2,
	countLabel: { singular: '{count} result', plural: '{count} results' },
	locale: 'en',
	clearLabel: 'Clear',
	onClear: () => undefined,
};
// @ts-expect-error the plural rule needs the caller's locale
const invalidFilterSummary: FilterSummaryProps = { ...filterSummaryProps, locale: undefined };
const countText: string = filterCountText(2, filterSummaryProps.countLabel, 'en');
const railTitleProps: RailTitleProps = { heading: 'Selected work', side: 'right', level: 2, titleId: 'work', dot: true, size: '4rem' };
const railSectionProps: RailTitleProps = { heading: 'About', children: ignoredChildren };
const decorativeRailTitle: RailTitleProps = { heading: 'Catalogue', decorative: true };
const clippedRailTitle: RailTitleProps = { heading: 'About', clipAtHeader: false };
// @ts-expect-error the clipping opt-out is a boolean
const invalidRailClip: RailTitleProps = { heading: 'About', clipAtHeader: 'off' };
// @ts-expect-error the heading is the caller's
const invalidRailTitle: RailTitleProps = { side: 'left' };
// @ts-expect-error a rail title sits on the left or right rail
const invalidRailSide: RailTitleProps = { heading: 'About', side: 'top' };
const searchInputProps: SearchInputProps = { value: '', label: 'Search', placeholder: 'Search' };
// @ts-expect-error the accessible name is the caller's
const invalidSearchLabel: SearchInputProps = { placeholder: 'Search' };

const listingFrameProps: ListingFrameProps = {
	heading: 'Projects',
	subtitle: 'Everything shipped',
	blueprint: ignoredChildren,
	filterLabel: 'Filters',
	filters: ignoredChildren,
	children: ignoredChildren,
	onHeaderMount: (header, frame) => {
		expectTypeOf(header).toEqualTypeOf<HTMLElement>();
		expectTypeOf(frame).toEqualTypeOf<HTMLElement>();
		return () => undefined;
	},
};
// @ts-expect-error the filter toggle copy is the caller's
const invalidListingFrame: ListingFrameProps = {
	heading: 'Projects',
	subtitle: 'Everything shipped',
	blueprint: ignoredChildren,
	filters: ignoredChildren,
	children: ignoredChildren,
};
const listingFrameClip: ListingFrameProps = { ...listingFrameProps, clipAtHeader: false };
// @ts-expect-error the edge-title clipping opt-out is a boolean
const invalidListingFrameClip: ListingFrameProps = { ...listingFrameProps, clipAtHeader: 'off' };

const articleHeaderProps: ArticleHeaderProps = {
	title: 'Reading the line',
	highlight: 'line',
	backHref: '/notes',
	backLabel: 'All notes',
	meta: ['Notes', { text: 'May 2026', datetime: '2026-05', label: 'Published' }],
};
// @ts-expect-error the back link copy is the caller's
const invalidArticleHeader: ArticleHeaderProps = { title: 'Reading the line', backHref: '/notes' };

const detailFrameProps: DetailFrameProps = {
	children: ignoredChildren,
	left: ignoredChildren,
	right: ignoredChildren,
	measure: '46rem',
	toc: {
		entries: tocEntries,
		openAria: 'open contents',
		closeAria: 'close contents',
		onNavigate: (id) => expectTypeOf(id).toEqualTypeOf<string>(),
	},
};
const detailWithoutPill: DetailFrameProps = { children: ignoredChildren, toc: { entries: [] } };
// @ts-expect-error supply both pill labels or neither
const invalidDetailToc: DetailFrameProps = { children: ignoredChildren, toc: { entries: [], openAria: 'Open contents' } };
// @ts-expect-error supply both pill labels or neither
const invalidDetailClose: DetailFrameProps = { children: ignoredChildren, toc: { entries: [], closeAria: 'Close contents' } };

const errorPageProps: ErrorPageProps = {
	status: 404,
	label: 'Not found',
	heading: 'Page not found',
	body: 'This page does not exist.',
	suggestions: [{ href: '/', label: 'Home' }],
};
// @ts-expect-error the page copy is the caller's
const invalidErrorPage: ErrorPageProps = { status: 404 };

const siteFooterProps: SiteFooterProps = {
	brand: ignoredChildren,
	tagline: 'Built in Montreal',
	groups: [{ label: 'Links', links: [{ href: 'https://example.com', label: 'Site', external: true }] }],
	statusPrefix: 'System',
	liveLabel: 'Live',
};
// @ts-expect-error the live lamp needs a screen-reader label
const invalidSiteFooter: SiteFooterProps = { ...siteFooterProps, liveLabel: undefined };
// @ts-expect-error a status prefix must include the live lamp label
const invalidSiteFooterMissingLabel: SiteFooterProps = { brand: ignoredChildren, tagline: 'Built in Montreal', groups: [], statusPrefix: 'System' };
// @ts-expect-error a live label without a status prefix is not a status
const invalidSiteFooterLabel: SiteFooterProps = { brand: ignoredChildren, tagline: 'Built in Montreal', groups: [], liveLabel: 'Live' };
const optionalSiteFooter: SiteFooterProps = { brand: ignoredChildren, tagline: 'Built in Montreal', groups: [], statusStart: ignoredChildren };
const hazardSiteFooter: SiteFooterProps = { ...siteFooterProps, edge: 'hazard' };
// @ts-expect-error the footer edge is a closed set
const invalidSiteFooterEdge: SiteFooterProps = { ...siteFooterProps, edge: 'tape' };
const pageSectionsDivider: PageSectionsProps = { children: ignoredChildren, divider: 'hand-drawn' };
// @ts-expect-error the page divider is a closed set
const invalidPageSectionsDivider: PageSectionsProps = { children: ignoredChildren, divider: 'street' };

const errorIllustrationProps: ErrorIllustrationProps = { code: '404', signLabel: 'SAMPLE' };

const comboboxProps: ComboboxProps = {
	options: [],
	label: 'Choose',
	clearLabel: 'Clear',
	emptyLabel: 'Empty',
	fold: (raw) => raw,
	open: false,
	disabled: true,
	name: 'choice',
	onValueChange: (value) => expectTypeOf(value).toEqualTypeOf<string | null>(),
};
const comboboxBase = { options: [], label: 'Choose', emptyLabel: 'Empty', fold: (raw: string) => raw };
type ComboboxComponentProps = ComponentProps<typeof Combobox>;
const requiredChoiceCombobox: ComboboxNonClearableProps = { ...comboboxBase, clearable: false };
const requiredChoiceWithCopy: ComboboxComponentProps = { ...comboboxBase, clearable: false, clearLabel: 'Clear' };
const explicitClearableCombobox: ComboboxProps = { ...comboboxBase, clearable: true, clearLabel: 'Clear' };
const dynamicClearableCombobox: ComboboxComponentProps = { ...comboboxBase, clearable: Boolean(1), clearLabel: 'Clear' };
// @ts-expect-error the default clear affordance needs caller-owned copy
const unnamedCombobox: ComboboxComponentProps = { ...comboboxBase };
// @ts-expect-error an explicitly clearable combobox also needs caller-owned copy
const unnamedClearableCombobox: ComboboxComponentProps = { ...comboboxBase, clearable: true };
// @ts-expect-error a dynamic flag can show the clear affordance, so it needs copy
const unnamedDynamicCombobox: ComboboxComponentProps = { ...comboboxBase, clearable: Boolean(1) };
// @ts-expect-error ComboboxProps keeps clearLabel required, even with clearable false
const unnamedPropsCombobox: ComboboxProps = { ...comboboxBase, clearable: false };
/** The v0.58.0 `ComboboxProps` interface, frozen: every value it typed must still type-check. */
interface ComboboxPropsV058
	extends Pick<
		ComboboxPrimitive.RootProps,
		'disabled' | 'required' | 'name' | 'open' | 'onOpenChange' | 'onOpenChangeComplete' | 'loop' | 'scrollAlignment'
	> {
	options: readonly ComboboxOption[];
	value?: string | null;
	onValueChange?: (value: string | null) => void;
	label: string;
	placeholder?: string;
	clearLabel: string;
	emptyLabel: string;
	fold: (raw: string) => string;
	class?: string;
}

const separatorDefault: SeparatorProps = { variant: 'default', decorative: true };
const separatorHazard: SeparatorProps = {
	variant: 'hazard',
	hazardSize: 'sm',
	maxWidth: '100%',
	orientation: 'vertical',
	'data-testid': 'hazard',
	ref: null,
};
const separatorGradient: SeparatorProps = {
	variant: 'gradient',
	maxWidth: '60rem',
	'data-slot': 'custom-separator',
};
// @ts-expect-error custom visual variants cannot promise Bits render delegation
const invalidSeparatorChild: SeparatorProps = { variant: 'hazard', child: ignoredChildren };
// @ts-expect-error custom visual variants are always decorative
const invalidSeparatorDecorative: SeparatorProps = { variant: 'gradient', decorative: false };
const separatorDimension: SeparatorProps = { variant: 'dimension', class: 'rule', 'data-testid': 'dimension', ref: null };
// @ts-expect-error the dimension line is horizontal only
const invalidSeparatorDimensionVertical: SeparatorProps = { variant: 'dimension', orientation: 'vertical' };
// @ts-expect-error the dimension line has one look: no width cap, size or label
const invalidSeparatorDimensionLabel: SeparatorProps = { variant: 'dimension', label: 'Section' };
const separatorHandDrawn: SeparatorProps = { variant: 'hand-drawn', class: 'pen', 'data-testid': 'hand-drawn', ref: null };
// @ts-expect-error the hand-drawn line is horizontal only
const invalidSeparatorHandDrawnVertical: SeparatorProps = { variant: 'hand-drawn', orientation: 'vertical' };
// @ts-expect-error the hand-drawn line has one look: no width cap or label
const invalidSeparatorHandDrawnLabel: SeparatorProps = { variant: 'hand-drawn', label: 'Section' };

const terminalLine: TerminalPanelProps = { title: 'Archive', children: ignoredChildren, rule: 'line' };
// @ts-expect-error the terminal rule is a closed set
const invalidTerminalRule: TerminalPanelProps = { title: 'Archive', children: ignoredChildren, rule: 'pen' };
const codeBlockLine: CodeBlockProps = { code: 'SELECT 1', title: 'Query', rule: 'line' };
// @ts-expect-error CodeBlock forwards the same terminal rule set
const invalidCodeBlockRule: CodeBlockProps = { code: 'SELECT 1', title: 'Query', rule: 'pen' };

const sheetRoot: SheetRootProps = { open: false };
const sheetTrigger: SheetTriggerProps = {};
const sheetClose: SheetCloseProps = {};
const sheetPortal: SheetPortalProps = { disabled: true };
const sheetContent: SheetContentProps = {
	children: ignoredChildren,
	portalProps: { disabled: true },
	closeLabel: 'Close panel',
};
const sheetWithoutClose: SheetContentProps = { children: ignoredChildren, showCloseButton: false };
// @ts-expect-error the default visible close button needs caller-owned copy
const unnamedSheet: SheetContentProps = { children: ignoredChildren };
// @ts-expect-error an explicitly visible button also needs caller-owned copy
const unnamedVisibleSheet: SheetContentProps = { children: ignoredChildren, showCloseButton: true };
// @ts-expect-error a dynamic flag can show the button, so it needs copy
const unnamedDynamicSheet: SheetContentProps = { children: ignoredChildren, showCloseButton: Boolean(1) };
const sheetOverlay: SheetOverlayProps = {};
const sheetHeader: SheetHeaderProps = {};
const sheetFooter: SheetFooterProps = {};
const sheetTitle: SheetTitleProps = {};
const sheetDescription: SheetDescriptionProps = {};
const invalidPortalChildren: SheetContentProps = {
	children: ignoredChildren,
	closeLabel: 'Close panel',
	// @ts-expect-error SheetContent owns Portal children
	portalProps: { children: ignoredChildren },
};

describe('public UI prop contracts', () => {
	it('keeps component bindings and named exports explicit', () => {
		expectTypeOf<BindingsOf<typeof Button>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof Badge>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof SearchInput>>().toEqualTypeOf<'value' | 'ref'>();
		expectTypeOf<BindingsOf<typeof FilterGroup>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof FilterSection>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof FilterSummary>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof ListingFrame>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof RailTitle>>().toEqualTypeOf<''>();
		expectTypeOf<ListingFrameProps['resultCountText']>().toEqualTypeOf<string | undefined>();
		expectTypeOf<BindingsOf<typeof ArticleHeader>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof DetailFrame>>().toEqualTypeOf<'activeId'>();
		expectTypeOf<BindingsOf<typeof ErrorPage>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof SiteFooter>>().toEqualTypeOf<''>();
		expectTypeOf<BindingsOf<typeof ErrorIllustration>>().toEqualTypeOf<''>();
		expectTypeOf<NonNullable<ArticleHeaderProps['canvas']>>().toEqualTypeOf<
			Snippet<[HTMLElement | undefined]>
		>();
		expectTypeOf<BindingsOf<typeof Combobox>>().toEqualTypeOf<'value' | 'open'>();
		expectTypeOf<ComboboxPropsV058>().toExtend<ComboboxProps>();
		expectTypeOf<ComboboxProps['clearLabel']>().toEqualTypeOf<string>();
		expectTypeOf<ComboboxComponentProps>().toEqualTypeOf<
			ComboboxProps | ComboboxNonClearableProps | ComboboxSelectOnlyProps
		>();
		expectTypeOf<BindingsOf<typeof Separator>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof Sheet>>().toEqualTypeOf<'open'>();
		expectTypeOf<BindingsOf<typeof SheetTrigger>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof SheetClose>>().toEqualTypeOf<'ref'>();
		// @ts-expect-error Detents require caller-owned handle copy.
		const missingHandle: import('./primitives/sheet/index.js').SheetContentProps = { detents: [{ id: 'peek', size: '120px', label: 'Peek' }], showCloseButton: false, children: ignoredChildren };
		void missingHandle;
		expectTypeOf<BindingsOf<typeof SheetContent>>().toEqualTypeOf<'ref' | 'detent'>();
		expectTypeOf<BindingsOf<typeof SheetOverlay>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof SheetTitle>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof SheetDescription>>().toEqualTypeOf<'ref'>();
		expectTypeOf<BindingsOf<typeof SheetPortal>>().toEqualTypeOf<''>();
		expect(buttonProps.type).toBe('submit');
		expect(buttonLinkProps.href).toBe('');
		expect(badgeProps.ref).toBeNull();
		expect(badgeLinkProps.href).toBe('');
		expect(divStopLabel.stop).toBe('01');
		expect(headingStopLabel.as).toBe('h1');
		expect(filterGroupProps.collapsible).toBe(true);
		expect(filterSectionProps.children).toBe(ignoredChildren);
		expect(filterSummaryProps.locale).toBe('en');
		expect(searchInputProps.value).toBe('');
		expect(articleHeaderProps.highlight).toBe('line');
		expect(detailFrameProps.measure).toBe('46rem');
		expect(errorPageProps.status).toBe(404);
		expect(siteFooterProps.groups[0]!.links[0]!.external).toBe(true);
		expect(errorIllustrationProps.code).toBe('404');
		expect(comboboxProps.open).toBe(false);
		expect(requiredChoiceCombobox.clearable).toBe(false);
		expect(requiredChoiceWithCopy.clearLabel).toBe('Clear');
		expect(explicitClearableCombobox.clearable).toBe(true);
		expect(dynamicClearableCombobox.clearLabel).toBe('Clear');
		expect(separatorDefault.variant).toBe('default');
		expect(separatorHazard.maxWidth).toBe('100%');
		expect(separatorGradient.variant).toBe('gradient');
		expect(separatorDimension.variant).toBe('dimension');
		expect(separatorHandDrawn.variant).toBe('hand-drawn');
		expect(clippedRailTitle.clipAtHeader).toBe(false);
		expect(listingFrameClip.clipAtHeader).toBe(false);
		expect(hazardSiteFooter.edge).toBe('hazard');
		expect(pageSectionsDivider.divider).toBe('hand-drawn');
		expect(terminalLine.rule).toBe('line');
		expect(codeBlockLine.rule).toBe('line');
		expect(sheetRoot.open).toBe(false);
		expect(sheetTrigger).toEqual({});
		expect(sheetClose).toEqual({});
		expect(sheetPortal.disabled).toBe(true);
		expect(sheetContent.closeLabel).toBe('Close panel');
		expect(sheetOverlay).toEqual({});
		expect(sheetHeader).toEqual({});
		expect(sheetFooter).toEqual({});
		expect(sheetTitle).toEqual({});
		expect(sheetDescription).toEqual({});

		type SampleRow = { id: string; name: string; count: number | null };
		const phoneRowsResponsive: DataTableResponsive = { mode: 'rows', primary: 'name', value: 'count', labels: false };
		const scrollEndResponsive: DataTableResponsive = { mode: 'scroll', minWidth: '40rem', initialScroll: 'end' };
		const phoneRowsTable: DataTableProps<SampleRow> = {
			rows: [],
			columns: [],
			key: (row) => row.id,
			caption: 'Sample',
			responsive: phoneRowsResponsive,
			rowDetail: (() => undefined) as unknown as Snippet<[SampleRow]>,
			rowEmpty: (row) => row.count === null,
		};
		const hourGridEnd: HourGridProps = {
			label: 'Hourly',
			columns: [],
			rows: [],
			scale: { label: '', steps: [] },
			stateLabels: { few: '', none: '', unmeasured: '' },
			initialScroll: 'end',
		};
		expect(phoneRowsResponsive.mode).toBe('rows');
		expect(scrollEndResponsive.mode).toBe('scroll');
		expect(phoneRowsTable.caption).toBe('Sample');
		expect(hourGridEnd.initialScroll).toBe('end');
	});
});
