---
"@yesid/ui": minor
---

`DataTable` `mode: 'rows'` gains phone-row ergonomics while preserving native table semantics:
pass `labels: false` inside `responsive` to omit per-row column labels in compact rows (default
`true`), `rowDetail` (a snippet receiving the row `T`) to render one muted detail line under the
first line in place of the remaining columns at `<= 28rem`, and `rowEmpty` (a predicate on `T`) to
mark no-data rows so their value cell is omitted in compact rows and their detail can read inline
on one line beside the primary cell. Sortable column headers stay available, keyboard-accessible
and cleanly wrapped in compact rows mode, highlighting the active sorted column.

`filterCountText` and `FilterSummary` now format `{count}` with `new Intl.NumberFormat(locale)`
(for example `8,630` in English and `8 630` with a narrow no-break space in French) while still
selecting singular or plural from the raw count. Output text changes for counts of 1,000 or more;
consumers passing pre-formatted templates can revert to raw `{count}` templates.

`HourGrid` and `DataTable` `mode: 'scroll'` now show token-based edge fades on each side where more
content is hidden (updating on scroll and resize, absent when nothing overflows, hidden under
forced colours and contained within the scroll container) and accept `initialScroll: 'end'`
(default `'start'`) to open with the latest columns in view from first paint without jumping after
hydration.
