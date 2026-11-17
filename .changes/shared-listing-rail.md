---
"@yesid/ui": minor
---

Export ListingRail from @yesid/ui/layout: the centered left listing rail with its original four-dot clusters and accent. Use its semantic heading mode with titleId for standalone pages, or decorative mode beside a separate accessible/mobile heading. ListingFrame now uses this shared treatment without changing its callers or geometry. clipAtHeader=false preserves natural unclipped departure.

ReadingFrame adds contentsRule="hand-drawn" to replace its contents list's top and bottom solid ink with the existing shared hand-drawn Separator, for built-in and custom contents. The default remains "line" with unchanged markup and behavior; optional update/date validation and contents navigation are preserved.
