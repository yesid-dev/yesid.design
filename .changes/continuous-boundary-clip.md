---
"@yesid/ui": patch
---

The continuous hand-drawn page boundary (`PageSections stroke="continuous"`) now draws as one
unbroken line. It was clipped to the upper side of the edge like the pen-lifted segments, which cut
the curve wherever it crossed below the edge. The segmented stroke keeps its clip. Products that
removed the clip themselves can drop that override. No migration.
