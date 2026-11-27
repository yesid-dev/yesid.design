---
"@yesid/ui": patch
---

Closed compact SurfaceRail sheets stay mounted and are explicitly hidden from the accessibility
tree. A unit test verifies that a closed sheet exposes no dialog role and opening it restores the role.
