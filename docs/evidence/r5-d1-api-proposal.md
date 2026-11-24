# D1 API review · v0.55.0

Proposed public API changes against v0.54.0 for Y1, Y2, Y3, Y8, Y9 and Y12 of the Transit design pass. The generated package report will follow the implementation.

## Y1 · AppFrame

```diff
 interface AppFrameProps {
   controls?: Snippet;
+  controlsRail?: Pick<SurfaceRailProps,
+    'rail' | 'label' | 'summary' | 'openAria' | 'closeAria' | 'mobileVisible'>;
 }
```

At 1024 px and up, the controls sit before `main` as a sticky start-side rail, about 17 rem wide, with its own scrolling when needed. Below 1024 px the same controls move into the `SurfaceRail` bottom sheet. In `fullViewport` the rail sits over the content. Only the header and any retained controls strip contribute to `chromeHeight`. If an evidence rail is also present, both mobile triggers remain reachable and their sheets restore focus independently.

## Y2 · AnswerLead

```ts
// New export from @yesid/ui/brand and @yesid/ui.
export interface AnswerLeadProps {
  value: string | null;
  sentence: string;
  absent?: Snippet;
  stamp?: Snippet;
  meta?: Snippet;
  comparison?: string;
  actions?: Snippet;
  size?: 'md' | 'lg';
}
```

The sentence names the section. The figure and sentence use paragraph semantics, sharing `MetricDisplay`'s display typography and accent ink. They sit side by side from 640 px when space permits. At narrow widths and enlarged text they stack. Actions sit beside the content from 1024 px when space permits and follow the metadata when stacked. `null` renders the optional `absent` snippet in the figure's place. A supplied `"0"` remains a real figure.

## Y3 · Stamp

```ts
// New export from @yesid/ui/brand and @yesid/ui.
export interface StampProps {
  kind: 'record' | 'live';
  label: string;
  updatedAt?: Date;
  agoLabel?: (seconds: number) => string;
  late?: boolean;
}
```

Record uses a square. Live uses a dot and late live uses a ring. `label` gives the full localized text, including the stale-since wording when `late` is true. A current live stamp with a valid `updatedAt` and `agoLabel` uses the kit clock after hydration. `agoLabel` returns the full visible label for elapsed whole seconds, clamped at zero. The initial render and incomplete inputs use `label`. The stamp renders ordinary text with a decorative glyph.

## Y8 · DataTable and ShowMore

```diff
 interface DataTableColumn<T> {
+  readonly sortable?: boolean;
 }

 type DataTableResponsive =
   | { mode: 'none' }
   | { mode: 'stack'; at: 'compact' | 'tablet' }
-  | { mode: 'scroll'; minWidth?: string; minWidthCompact?: string };
+  | { mode: 'scroll'; minWidth?: string; minWidthCompact?: string }
+  | { mode: 'rows'; primary: string; value: string };

 interface DataTableProps<T> {
+  readonly sort?: { key: string; direction: 'asc' | 'desc' };
+  readonly onSort?: (key: string) => void;
+  readonly sortLabels?: { by: (column: string) => string };
+  readonly pageSize?: number;
+  readonly pageLabels?: ShowMoreLabels;
 }
```

```ts
// New exports from @yesid/ui/table.
export interface ShowMoreLabels {
  showing: (shown: number, total: number) => string;
  more: (count: number) => string;
}

export interface ShowMoreProps {
  shown: number;
  total: number;
  pageSize: number;
  labels: ShowMoreLabels;
  onMore: (count: number) => void;
}
```

The caller owns row ordering. Sortable columns get a native header button when `onSort` is supplied. The active header exposes `aria-sort`. The header's text names its button by default. `sortLabels.by` lets callers supply a localized action name. Sort controls remain visible in compact modes when enabled.

With a positive whole `pageSize` and `pageLabels`, the table starts at the first page and appends up to one page per activation. It focuses the first new row and resets to page one on a controlled sort change. Callers can key a table by dataset when they want an explicit reset on a new query. `ShowMore` also works with card lists. It exposes a polite count, requests the number of items to reveal and hides its button at the total. Card-list callers own focus after inserting items.

Rows mode uses the supplied column keys for the primary and value positions below the compact breakpoint. Other columns stay available on the secondary line, with their labels. Content can wrap to more lines at enlarged text. The DOM preserves the semantic table and its header associations.

## Y9 · Reflow

Existing `DataTable` stack mode lets long column labels and cell content reflow. Text buttons fit narrow cards and retain their tap target. `DayStrip` wraps cells onto more rows so a localized figure such as `71.5%` stays together. These fixes add no public props.

## Y12 · SiteHeader

```diff
 interface SiteHeaderProps {
   search?: Snippet;
+  network?: Snippet;
 }
```

The header places one network control after the search at desktop widths and below the pill on smaller screens. The same DOM control keeps its focus and state across widths. A `NetworkPicker` in this slot shows its compact label under the pill. The caller still supplies its options and accessible name. Headers that omit the slot keep their existing layout.

## Verification and release

- Gallery coverage for each D1 part in both themes, at 320 px and with 200% text, including axe and keyboard behavior. Exercise the dual rails, the viewport overlay, missing and zero values, stale live stamps, compact table sorting, final-page focus, and header search with a network picker.
- The six contracts come from the structural D1 requirements. The wireframe illustrates their layout without deciding whether it supersedes M1 to M8 for Transit screens.
- Obtain the owner's approval for the generated API report before merging. Rehearse the same v0.55.0 candidate on Transit, yesid.dev and yesid.login before promoting it to stable.
