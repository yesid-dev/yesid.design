---
"@yesid/ui": minor
---

Use `<Combobox searchable={false} ...>` to replace a local button list for short, fixed choices.
Pass options with `value` and `label`, keep the same `value` binding, and supply an accessible
`label`. The button opens the list without bringing up the phone keyboard, keeps the chosen
value when selected again, and wraps labels when space is tight.

Overflowing tooltips leave caret and value navigation keys to text-entry triggers.
