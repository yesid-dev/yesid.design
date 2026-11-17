# Deprecation policy

This policy applies to the public runtime, type and CSS
contracts of the eight released packages. Private Gallery code, test helpers,
and repository-only build internals are not public contracts unless a document
explicitly says otherwise.

## Lifecycle

### Experimental

An Experimental contract is labelled as such in its public documentation and
release notes. It is available for real use, but its shape is still being
validated. An incompatible experimental change waits for a minor release and
includes migration notes. A patch release does not silently reshape or remove
it.

### Stable

A public contract is Stable unless it is explicitly labelled Experimental or
Deprecated. Stable additions may ship compatibly. Incompatible changes enter
the Deprecated stage first; they do not appear without a migration path.

### Deprecated

A Deprecated contract remains functional and documented while consumers move
to its named replacement or migration. The release that starts deprecation
must include a release fragment, changelog entry, affected surface, replacement
path, and earliest eligible removal date.

Stable removal requires both of these gates:

1. at least 90 days have elapsed since the first published deprecation; and
2. the deprecated contract has remained available through at least one
   intervening minor release.

The deprecating minor does not count as the intervening minor. For example, a
contract deprecated in `v0.7.0` must still exist in `v0.8.0`; its earliest
version-eligible removal is `v0.9.0`, and only after the 90-day gate also passes.

## Compatibility rules

Patch releases never intentionally break a documented public contract. This
includes exports and export conditions, TypeScript declarations, Svelte props
and bindings, direct public assets, token names and meanings, and previously valid runtime behavior.

Fixing an implementation defect may change incorrect output, but the release
fragment must identify the corrected contract and the regression proof. If a
contract is unsafe enough that compatibility cannot be preserved, stop release
promotion, document the impact, and use an appropriately reviewed minor or
major transition. There is no hidden patch exception.

Removal evidence belongs in the pull request: the original deprecation release,
dates, intervening minor, migration documentation, API report diff, and focused
consumer or clean-room verification.

## Active deprecations

Publication starts the 90-day gate. These UTC dates come from the immutable stable releases;
the intervening-minor gate above also applies.

