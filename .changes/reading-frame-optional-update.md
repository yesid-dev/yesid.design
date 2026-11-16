---
"@yesid/ui": minor
---

`ReadingFrame` no longer requires `updated`. Omit it when the text has no authored revision date:
the frame renders no update row, time or placeholder, while the title, summary, contents and body
stay the same. Dated callers keep the same markup and strict ISO calendar and time validation.
`null` is not omission and still throws rather than silently dropping the date.
