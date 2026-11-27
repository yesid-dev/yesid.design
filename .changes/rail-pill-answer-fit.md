---
"@yesid/ui": patch
---

SurfaceRail's floating pill keeps the label visible first. It truncates or hides the summary on narrow layouts while keeping the full summary in the button's accessible name. Remove local rules that omit the summary below a narrow shell.

In browsers with CSS fitting support, AnswerLead keeps each figure and its unit on one line
within its column from first render, including with JavaScript disabled. Figures that fit
keep their normal size. Other browsers use the original size and wrapping rules. Remove local
`--text-heading` caps used to fit AnswerLead figures where CSS fitting is supported.
