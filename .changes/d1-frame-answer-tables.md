---
"@yesid/ui": minor
---

Add controls rails to `AppFrame` and a `network` snippet to `SiteHeader`. Use a `ControlsRail`
inside the `controlsRail.rail` snippet for sticky desktop controls and a mobile sheet. Pass
`NetworkPicker` to the header's `network` snippet to show the short code under the compact pill.

Add `AnswerLead` and `Stamp` to `@yesid/ui/brand` for a figure, its explanation, and record or
live freshness. The caller supplies localized copy and uses `null` for a missing figure.

`@yesid/ui/table` adds controlled `DataTable` sorting, incremental paging and compact rows.
Use `ShowMore` for the same paging controls in lists. Existing stacked table labels, wrapping
buttons and day-strip values have more room at enlarged text sizes.
