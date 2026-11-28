---
"@yesid/ui": patch
---

`DayStrip` tiles now have one width on every row. The tiles in a wrapped last row no longer stretch
wider than those above. The smallest tile is 3.3rem (was 2.3rem), and a tile no longer widens to fit
its own figure, so a narrow strip can hold fewer days per row: a week stays on one row from 394px of
strip width at the default text size. In a parent that sizes to its content, the strip takes its width from its key and may use more rows. No API change and no
migration. A product that replaced a wrapped strip with its own layout for this reason can drop it.
