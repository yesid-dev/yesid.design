---
"@yesid/ui": minor
---

- Use `Switch` from `@yesid/ui/switch` in place of a Button with `role="switch"`. Pass a localized `label` and `stateLabels={{ on, off }}`, then use `bind:checked` or `checked` with `onCheckedChange` in place of the old click handler and ARIA state.
- StopLadder gives labels more room at narrow widths and large text sizes. Labels wrap between words, and an oversized word can still break to fit. The Gallery regression checks wrapping and horizontal overflow at 390 px with 200% text.
- Pass `paused` to a live Stamp with your localized paused `label` to show a neutral pause mark and stop the clock-driven wording until live updates resume.
