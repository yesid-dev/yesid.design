---
"@yesid/ui": minor
---

Use the body font for Combobox and Clear filters labels. Centre status
glyphs on the label capitals and give the header menu's focus ring clearance from the language
toggle. Keep five or more footer link groups together when they fit below the brand. Give notices
with actions their available width, space date ticks below value labels, and shift the leading date
inward when it would run past the chart's left edge. Reflow floating controls summaries at enlarged
text sizes. Hidden live stamp sizing labels reserve width on one line, so only the visible text can
make the stamp taller.

The theme boot script includes the new footer balance rule. If `script-src` pins its hash, use
the updated `hash` in `@yesid/ui/boot.json`.

SiteFooter accepts `--site-footer-tagline-font` for the tagline. It defaults to
`var(--font-mono)`. Set it to `var(--font-body)` to use the body font.

DataTable row headers now respect a column's explicit `font` in standard, stacked and compact
rows. Row-header columns that omit `font` still inherit the surrounding text font.
