---
"@yesid/ui": minor
---

`ConstructionGround` fixtures can now stand above the ground, so a tall floodlight beam need not be
cut at it. Set `--construction-ground-headroom` (default `0px`) to the height your fixtures use above
the ground and reserve that space above it. Over the last 20% of the reveal the clip opens upward to
that height, in step with scrolling; under reduced motion, without JavaScript and once opened by
focus or keys it is fully open. `--ground-progress` is now a supported CSS custom property inside
`fixtures`: the reveal from 0 to 1. Without a headroom, fixtures stay clipped to the ground as
before, and without `fixtures` markup and rendering are unchanged. A product that hid the ground's
clip with its own style should set the headroom instead.
