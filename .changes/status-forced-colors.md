---
"@yesid/ui": patch
---

In forced colours, StatusDot keeps a visible dot in the system text colour, and the `--dataviz-status-*` tokens resolve to `CanvasText`, so status marks keep their glyph and word without disappearing. Products no longer need their own forced-colours mapping for status marks.
