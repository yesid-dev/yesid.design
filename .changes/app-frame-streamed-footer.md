---
"@yesid/ui": patch
---

`AppFrame` keeps its footer invisible until the browser has parsed all of it. On a page shorter
than the viewport, a slow device could paint a partly parsed footer at the bottom of the screen
and then grow it upward as the rest of the HTML arrived, a layout shift before hydration. The
footer now appears once, complete and in its final place. Long pages paint as early as before.
No migration.
