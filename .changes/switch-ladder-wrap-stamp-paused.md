---
"@yesid/ui": minor
---

- Use `Switch` from `@yesid/ui/switch` in place of a Button with `role="switch"`. Pass a localized `label` and `stateLabels={{ on, off }}`, then use `bind:checked` or `checked` with `onCheckedChange` in place of the old click handler and ARIA state.
- StopLadder keeps stop names and readings side by side. Labels wrap between words, with a break inside a word only when it exceeds the available width. The Gallery regressions cover the narrow French record ladder and label overflow at 320 and 390 px with 200% text.
- Pass `paused` to a live Stamp with your localized paused `label` to show a neutral pause mark and stop the clock-driven wording until live updates resume.
