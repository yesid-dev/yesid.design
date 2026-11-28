---
"@yesid/ui": patch
---

`StopLadder` now shows its threshold label at the foot of the threshold line instead of in the
column headings. The label follows the line and stays on one line unless it is wider than the room
the ladder has for it. A ladder with no stops draws no line and now shows no label either. No API
change and no migration.
