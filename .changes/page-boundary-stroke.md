---
"@yesid/ui": minor
---

PageSections `stroke="continuous"` draws every hand-drawn page boundary, article header edges included,
as one unbroken stroke instead of the pen-lifted segments (`segmented` stays the default). The page
boundary's ink reads `--page-boundary-color` (default `--primary`), so a product can mute it once in its
theme; other hand-drawn lines are unchanged.
