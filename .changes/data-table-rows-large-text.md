---
"@yesid/ui": patch
---

Keep long names and route plates readable in DataTable `rows` mode with enlarged text. When the table is at most 14rem wide, the primary column takes the whole row and the value moves below it, start-aligned, before the details. Names no longer overlap the value, and a 3-digit route plate stays on one line. Tables wider than 14rem, including a 320px phone at default text size, keep the value beside the primary. Row headers, values and their reading order are unchanged.
