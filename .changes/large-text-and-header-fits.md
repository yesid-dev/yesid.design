---
"@yesid/ui": patch
---

Keep long words whole with enlarged text on a phone, and keep the SiteHeader brand clear of its controls at 320px. Layouts at the default text size are unchanged.

- `ErrorPage`: the heading steps down to 1.25rem when its content is narrower than 12rem.
- `ReadingFrame` (Experimental): the frame is an inline-size container named `reading-frame`. Below a 12rem measure the title uses `--text-heading` and body `h2` uses `--text-reading-support`. An unnamed `@container` query inside the frame's body now resolves against the frame.
- `CollapsibleSection` with `headerVariant="article-summary"`: the card is an inline-size container named `section-card`. Below 14rem its side inset is 0.5rem and the index or icon sits above a full-width title and subtitle.
- `SiteHeader`: below 360px the divider before the controls stays while no links show, so the brand no longer touches the first control.
