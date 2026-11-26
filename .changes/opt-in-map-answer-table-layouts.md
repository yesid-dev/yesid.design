---
"@yesid/ui": minor
---

Add four opt-in layout props. Each default keeps the current markup and layout, so no migration
is needed.

- `MapFrame` `fillHeight` (default `false`) drops the 20 rem minimum so the map fills a host with a
  definite height, such as a short landscape phone. `legendSide` (`'end'` by default, or
  `'start'`) docks the compact legend button and card at the start inset.
- `MapLegend` `detailLayout` (`'below'` by default, or `'inline'`) sets each label in semibold
  with its detail after a space on the same line, with no added punctuation. `scalePlacement`
  (`'after-groups'` by default, or `'before-groups'`) renders the scale before the groups.
- `AnswerLead` `layout` (`'threshold'` by default, or `'fit'`) sets the figure beside the sentence
  whenever both fit, at any width; a long figure wraps between whole numbers.
- `DataTable` `rowAlign` (`'top'` by default, or `'middle'`) centres body cells vertically while
  the table keeps table layout; stacked rows and compact rows ignore it.
