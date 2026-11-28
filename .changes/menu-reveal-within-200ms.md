---
"@yesid/ui": patch
---

The SiteHeader menu now lands within 200ms of the tap, measured from the tap: the panel fades and
scales in over 150ms from a CSS starting style as soon as it is inserted, with no timer before it, and
the items no longer stagger in on their own. Reduced motion still shows the menu without movement.
