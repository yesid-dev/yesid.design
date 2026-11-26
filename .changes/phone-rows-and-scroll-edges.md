---
"@yesid/ui": minor
---

`DataTable` `mode: 'rows'` gains phone-row ergonomics while preserving native table semantics:
pass `labels: false` inside `responsive` to omit per-row column labels in compact rows (default
`true`), `rowDetail` (a snippet receiving the row `T`) to visually summarize the remaining columns
at `<= 28rem`, and `rowEmpty` (a predicate on `T`) to mark no-data rows. In compact rows this
clips the value cell visually so the detail can read inline beside the primary cell. Sortable
column headers stay visible, keyboard-accessible and wrap in compact rows. Original value and
detail cells stay in the accessible table, and their controls become visible on focus.

`filterCountText` and `FilterSummary` now format `{count}` with `new Intl.NumberFormat(locale)`
(for example `8,630` in English and `8 630` with a narrow no-break space in French) while still
selecting singular or plural from the raw count. Output text changes for counts of 1,000 or more;
consumers passing pre-formatted templates can revert to raw `{count}` templates.

`HourGrid` and `DataTable` `mode: 'scroll'` now show token-based edge fades on each side where more
content is hidden (updating on scroll and resize, absent when nothing overflows, hidden under
forced colours and contained within the scroll container) and accept `initialScroll: 'end'`
(default `'start'`) to open with the latest columns in view from first paint without jumping after
hydration. HourGrid limits both fades to the space beside the sticky row heading. The DataTable
frame remains the scrollport, with its caller-supplied attributes and a caption-named keyboard stop
available from first render when it may overflow. Outside the scroll region, DataTable applies the
caller's `role`, `aria-label` and `tabindex` to its frame.

An overflowing DataTable frame adds an `aria-hidden` fade wrapper with two spans after the table.
They ignore pointer events and take no layout space. For frame child selectors, use
`> [data-slot="data-table"]` to target the table across widths. `> table:last-child` only matches
when the frame has no fade wrapper.
