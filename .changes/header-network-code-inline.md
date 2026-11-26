---
"@yesid/ui": patch
---

`SiteHeader` with a `NetworkPicker` in its `network` snippet: from 1024 px, when the selected network's full name does not fit beside the links, the picker now shows its short code in the pill instead of moving below it. The row below the pill, which adds height to the header, is used only when the code does not fit either. Widening the header brings the full name back. The select keeps its accessible name and focus, and no props change.
