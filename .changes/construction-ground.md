---
"@yesid/ui": minor
---

Add `ConstructionGround` to `@yesid/ui/brand`, a scroll-revealed ground wrapper around
`ConstructionProps` sized via `--construction-ground-height` (default `240px`) with an optional
`fixtures` snippet for stationary stage pieces. It opens its height with the rising props while
keeping the footer below the viewport, opens synchronously before scroll on focus after the ground
or page-navigation keys (`End`, `PageDown`, `Space`), and renders full height under reduced motion
and SSR/no-JS.