| Deprecation release | Published | 90-day gate ends |
| --- | --- | --- |
| [v0.43.0](https://github.com/yesid-dev/yesid.design/releases/tag/v0.43.0) | 2026-11-15 01:56:50 | 2027-02-13 01:56:50 |
| [v0.44.0](https://github.com/yesid-dev/yesid.design/releases/tag/v0.44.0) | 2026-11-15 07:15:18 | 2027-02-13 07:15:18 |

- **SiteFooter `statusPrefix` / `liveLabel`, starting v0.43.0:** Deprecated, retained and
  functional. Migrate to omission or the existing `statusStart` snippet with a real source and
  time. The former pulse is already still. See [footer status](docs/migrations/footer-status.md).
  Earliest removal: publication date plus 90 days and an intervening minor (earliest v0.45.0
  when v0.44.0 retains it), unless the owner waives the gates.
- **SiteHeader `compactControls`, starting v0.44.0:** Deprecated, retained and functional. The
  owner decided on 2026-11-14 that the theme and language toggles sit in the navbar pill at every
  width in every product (`DECISIONS.md` D19). Migration: omit the prop. No replacement API. See
  [compact controls](docs/migrations/compact-controls.md). Earliest removal: publication date
  plus 90 days and an intervening minor (earliest v0.46.0 when v0.45.0 retains it), unless the
  owner waives the gates.
- **`CornerMeta` and `MetroStation` (with `CornerMetaProps` and `MetroStationProps`), starting
  v0.44.0:** Deprecated, retained and functional, from `@yesid/ui` and `@yesid/ui/brand`. No
  product uses them (Y-26). Migration: put essential corner text in the content and drop the
  decoration; use a plain number or `StopLabel` instead of the roundel. No replacement API. See
  [decorative vocabulary](docs/migrations/decorative-vocabulary.md). Earliest removal:
  publication date plus 90 days and an intervening minor (earliest v0.46.0 when v0.45.0 retains
  them), unless the owner waives the gates.
- **`@yesid/tokens` `--shadow-glow-sm` and `--shadow-cta-hover` (with the `shadow-glow-sm`
  utility), starting v0.44.0:** Deprecated, retained and functional, with unchanged values; marked
  `$deprecated` in `tokens.json`. Both exist only to light an element on hover, which the owner
  ruled out on 15 November 2026 (see "Hover halos" below). `glow-sm` lost its only system use,
  the call-to-action Button hover. No replacement: drop the hover shadow (keep `--shadow-cta` or
  no shadow on hover) and keep the lift or colour change. Earliest removal: v0.46.0 and 90 days
  after v0.44.0 is published, unless the owner waives the gates.

## Removals

### Owner-approved behavior changes

- **Footer street edge, owner ruling D22, 2026-11-15 06:42 UTC (corrected 07:05 UTC), planned
  v0.45.0:** `SiteFooter`'s top edge is a road marking instead of the 3px hazard-tape strip: one
  dashed line, 4px tall, edge to edge, whose 20px dashes alternate yellow (`--hazard-a`) and white
  (`--reflective`) with 20px gaps, so one yellow and one white dash every 80px; a hairline in the
  reading ink edges each white dash so it reads on the light footer. Both colours are
  theme-invariant, like paint. The footer keeps its own background in both themes. It is
  decorative (`aria-hidden="true"`, `role="none"`) and still. The strip's class
  `.footer-gradient-sep` is gone; the edge is `[data-slot="footer-street-edge"]`. No prop, type or
  export changes. Every product that renders `SiteFooter` (yesid.dev, yesid.login, Transit) shows
  the new edge with no code change. Migration: drop product CSS or tests that target
  `.footer-gradient-sep` (none found in the three products on 15 November 2026), and never draw a
  divider just above the footer (see `PageSections`). Proof: `SiteFooter.test.ts` and the
  Gallery `/dividers` spec fail on the previous source. Rehearse in all three products.

- **Compact editorial header and listing fixes, owner rulings, 2026-11-15 06:45 UTC and the
  previews' kit gaps, planned v0.45.0:** "Editorial pages: the header section is less tall (less
  vertical padding / empty space; title letter size unchanged)." `ArticleHeader` (both
  presentations) adds no space around the back link, sets the title 4px above what follows, puts
  the `actions` and `controls` snippets in one row group (`data-slot="article-header-acts"`) that
  shares a row where they fit, and keeps a short floor under the last row (12px, 16px from 1024px;
  the reading floor is `clamp(1rem, 0.75rem + 1vw, 1.5rem)`). A case study with proof links and
  Collapse all goes from 254 to 146px at 1440px and from 235 to 131px at 390px in the Gallery; the
  title keeps `--text-title`, and long French and Spanish titles still wrap uncropped at 320px and
  200% text. The back link stays midway between the chrome and the title (`--chrome-gap` keeps its
  meaning). `ListingFrame` no longer draws the dashed rule above the search from 1024px (one line
  parts the header from the list) and its phone Filters button keeps the standard focus ring;
  `SearchInput` shows the standard 2px focus ring instead of its yellow border and glow. No prop,
  type or export is removed. Migration: drop product CSS that re-spaces the header's back link,
  title or action rows, or that targets `.header__actions` / `.header__controls` as direct
  children of the header content (they now sit inside `.header__acts`); drop product rules that
  restore the search glow or hide the Filters button's focus ring. Proof: `header-band.spec.ts`
  and the new `listing-frame.spec.ts` checks fail on the previous source;
  `ArticleHeader.test.ts`, `SearchInput.test.ts` and `ListingFrame.test.ts` pin the rules.
  Rehearse in all three products.

