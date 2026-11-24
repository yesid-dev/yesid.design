---
"@yesid/ui": patch
---

SiteHeader uses its measured picker placement to set desktop document clearance directly. Pages without a network picker avoid the extra style recalculation from a document-wide selector.
