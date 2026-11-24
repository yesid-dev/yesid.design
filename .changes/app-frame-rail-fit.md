---
"@yesid/ui": patch
---

AppFrame shows its controls and evidence rails beside the content at 64 rem. Page-width frames use the viewport width, including its scrollbar, before and after hydration. After hydration the layout also responds to page-level root text overrides and measures narrower frames directly. Compact pills and sheets stay fixed to the viewport.

The compact SiteHeader network slot now sizes to its label within the viewport limit, giving names such as OC Transpo room at enlarged text.

On the wide header the network picker is visually beside search on the first paint. Hydration updates Tab order without shifting the theme and language controls.
