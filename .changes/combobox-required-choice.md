---
"@yesid/ui": minor
---

`Combobox` accepts `clearable={false}` for a choice that must always keep a value, such as the
measure a list is ranked by. In that mode it renders no clear button and needs no `clearLabel`.
Escape, Backspace and Delete never empty the choice, picking the chosen option again keeps it,
and closing the list restores the chosen label even after the field was emptied. Typing still
filters and picking another option still changes the value. The component never sets `value` to
`null` in this mode, so seed it with the current choice.

Existing callers need no change. `clearable` defaults to `true`, where `clearLabel` stays
required and the markup, styles and behaviour are unchanged. `ComboboxProps` gains the optional
`clearable` prop and keeps `clearLabel` required; the new `ComboboxNonClearableProps` types the
`clearable={false}` mode.
