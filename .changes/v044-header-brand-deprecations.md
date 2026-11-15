---
"@yesid/ui": minor
---

Add the Experimental `ProductBrand`, fix SiteHeader's link tiers so the pill toggles always fit,
and start three deprecations (Y-23, Y-26, owner decision of 14 November 2026, DECISIONS.md D19).

- `ProductBrand` (Experimental, `@yesid/ui` and `@yesid/ui/brand`): the still house wordmark, an
  `aria-hidden` divider and the product name as a link, for SiteHeader's and SiteFooter's `brand`
  snippets. Props: `product`, `href`, `houseHref` (required), `houseExternal` (default false),
  `houseLabel`, `current`. The product's copy keeps its case; a long name wraps between words.
- Defect fix, SiteHeader link tiers (found by yesid.dev PR 723): with both toggles in the pill,
  priority 2 links showed from a 500px header, so between 500 and about 527 (EN), 517 (FR) or
  555 (ES) px the pill overflowed the viewport before hydration and without JavaScript, then
  links-fit took every link out at once and the toggles moved. Priority 2 now shows from 600px
  while the toggles are in the pill, and links that do not fit leave a whole priority at a time
  (3, then 2); priority 1 leaves only when it cannot fit alone. Behaviour change: between 500 and
  599px, priority 2 links no longer show beside the toggles. Callers still passing the deprecated
  `compactControls` keep the 500px step below 600px, where their toggles are in the menu.
  Proof: `site-header-pill.spec.ts` and `links-fit.test.ts` fail on the previous source.
- Defect fix, Wordmark: with motion allowed, hydration splits the letters into separate boxes for
  the hover effects, which dropped kerning and ligatures and widened the wordmark (0.375px locally,
  enough in CI to move a centred pill's toggles 1.8px). The letters now render without kerning or
  ligatures from the first paint, as they already did after hydration, so the width holds and the
  toggles stay put. Proof: the hydration case in `site-header-pill.spec.ts` fails before.
- Deprecated, retained and functional: SiteHeader `compactControls` (omit it; the toggles stay in
  the pill at every width), `CornerMeta` and `MetroStation` with their props types (no product
  use; see docs/migrations/decorative-vocabulary.md and docs/migrations/compact-controls.md).
  The Gallery no longer demonstrates compact controls as a pattern, corner notes, the station
  roundel or the mono section overline. Earliest removal: publication plus 90 days and an
  intervening minor.

Migration: omit `compactControls`. To adopt `ProductBrand`, replace a local house-plus-product
cluster with it in the `brand` snippets. ThemeToggle and LanguageToggle are unchanged.
