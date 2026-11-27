---
"@yesid/ui": patch
---

SurfaceRail's floating pill keeps the label visible first. It truncates or hides the summary on narrow layouts while keeping the full summary in the button's accessible name. Remove local rules that omit the summary below a narrow shell.

AnswerLead keeps figures and their units together on a single line. It scales a figure down only when it would exceed the available width. Remove local `--text-heading` caps used to fit AnswerLead figures.
