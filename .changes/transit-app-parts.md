---
"@yesid/ui": minor
---

Add `AppFrame`, `DateRangePicker` and `NetworkPicker` from `@yesid/ui/layout`. Compose
`SiteHeader` with a sticky controls row and use `bind:chromeHeight` to reserve its measured
clearance. Add an optional evidence rail that opens in a sheet on phones, and use
`fullViewport` for a map workspace.

Supply localized picker labels, ready date ranges and validation messages, and the network
names and short codes from the consumer. The pill gives `ProductBrand` a full row at narrow
available widths with enlarged text.
