---
"@yesid/ui": minor
---

Calm reading surfaces, reading labels, chrome clearance and an Experimental reading frame
(Y-6, Y-8, Y-10, Y-21). Every new option keeps today's output by default; the three behaviour
changes are listed below.

New options:

- `Card` `edge="neutral"` draws the edge in `--border` and never adds the orange hover glow;
  `textSize="inherit"` drops the 14px base so text and fields inside keep the page size (16px or
  more). Defaults `edge="brand"` and `textSize="small"` keep today's output.
- `CollapsibleSection` (and the `SectionCard` it renders) `edge`, `edgeWeight` (`heavy` 3px default,
  `regular` 2px, `thin` 1px) and `textSize`. A neutral section edge firms from its heading without
  glow.
- `TocNav` and `TocPill` `counter` (default `true`), and `DetailFrame` `toc.counter`, to drop the
  position on reading pages.
- `base.css`: the `.label-reading` role (Inter, sentence case, muted, 15px) beside `.label-station`,
  which stays for signage; the opt-in `.chrome-clearance` class with `--chrome-clearance-top`,
  `--floating-pill-clearance` and `--floating-pill-stack-clearance`. The section-jump controller
  subtracts a scroller's `scroll-padding-top`, so contents jumps keep the 25% landing line
  (unchanged when no scroll padding is set).
- `ReadingFrame` from `@yesid/ui/layout`, **Experimental**: title, real update date (ISO 8601,
  checked), summary, contents (built-in list from `sections`, or a `contents` snippet) and body, on a
  65 to 70 character measure, with section ids that must be language-independent slugs.
- Documentation: SectionHeading `overline` is signage only; when numbering, hazard tape and artwork
  carry meaning. DESIGN.md records the label roles, the clearance pattern and the hover rule.

Behaviour changes for existing callers:

- Defect fix (Y-6): a `Card` without `interactive` no longer firms its border and adds
  `shadow-section` on hover. `interactive` marks a card that acts, and a static card must not
  suggest an action. Interactive cards are unchanged. Proof: `card.test.ts` and the Gallery
  `/reading-surfaces` spec fail on the previous source. Migration: pass `interactive` to a Card that
  is a whole-card link or button and should react; product rules that already style their own
  linked-card hover keep working.
- Defect fix (Y-10): below 1024px a `TocPill` and a `SurfaceRail` pill on the same page shared one
  spot, so one hid the other. The contents pill now stacks 8px above the rail pill and is hidden
  while the rail sheet is open. Pages with one pill are unchanged. Proof: the Gallery
  `/chrome-clearance` spec fails on the previous source.
- Owner-approved behaviour change (answer B1 2A, 14 November 2026): a hovered section heading turns
  its title orange (`--primary`) instead of yellow (`--accent-text`), because yellow is never
  interactive. Recorded in DEPRECATION.md under "Owner-approved behavior changes". Migration: remove
  product rules that recolour `.section-title` on hover.
