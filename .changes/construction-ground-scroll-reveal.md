---
"@yesid/ui": patch
---

`ConstructionGround` now starts sliding the artwork into view when the collapsed floor reaches the
active viewport's bottom edge. The floor grows over one ground height of scroll and keeps the
footer below the screen during the reveal. Gallery browser assertions cover both the fixture
headroom and a spread ground with a moving floodlight at phone and desktop sizes.
