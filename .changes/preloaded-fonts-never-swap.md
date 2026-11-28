---
"@yesid/tokens": patch
---

Stop the preloaded Inter and JetBrains Mono latin faces from swapping in after the first paint.
They now use `font-display: optional`, so text no longer moves when a font arrives late. On a slow
first visit, that page view keeps the metric-adjusted fallback, and the next page view uses the
web font. The latin-ext faces, which load only when a page uses them, still swap. No migration.
