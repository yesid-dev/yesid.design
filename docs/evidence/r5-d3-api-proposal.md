# D3 map API review · v0.57.0

Proposed changes for Y10–Y11 of the Transit design pass. The generated API report follows implementation.

## Y10 · MapLegend

```diff
 interface MapLegendItem {
   label: string;
   symbol: Snippet;
+  detail?: string;
 }

 interface MapLegendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
   title: string;
-  items: readonly MapLegendItem[];
+  items?: readonly MapLegendItem[];
+  groups?: readonly { title: string; items: readonly MapLegendItem[] }[];
+  scale?: {
+    title: string;
+    steps: readonly { label: string; swatch: string }[];
+    states?: readonly MapLegendItem[];
+  };
+  collapsible?: boolean;
+  open?: boolean; // bindable
+  persistKey?: string;
 }
```

The existing flat list stays valid. When supplied together, the flat items, groups and scale render in that order. Every item uses one 2 rem mark track and one wrapping label track. A detail sits in the same label track as its label. The ordered scale uses caller-supplied CSS colors and readable labels, with the separate states underneath. Large text may reflow the labels below the joined ramp.

With `collapsible` enabled, the title is the disclosure control. It starts open unless `open` or the visitor's saved choice closes it. An optional caller-owned `persistKey` remembers changes for that legend. Storage failure leaves the control usable. Without `collapsible`, the card shows its contents without a disclosure control.

## Y10 · MapFrame

```diff
 interface MapFrameProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
   label: string;
   children: Snippet<[MapViewport]>;
   panel?: Snippet;
   legend?: Snippet;
+  legendLabel?: string;
   details?: { label: string; content: Snippet };
 }
```

`legendLabel` supplies the localized name for the new responsive legend placement. With `legend` and `legendLabel` present, the legend sits below the panel from 1024 px and moves behind a round 44 px button below 1024 px. The button sits above the mobile controls pill and opens a floating card. Escape closes it and returns focus to the button. The map viewport reports the visible trigger or card among its exclusions so consumer labels can stay clear of it. A frame with just `legend` keeps its existing rendering. The November 13 placement decision applies here. The November 21 wireframe supplies the card and row design.

## Y11 · Shared status glyphs

```ts
// New @yesid/ui/brand and @yesid/ui exports.
function statusGlyph(status: StatusMarkStatus): { path: string; viewBox: string };

function statusGlyphSvg(
  status: StatusMarkStatus,
  options: { size: number; ink: string; halo?: string },
): string;
```

The vector path is shared with `StatusMark`. It draws a down triangle for early, a dot for on time, an up triangle for late and a ring for unknown. The standalone SVG has a square size in pixels, with caller-supplied ink and optional outline color. The result is suitable for a map image. The caller provides accessible wording where it displays the mark. `StatusMark` keeps its visible label and detail.

The existing `'severe'` value continues to render its diamond so existing consumers keep working. D3 starts its deprecation. Adopt `'late'` when the product classifies the old severe case as late. Record the release and the earliest eligible removal once the stable publication date is known. Removal follows the 90-day and intervening-minor gates in `DEPRECATION.md`.

## Verification

Gallery covers Live, Stops and Corridors legends from the wireframe in both themes, at 320 px and at 200% text. Browser coverage checks axe, wrapping, the named trigger, focus return, remembered disclosure, and label clearance. A browser comparison checks that the standalone SVG and `StatusMark` produce the same glyph pixels with matching ink and dimensions. The release candidate is rehearsed on Transit, yesid.dev and yesid.login after D2.
