# D2 chart API review · v0.56.0

Proposed additions for Y4–Y7 of the Transit design pass. All four parts and their prop and data types export from `@yesid/ui/chart`, alongside the existing chart parts. The generated API report follows the implementation.

## Y4 · BandBar

```ts
interface BandBarBand {
  id: string;
  label: string;
  share: number;
  valueLabel: string;
  detail?: string;
  status: StatusMarkStatus;
}

interface BandBarProps {
  label: string;
  bands: readonly BandBarBand[];
  rows?: boolean;
  absent?: Snippet;
}
```

The bar uses the supplied order and relative shares. Positive shares below 2% keep a visible minimum. Zero retains its labelled row and uses no track space. The track has 2 px gaps and a single image role named by `label`. The optional description list defaults to visible and uses the kit's status glyph, word and ink with the formatted value and detail. No positive shares renders the supplied `absent` state, with its wording owned by the caller.

## Y5 · HourGrid

```ts
interface HourGridCell {
  text: string;
  level: 0 | 1 | 2 | 3 | 4 | null;
  state?: 'few' | 'none' | 'unmeasured';
  name: string;
}

interface HourGridProps {
  label: string;
  columns: readonly { id: string; label: string }[];
  rows: readonly { id: string; label: string; cells: readonly HourGridCell[] }[];
  scale: { label: string; steps: readonly string[] };
  stateLabels: { few: string; none: string; unmeasured: string };
}
```

The caller supplies one cell per column in column order and five legend labels from level 0 through 4. The chart is a native table with row and column headers inside a labelled, keyboard-scrollable region. Cell text stays compact. The cell exposes `name` as its accessible name and tooltip. Null or an explicit state gets a distinct state treatment and localized wording. A measured level 0 uses the first fill. The existing five neutral heatmap fill and ink pairs supply the monochrome scale in both themes. At narrow widths or enlarged text, overflow stays in the grid region and the row headers remain visible.

## Y6 · RangeMark

```ts
interface RangeMarkProps {
  low: number;
  high: number;
  value: number;
  domain: readonly [number, number];
  reference?: { value: number; label: string };
  label: string;
  caption?: string;
}
```

The inline mark shares the caller's finite, ascending domain. It draws the track, interval, estimate dot and optional dotted reference tick. The caller supplies the full text alternative and may show a caption beneath the graphic. The reference label is revealed on hover and included in the graphic description. The track is one text line high and at least 8 rem where the cell permits. It yields when the available width is smaller to keep table rows within the page at 200% text. When there is no estimate, the caller renders its localized state in place of the mark.

## Y7 · StopLadder

```ts
interface StopLadderStop {
  id: string;
  name: string;
  code?: string;
  href?: string;
  timingPoint?: boolean;
  value: number | null;
  valueLabel: string;
  state?: string;
}

interface StopLadderProps {
  label: string;
  stops: readonly StopLadderStop[];
  max: number;
  threshold?: { value: number; label: string };
  highlight?: { fromId: string; toId: string; label: string };
  columns: { stop: string; value: string };
}
```

A labelled ordered list follows stop order. Each stop has a visible name and value or state, an optional link and code, and a rail marker that distinguishes timing points. Bars share the supplied positive scale and can draw a labelled threshold. A valid highlight covers the span between the named stops and displays its label once. A null value has no bar and uses the supplied state wording or `valueLabel`. A measured zero keeps its supplied value label. On phones the bar sits below the stop name.

## Verification

Gallery pages will show the examples and their missing, too-few and none states, including the caller-provided state for a missing range. Browser checks will verify reflow at 320 px and 200% text, both themes, axe, keyboard scroll for the grid, and the chart names and text alternatives. The November 21 wireframe for the line and rankings screens is the reference. Transit, yesid.dev and yesid.login rehearse the same release candidate.

## D1 style recalculation follow-up

The yesid.dev fixture at 390 px on cold Chromium 147 measured a median of 365 ms in style recalculation at 4× CPU on v0.54.0 and 431 ms on both v0.55.0 candidates. Across the paired timing series, rc.2 reached reel readiness 104 ms later than v0.54.0 at 4× CPU, with a paired interval of +30 to +141 ms. Disabling the two new root selectors did not reduce readiness time in the preliminary probe.

The compiled yesid.dev fixture has 36 stylesheets in each version. After normalizing Svelte scope names, only the root bundle changes. Its additions are the shared clearance and header-network rules and three utility classes. The rail, table rows and DayStrip rules are absent from this fixture. A 12-round cold 4× probe reverted the shared clearance and header-network CSS together in the rc.2 response, while keeping the scripts and the three utilities fixed. Rc.2 took a paired median of 62 ms more style time than v0.54.0 and 74 ms more than the CSS probe (95% bootstrap interval +5 to +250 ms). The probe was 10 ms above v0.54.0 (−48 to +66 ms). The grouped probe narrows the search. Individual rules and a production fix still need verification.

D2 will isolate the CSS cost across the D1 changes and check any fix on the same fixture with paired cold 390 px runs at 4× against v0.54.0. The release evidence will record the measured attribution and either restore the earlier cost or explain the remaining difference in this report and R5.6.
