---
"@yesid/ui": minor
---

Use the body font for Combobox and Clear filters labels. Centre status
glyphs on the label capitals and give the header menu's focus ring clearance from the language
toggle. Give five footer link groups their own row at narrow desktop widths. Give notices with
actions their available width, space date ticks below value labels, and reflow floating controls
summaries at enlarged text sizes. Hidden live stamp sizing labels reserve width on one line, so
only the visible text can make the stamp taller.

SiteFooter accepts `--site-footer-tagline-font` for the tagline. It defaults to
`var(--font-mono)`. Set it to `var(--font-body)` to use the body font.

DataTable row headers now respect a column's explicit `font` in standard, stacked and compact
rows. Row-header columns that omit `font` still inherit the surrounding text font.
