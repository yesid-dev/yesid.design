---
"@yesid/ui": minor
---

Add a centered Sheet window and responsive sides. Replace a desktop bottom sheet with
`side={{ base: 'bottom', md: 'center' }}` to keep the bottom presentation on phones and
center it from 768px. Use Sheet Header, Body and Footer so long content scrolls within
the window. Set `--sheet-center-width` on Content to widen it. All sides now open and
close with a shorter fade and offset, and respect reduced motion.
