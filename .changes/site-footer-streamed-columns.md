---
"@yesid/ui": patch
---

`SiteFooter` keeps itself invisible until the browser has parsed all of it, inside or outside
`AppFrame`. When a load painted a partly parsed footer on desktop, each link group that arrived
later narrowed the brand block and moved the groups beside it, a layout shift before hydration.
The footer now appears once, complete and in its final place. No migration.
