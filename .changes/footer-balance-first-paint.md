---
"@yesid/ui": patch
---

Balance desktop footer rows before the first paint. Server-rendered footers use the theme boot
script, and client-rendered footers measure as they connect. If the theme boot CSP hash is pinned
in `script-src`, update it to the new `hash` in `@yesid/ui/boot.json`.
