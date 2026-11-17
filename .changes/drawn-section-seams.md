---
"@yesid/ui": patch
---

PageSections hand-drawn boundaries now overlay the exact shared edge of adjacent sections instead of inserting an 8px blank row. The page stroke uses the upper half of a taller canvas so its ink becomes fine and faint where the wave crosses the edge, matching the reference. It remains full width and above section backgrounds; standalone and card separators, dimension and hazard boundaries, content spacing and footer placement keep their existing behavior.
