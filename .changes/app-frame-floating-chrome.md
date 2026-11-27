---
"@yesid/ui": patch
---

AppFrame’s chrome is transparent around the header pill. The pill and the optional controls row paint their own backgrounds, and pointer events reach the page through empty chrome. Remove local AppFrame overrides that made the chrome transparent.
