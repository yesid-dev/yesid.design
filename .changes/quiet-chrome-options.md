---
"@yesid/ui": minor
---

SiteFooter `edge="none"` draws no top edge for quiet pages. SegmentedChoice reads its label font from
`--segmented-choice-font` (default the mono font), so a product can switch it once in its theme. The
SiteHeader menu reveal lands within 200ms: the per-item stagger is capped at 50ms and items fade in over
150ms; reduced motion still shows the menu without movement.