- **Hover halos, owner ruling, 2026-11-15 03:57 UTC, planned v0.44.0:** "The only thing that I
  want to remove on hover was the halo. That's it." Hover no longer adds light around an element.
  Owner answer A, 2026-11-15 05:36 UTC: hover is identical in light and dark. Removed: the
  call-to-action Button glow (`default` and `conversion` at `cta-sm`, `cta` and `cta-lg`); the
  `--shadow-section` hover shadow, in both themes, on an `interactive` Card and on a hovered
  `CollapsibleSection` / `SectionCard` / TocNav card heading; and the text glow on hovered
  `SiteHeader` nav links and menu labels. An interactive Card now lifts 1px (not under reduced
  motion) and firms its edge; a section heading firms the edge and turns its title orange; neither
  casts an outer shadow, and the inset bevel is the same at rest and on hover. Keyboard focus now
  gets the same lift and edge as hover (D21): on an interactive Card, an element inside it or a
  whole-card link that wraps it, and on a section heading button, beside the 2px focus ring; reduced
  motion drops the lift. Every other hover
  effect stays exactly: colour changes, border firming, underlines and the CTA lift. Focus rings,
  active-state lamps (the current nav link, menu stop and icon) and static artwork glows are not
  hover effects and stay. No prop, type or export changes. Migration: drop product rules that add a
  hover glow or hover shadow, including `var(--shadow-cta-hover)` and any hover
  `var(--shadow-section)`; keep the lift, edge or colour change. Proof: the Gallery `hover-halos`
  spec fails on the previous source in both themes; `card.test.ts`, `SectionCard.reading.test.ts`,
  `button.contract.test.ts` and `primitive-cleanup.test.ts` pin the rule. Rehearse in all three
  products.

- **Section title hover, owner answer B1 2A, 2026-11-14, planned v0.44.0:** the colour rule
  says yellow is never interactive, so a hovered collapsible section heading no longer turns its
  title yellow (`--accent-text`); it turns orange (`--primary`), the clickable hue. This covers
  `CollapsibleSection`, `SectionCard` and the TocNav card heading. The heading hover still sets the
  border to the section accent. No prop, type or export changes. Migration: remove product rules
  that recolour `.section-title` on hover to imitate the yellow; a product that wants another hover
  colour styles its own heading. Proof: `SectionCard.reading.test.ts` and the Gallery
  `/reading-surfaces` spec fail on the previous source. Rehearse in all three products.

- **Y-28, answer 9A, 2026-11-13, planned v0.43.0:** the owner approved orange
  underlined text links as a named default look change. Text links (a link without a class)
  now use `--primary`. Remove product rules that colour links yellow; a component that needs
  another link style styles its own. No prop, type or export changes. Rehearse in all three products.

- **Y-30, owner instruction 2026-11-14:** "make sure we're removing the pulsing dots from
  the whole site ... from everywhere." This scoped compatibility exception permits the patch
  to make opt-in gradient Separator, StatusDot `pulse`, TerminalPanel `signal.live` and
  `.led-pulse` still, without a deprecation window. The pulse and live props/types remain
  accepted for compatibility and produce no visual pulse. All exports remain. ErrorIllustration, MetroStation, StopLabel and TerminalCursor
  had default-on decorative loops; their still reduced-motion frames correct the WCAG 2.2.2
  defect. The date and quotation are supplied by the owner brief, not a publication receipt.
  See [inventory and regression proof](docs/migrations/no-endless-decorative-loops.md).

