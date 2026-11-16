---
"@yesid/ui": minor
---

Owner live QA options, additive with today's defaults unchanged.

- `RailTitle clipAtHeader` (default `true`) opts out of the scroll-applied header clip: the title
  leaves naturally with its section while sticky placement, scrollport fitting, the 12px horizontal
  fallback and sizing stay the same. `ListingFrame clipAtHeader` forwards it to the decorative edge
  title.
- `Separator variant="hand-drawn"`: one static orange pen stroke in the blueprint ink (`--primary`
  through `currentColor`), 8px tall and full width, with no ticks, glow, shadow or animation, for
  the drawn page divider the owner chose.
- `PageSections divider` (`dimension` by default, `hand-drawn` or `hazard`) chooses the boundary
  between registered sections; `PageSection` reads the parent choice and follows a change.
- `SiteFooter edge` (`street` by default, `hazard`) draws the existing hazard strip instead of the
  road marking.
- `TerminalPanel rule="line"` and `CodeBlock rule="line"` draw one solid yellow line
  (`--accent`) in place of the grey title-bar hairline, with no separator; the `.terminal-rule-line`
  root class does the same for server-rendered terminal markup. `hazard` remains the default.
- `SiteHeader` grouped menus lay out as organized columns from 768px and as one column below it.
  Every pill divider, including `ProductBrand`'s inside the pill, uses one `--nav-split-space` on
  both sides (20px, then 10px, 4px and 2px at the phone tiers). A product brand snippet that draws
  its own `|` owns that spacing: use `ProductBrand`, or space it with `var(--nav-split-space)`.
- `Card interactive` lifts and firms on keyboard focus of a product-owned link or control passed
  as children, not only kit components.
