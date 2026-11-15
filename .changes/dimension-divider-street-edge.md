---
"@yesid/ui": minor
---

The dimension-line divider and the footer street edge (D22, owner ruling of 15 November 2026).
Every new option keeps today's output by default; the one behaviour change is the footer's top
edge, listed below.

New options:

- `Separator` `variant="dimension"`: THE divider, a drafting dimension line in the blueprint ink
  (`--primary` at 70%), a 1px hairline with 9px end ticks and 5px scale ticks every 80px, full
  width, horizontal only, decorative (`aria-hidden="true"`, `role="none"`) and static. The
  `SeparatorVariant` type gains `'dimension'`.
- `base.css`: `.dimension-line` draws that line for server-rendered markup.
- `PageSections` and `PageSection` from `@yesid/ui/layout` (with `PageSectionsProps` and
  `PageSectionProps`): the placement rule without page CSS. Every registered section but the last
  ends with the line, drawn as a real row between two sections, outside both sections' boxes, so
  nothing a section paints can cover it. Wrappers between them do not matter; plain `<section>`s
  and nested `PageSection`s do not register; nothing sits before the footer. Inside a registered
  section the kit's edge rules (Masthead's and ErrorPage's tape, DetailFrame's rule without a
  header, now marked `data-edge-rule`) are hidden, so the stroke is never doubled.
- `DetailFrame` `rule="dimension"`; `ListingFrame` `rule` (`hazard`, `line` or `dimension`;
  without it each presentation keeps its rule, and `dimension` also replaces the dashed rule above
  the desktop search); `TerminalPanel` and `CodeBlock` `rule` (`hazard` default or `dimension`);
  `Masthead` and `ErrorPage` `tape="dimension"`. Hazard tape stays every default.

Behaviour change for existing callers (owner-approved, see DEPRECATION.md):

- `SiteFooter`'s top edge is the street edge instead of the 3px hazard strip: one dashed line,
  4px tall, edge to edge, whose 20px dashes alternate yellow (`--hazard-a`) and white
  (`--reflective`) with 20px gaps, with a hairline on the white dashes so they read on the light
  footer. The footer keeps its background in both themes. `.footer-gradient-sep` is gone; the edge
  is `[data-slot="footer-street-edge"]`. No prop, type or export changes.

Migration: products need no code change for the footer; drop any CSS or test that targets
`.footer-gradient-sep`. To adopt the divider, replace page-drawn section rules (hazard
`Separator`s between sections, dashed or solid lines) with `PageSections` and `PageSection`, and pass `rule="dimension"` or `tape="dimension"` where a frame or panel draws hazard
tape as a divider. Remove any divider placed just above the footer.
