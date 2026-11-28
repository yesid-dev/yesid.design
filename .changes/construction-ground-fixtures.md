---
"@yesid/ui": minor
---

`ConstructionGround` fixtures can now stand above the ground. The ground clips them while it is
revealing and, once the reveal finishes, lets them extend upward (its sides still clip), so a tall
floodlight beam is no longer cut at the ground. `--ground-progress` is now a supported CSS custom
property inside `fixtures`: the reveal from 0 to 1, and 1 under reduced motion, without JavaScript
and once opened by focus or keys. Without `fixtures`, markup and rendering are unchanged. A product
that relied on the ground cutting a tall fixture should clip it itself, and one that hid the clip
with its own style can drop that style.
