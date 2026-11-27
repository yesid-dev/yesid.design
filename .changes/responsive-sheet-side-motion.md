---
"@yesid/ui": patch
---

Fix responsive Sheet Content to use the active side's open and close motion. Bottom and right
sheets slide the full panel distance. Centered sheets keep their short fade and 8px offset.
Gallery tests compare the animations with the string sides at phone and desktop widths and verify
reduced motion.
