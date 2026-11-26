---
"@yesid/ui": patch
---

`AnswerLead` and `LanguageToggle` now give screen readers the right names. Their look, position,
props and behaviour are unchanged.

- `AnswerLead` names its section by the whole statement in reading order: the figure, or the
  `absent` snippet's text, then the sentence. Landmark navigation now reads "78 vehicles are
  reporting now." instead of "vehicles are reporting now.", with the figure once. The visible
  figure stays in the reading order. With neither a value nor `absent`, the sentence alone names
  it, as before. Both `layout` modes behave the same.
- `LanguageToggle` is named by where it leads instead of the current language. On an English page
  it reads "Language: Français (EN FR)", with "Français" marked `lang="fr"`, and the link carries
  `hreflang="fr"`. Before, it read "Language: English (EN FR)". It no longer holds a live region,
  so a switch announces nothing on its own; the navigation lifecycle still returns focus to the
  link, which reads its new name. `label` still comes first, so SiteHeader's compact menu name
  still begins with its visible label. `href`, keyboard and focus handling and the navigation
  lifecycle are unchanged.

Tests or scripts that find the language link by its old name need the destination language's
name: `Language: English (EN FR)` on an English page becomes `Language: Français (EN FR)`. A
region looked up by its exact sentence now also starts with the figure.
