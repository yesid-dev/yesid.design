---
"@yesid/ui": patch
---

`SiteHeader` keeps its pill invisible until the browser has parsed all of it. A slow load could
paint the pill while the parser was still reading it, then widen the centred pill from both sides
as the theme, language and menu controls arrived, a layout shift before hydration. The pill now
appears once, complete and in its final place, as soon as its markup has been read. No migration.
