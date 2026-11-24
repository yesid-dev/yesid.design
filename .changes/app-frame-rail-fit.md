---
"@yesid/ui": patch
---

AppFrame shows its controls and evidence rails beside the content when the frame is at least 64 rem wide. Both switch to their compact sheets when enlarged root text leaves less room. CSS selects the layout on the first render and preserves the existing breakpoint at the default text size.

The compact SiteHeader network slot now sizes to its label within the viewport limit, giving names such as OC Transpo room at enlarged text.