- **2026-11-07:** the owner changed D15's first-visit default from collapsed to expanded on both
  products. A stored `collapsed` choice still collapses content; a missing or malformed choice now
  opens it. Public exports, props and method signatures are unchanged. The boot asset has a new
  CSP hash. See [Remembered sections](docs/migrations/remembered-sections.md#first-visit-opens-content).
- **connect c-10, 2026-11-05:** the owner approved D15's origin-wide remembered bulk choice and
  collapsed first-visit default on both products. This behavior contract ships in a minor bump;
  public exports, props and method signatures stay available. The boot asset has a new CSP hash.
  See [the consumer migration and rehearsal requirements](docs/migrations/remembered-sections.md).
  This source decision does not establish publication or consumer adoption.

### Published removals

- **v0.35.0 (connect c-8 owner exception, 2026-11-04):** the owner approved removing
  the unused contracts listed in the [migration and source evidence](docs/migrations/connect-prune.md)
  without a deprecation window, waiving both the 90-day and intervening-minor gates.
  Card sub-parts, StickyPanel, the color-mix floor engine, the CSP serializer, the token
  parse subpath and unused variant and analytics helper exports leave the public API.
  Card root, config entries, sectionGlow and footer types stay. Published in v0.35.0;
  this entry does not establish consumer adoption.

- **v0.35.0 (connect c-7, owner decision 2026-11-04):** Sheet Content no longer supplies
  an English `Close` label. `closeLabel` is required unless `showCloseButton` is explicitly
  `false`. This is a breaking prop change, approved for the coordinated consumer bump without
  the normal 90-day and intervening-minor gates. The runtime button remains; its copy moves to
  the caller. See [the migration and consumer checks](docs/migrations/connect-module-fixes.md).
  Published in v0.35.0; this entry does not establish consumer adoption.

- **v0.34.0 (D-e owner exception, 2026-11-03):** the owner approved folding
  unused primitive cleanup into the deepen refactor without a deprecation window, waiving
  both normal removal gates. Removed `@yesid/ui/toggle` and `@yesid/ui/toggle-group`, Button
  variants `secondary` / `destructive` / `link`, Button sizes `xs` / `lg` / `icon` / `icon-xs` /
  `icon-sm` / `icon-lg`, Badge variants `secondary` / `ghost` / `link`, Sheet side `left`, unused
  icon/group/invalid-state selectors, the eight sidebar color mappings, exact `--radius`,
  `--secondary` and its `--color-secondary` mapping. No consumer uses the removed primitive
  contracts; FilterGroup retains its behavior directly through bits-ui. Transit's sole exact
  `--radius` reference must move to its identical resolved value, `--radius-md`, before token
  adoption. All declared defaults stay. See the [migration and scan evidence](docs/migrations/deepen-primitives.md).
  Published in v0.34.0; this entry does not establish consumer adoption.

- **v0.33.0 (deepen D-c, owner decision 2026-11-03):** `SiteHeader.navigation`
  changes from raw SvelteKit hooks to the app layout's `createNavigationLifecycle` result;
  `LanguageToggle.onNavigate` is removed; `SiteHeader.labels.menuFooter`,
  `SiteHeader.labels.skipToContent` and `LanguageToggle.names` become required with no built-in
  translated defaults. The owner explicitly requested this breaking migration without a
  deprecation window for the two coordinated consumers, waiving both normal removal gates for
  these contracts. The release fragment and API report travel with the source change.
  The lifecycle adapter optionally accepts `subscribeNavigation` for full redirect continuity.
  Kit 3 consumers omit it: direct language switches still work, while eventless language redirects
  close the menu without locale refocus. No SDK change is required for adoption.
  [The migration](docs/migrations/navigation-lifecycle.md) names both consumers' props and strings.
  Published in v0.33.0; current Kit 3 integrations omit the subscription.
  This entry does not establish consumer adoption.

- **v0.33.0 (section-jump owner exception, 2026-11-03):** the owner-directed
  D-b interface reduction removes `TOC_TARGET_SELECTOR`, `navigateToc`, `observeActiveToc`,
  `onTocNavigate`, `openCollapsedTocTarget`, `reconcileActiveToc`, `revealTocTarget`, `settleLayout`,
  `tocElement` and `RevealTocTargetOptions` from both `@yesid/ui` and `@yesid/ui/brand`, without a
  prior deprecation release. Both the 90-day wait and intervening-minor-release gate are waived
  for this scoped transition. Replacements are `createSectionJump`, `useSectionJump` and `SectionJump`;
  `TocEntry` remains public. The controller owns opening, active tracking, layout settlement,
  cancellation, fragments and the shared landing line. See the
  [section-jump migration](docs/migrations/deepen-section-jump.md) for every removed export,
  its replacement and the read-only consumer caller inventory. Generic history restoration,
  content presence and tab/grain policy remain consumer-owned.

- **v0.33.0 (disclosure owner exception, 2026-11-03):** the owner approved immediate
  removal of the following disclosure contracts, explicitly waiving both the 90-day wait and
  the intervening-minor-release gate. From `@yesid/ui` and `@yesid/ui/brand`, remove
  `QuietModeButton`, `QuietModeButtonProps`, `QuietModeButtonCopy` and `QuietModeActiveEffect`;
  from `@yesid/ui/state`, remove `quietMode` and `QuietModeStore`. Remove `sectionKey` and
  `quiet` from `CollapsibleSection` and `TocNav`, `FilterGroup.persistKey`, and
  `ListingFrame.filterPersistKey`. Remove remembered open/closed state, remembered bulk-collapse
  defaults, the Remember/Forget action and its copy/props, and pre-paint disclosure restoration.
  Retire the public `quiet-mode-controls` / `quiet-mode-toggle` class families and matching test
  ids, `quiet-mode-remember`, `data-remembered`, `data-quiet-mode`, and disclosure boot marks
  (`data-persisted-key`, `data-persisted-body`, `data-quiet`). Replacements are
  `SectionsToggle` / `SectionsToggleProps` / `SectionsToggleCopy` / `SectionsToggleActiveEffect`,
  the in-memory `sections` / `SectionsState` actions, `sections-controls` / `sections-toggle`
  selectors, declared per-mount disclosure defaults, and `openSection(anchor)`. The remembered
  action and boot marks have no replacement; the generic `persisted` store remains available
  for non-disclosure state. The TOC and filter controls remain independent. See the
  [consumer migration](docs/migrations/deepen-disclosure.md) for the full surface and caller list.

- **v0.28.0:** removed the adoption CLI (`tools/adopt.ts` and `tools/adopt/`), its schema-2
  `manifest.json` and the `yesid.dev-design-vX.Y.Z.tar` archive: each package now ships as its own
  release tarball installed by URL. Also removed, with no consumer in either app or the Gallery:
  `@yesid/motion/utils/sectionMagnet` with its root re-exports (`initSectionMagnet`,
  `findSettleTarget`, `DESKTOP_TIER`, `TOUCH_TIER`, `MagnetTier`, `SectionMagnetOpts`,
  `SettleTargetOpts`); the `@yesid/tokens` subpaths `./serialize`, `./types`,
  `./generators/tokens-css`, `./generators/theme-css`, `./generators/motion-ts`, `./src/parse.ts`,
  `./src/generators/tokens-css.ts` and `./src/generators/motion-ts.ts`; `@yesid/seo-kit/satori`;
  `flattenToc`, `landTocFragments` and `resolveTocCounter` from `@yesid/ui` and `@yesid/ui/brand`; and
  `DESKTOP_MIN_WIDTH` from
  `@yesid/ui/state`. None was deprecated first: the owner waived both gates on 2026-10-29, as for
  v0.24.0 and v0.27.0, because there are no third-party consumers and both apps move in the same
  cycle.

- **v0.27.0:** removed `AnalyticsConsent` (with `AnalyticsConsentCopy` and `AnalyticsConsentProps`) from `@yesid/ui/feedback`; the `./consent`, `./policy` and `./plausible` subpaths of `@yesid/analytics`; `createAnalyticsClient`, `createPathnamePageviewTracker`, `AnalyticsClient` and `AnalyticsClientDependencies` from `./client` (replaced by `createAnalytics`); and `AnalyticsStorageKeys` with `AnalyticsPreset`'s `domain` and `storageKeys` from `./config`. None was deprecated first: the owner waived both gates (the 90 days and the intervening minor) on 2026-10-29 for all of them, because there are no third-party consumers and both apps drop consent in the same cycle. Measurement no longer asks, so the consent parts have no replacement.

- **v0.24.0:** removed `@yesid/tokens/generators/theme-block` and its legacy `./src/generators/theme-block.ts`
  alias (`generateThemeBlock`, `replaceThemeRegion`; deprecated in v0.18.0), `MetroStation`'s `roundel`
  snippet (v0.19.0), and `QuietModeInit.storageKey` with `SiteRootProps.quietModeKey` (v0.22.0). Each had
  passed its intervening-minor gate. The owner waived the 90-day wait on 2026-10-28; neither consumer used them.
