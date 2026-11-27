---
"@yesid/ui": minor
"@yesid/tokens": minor
---

Pass `busy` to `Skeleton` for a standalone pulse that respects reduced motion. A busy ancestor
still enables the pulse. The block uses the kit's `rounded-md` radius and the new theme-specific
`--skeleton` fill (`bg-skeleton`) to stay visible on cards and page backgrounds. Use
`DataTable loading` with the real caption, columns and responsive layout to show decorative
placeholder rows, including compact rows and stacked layouts. Set `skeletonRows` to the expected
first-page count when known. The default is four. Keep `ChartFrame` mounted and pass `loading`
to reserve the plot area with a single Skeleton.
