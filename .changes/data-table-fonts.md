---
"@yesid/ui": minor
---

`DataTable` columns take `font: 'mono' | 'body'`; `body` sets that column's body cells in the body
font, and numeric columns keep tabular figures. The CSS custom property `--data-table-header-font`
sets the font of header cells and of the labels beside stacked and compact-row values. Without
either, tables render as before. No migration. A product that wrapped words or headers in its own
font classes can drop them.
