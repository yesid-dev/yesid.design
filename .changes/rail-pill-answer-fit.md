---
"@yesid/ui": patch
---

SurfaceRail's floating pill keeps the label visible first. It truncates or hides the summary on narrow layouts while keeping the full summary in the button's accessible name. Remove local rules that omit the summary below a narrow shell.

AnswerLead keeps figures and their units together on one line. In browsers with CSS fitting
support, oversized figures scale down to fit from first render, including with JavaScript
disabled. Remove local `--text-heading` caps used to fit AnswerLead figures in those browsers.
