---
"@yesid/ui": minor
---

Add optional `MetricDisplay labelRole="reading"` to use the existing sentence-case Inter
label role independently of the figure's tone. The default remains the uppercase metric label.
Add optional `RailTitle horizontalSize` for phone/tablet headings and the desktop horizontal
fallback; rotated `size` and every existing default remain unchanged. Products can request
`horizontalSize="2rem"` for a 32px heading at a 16px root without overriding component styles.
