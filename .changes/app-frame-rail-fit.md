---
"@yesid/ui": patch
---

AppFrame shows its controls and evidence rails beside the content when the frame is at least 64 rem wide. CSS uses the browser's initial text size on the first render. After hydration the layout also responds to page-level root text overrides and frames narrower than the viewport. Compact pills and sheets stay fixed to the viewport.

The compact SiteHeader network slot now sizes to its label within the viewport limit, giving names such as OC Transpo room at enlarged text.

On the wide header the network picker is visually beside search on the first paint. Hydration updates Tab order without shifting the theme and language controls.
