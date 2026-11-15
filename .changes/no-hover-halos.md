---
"@yesid/ui": minor
"@yesid/tokens": minor
---

Hover never adds a halo (owner ruling, 15 November 2026: "The only thing that I want to remove on
hover was the halo. That's it."), and hover is identical in light and dark: lift and edge, no shadow
(owner answer A, same day). Owner-approved behaviour change, recorded in DEPRECATION.md under
"Owner-approved behavior changes". No prop, type or export changes.

Removed on hover:

- `Button` `default` and `conversion` at `cta-sm`, `cta` and `cta-lg`: the orange or yellow glow.
  The 1px lift and the colour change stay.
- An `interactive` `Card`: the `--shadow-section` hover shadow, in both themes (an orange glow in
  dark, a dark cast in light). The border firms and the card lifts 1px, as before (no lift under
  reduced motion).
- A hovered `CollapsibleSection`, `SectionCard` or TocNav card heading: the `--shadow-section` shadow
  on the card, in both themes. The border still firms to the section accent and the title still
  turns orange.
- `SiteHeader` nav links and menu labels: the text glow. They still turn orange.

Cards and section headings cast no outer shadow on hover in either theme; the inset bevel is the
same at rest and on hover.

Keyboard focus matches hover (D21): an interactive `Card` lifts 1px and firms its edge when it, an
element inside it, or a whole-card link wrapping it has `:focus-visible`; a section heading button
with `:focus-visible` firms the card edge. The 2px focus ring stays, both themes behave the same, and
reduced motion drops the lift. Unchanged: focus rings (the 2px outline), active-state lamps (the current nav link, menu stop and
menu icon), static artwork glows and every other hover animation.

Deprecated in `@yesid/tokens`, retained with unchanged values and marked `$deprecated` in
`tokens.json`: `--shadow-glow-sm` (and the `shadow-glow-sm` utility), whose only system use was the
call-to-action Button hover, and `--shadow-cta-hover`. No replacement. Earliest removal: v0.46.0
and 90 days after v0.44.0 is published. `DESIGN.md` records the rule and the deprecated tokens.

Migration: drop product rules that add a hover glow or hover shadow, including
`box-shadow: var(--shadow-cta-hover)` and any hover `var(--shadow-section)`; keep the lift, edge or
colour change. Proof: the Gallery `hover-halos` spec fails on the previous source in light and dark
and checks that both themes make the same hover changes; `primitive-cleanup.test.ts` records the two
retired Button classes.
