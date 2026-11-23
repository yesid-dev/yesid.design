# Changelog

## 0.54.0-rc.1

<!-- release-fragment: r5-map-controls -->
- `@yesid/tokens` (minor), `@yesid/ui` (minor): Add StillMap, MapFrame, MapLegend and the obstacle-aware placeMapLabels helper in `@yesid/ui/map`. Add the five-step neutral heatmap ramp and matching text tokens for both themes. FilterSummary can hide its clear action with `canClear`, SegmentedChoice wraps long labels, wrapped Button actions shrink in narrow cards, and Card accepts `spread` to share spare height.

<!-- release-fragment: r5-record-parts -->
- `@yesid/ui` (minor): Add StatusMark and RoutePlate in `@yesid/ui/brand`, ChartFrame and its token-styled axes, bar and line series, legend and DayStrip in `@yesid/ui/chart`, and the frameless StateNotice presentation. Stacked DataTable cells wrap headings and values at enlarged text while preserving table semantics. Use localized labels and a data table for a chart's exact values. Null observations keep their own state in charts and DayStrip.

## 0.53.0

<!-- release-fragment: announcement-banner-signage -->
- `@yesid/ui` (patch): Use yellow signage and black text, icons and focus rings for `AnnouncementBanner` in both themes.

<!-- release-fragment: transit-app-parts -->
- `@yesid/ui` (minor): Add `AppFrame`, `DateRangePicker` and `NetworkPicker` from `@yesid/ui/layout`. Compose
  `SiteHeader` with a sticky controls row and use `bind:chromeHeight` to reserve its measured
  clearance. Add an optional evidence rail that opens in a sheet on phones, and use
  `fullViewport` for a map workspace.

  Supply localized picker labels, ready date ranges and validation messages, and the network
  names and short codes from the consumer. The pill gives `ProductBrand` a full row at narrow
  available widths with enlarged text.

## 0.52.0

<!-- release-fragment: announcement-banner -->
- `@yesid/ui` (minor): Add `AnnouncementBanner` from `@yesid/ui/layout` for a site-wide linked message above the
  header. Pass `id`, `message`, `href` and a localized `closeLabel`. The banner remembers dismissal
  per ID. Use the same ID across pages and translations and give a new message a new ID.

  Place `%yesid.announcementBannerBoot%` in the document head before `%sveltekit.head%` and call
  `injectAnnouncementBannerBoot(html, id)` from `@yesid/ui/head` in `transformPageChunk`. This
  applies a saved dismissal before paint. Add `announcementHash` from `@yesid/ui/boot.json` to
  `script-src` when using a hash-based CSP.

## 0.51.1

<!-- release-fragment: status-forced-colors -->
- `@yesid/ui` (patch): In forced colours, StatusDot keeps a visible dot in the system text colour, and the `--dataviz-status-*` tokens resolve to `CanvasText`, so status marks keep their glyph and word without disappearing. Products no longer need their own forced-colours mapping for status marks.

<!-- release-fragment: status-token-descriptions -->
- `@yesid/tokens` (patch): The status token descriptions in `tokens.json` describe the three-band palette directly: on time is neutral reading ink, late is red and distinct from the yellow highlight, and severe shares late's red. Values are unchanged.

## 0.51.0

<!-- release-fragment: status-palette-on-time-neutral -->
- `@yesid/tokens` (minor), `@yesid/ui` (patch): Transit status colours follow owner choice A (Y-7): `--dataviz-status-on-time` is now neutral reading ink
  (`#f5f5f0` dark, `#131923` light) and `--dataviz-status-late` is red (`#ff5f57` dark, `#c62828` light), so a late
  vehicle no longer shares the yellow highlight. `--dataviz-status-early` is unchanged. `--dataviz-status-severe`
  stays for compatibility and now matches late.

  Migration: anything that used the status tokens for interface feedback rather than transport status should use
  `--success`, `--accent-text` or `--destructive` instead. StateNotice now does this itself: its positive, warning
  and error tones keep their colour in dark mode and become slightly darker, higher-contrast shades in light mode.

## 0.50.1

<!-- release-fragment: alternating-page-boundaries -->
- `@yesid/ui` (patch): Hand-drawn page edges alternate four and five tapered strokes using the original pen curve, with zero layout height.
  Article and case-study headers draw the same edge automatically, without a second DetailFrame rule.

## 0.50.0

<!-- release-fragment: product-brand-part-styles -->
- `@yesid/ui` (minor): ProductBrand adds optional houseStyle, productStyle and dividerStyle props. Products can size
  the house and product links independently and adapt compact footer layout and divider visibility
  through public styles. Existing callers retain their sizing, layout, links and focus behavior.

## 0.49.1

<!-- release-fragment: drawn-section-seams -->
- `@yesid/ui` (patch): PageSections hand-drawn boundaries now overlay the exact shared edge of adjacent sections instead of inserting an 8px blank row. The page stroke uses the upper half of a taller canvas so its ink becomes fine and faint where the wave crosses the edge, matching the reference. It remains full width and above section backgrounds; standalone and card separators, dimension and hazard boundaries, content spacing and footer placement keep their existing behavior.

## 0.49.0

<!-- release-fragment: shared-listing-rail -->
- `@yesid/ui` (minor): Export ListingRail from @yesid/ui/layout: the centered left listing rail with its original four-dot clusters and accent. Use its semantic heading mode with titleId for standalone pages, or decorative mode beside a separate accessible/mobile heading. ListingFrame now uses this shared treatment without changing its callers or geometry. clipAtHeader=false preserves natural unclipped departure.

  ReadingFrame adds contentsRule="hand-drawn" to replace its contents list's top and bottom solid ink with the existing shared hand-drawn Separator, for built-in and custom contents. The default remains "line" with unchanged markup and behavior; optional update/date validation and contents navigation are preserved.

## 0.48.0

<!-- release-fragment: reading-frame-optional-update -->
- `@yesid/ui` (minor): `ReadingFrame` no longer requires `updated`. Omit it when the text has no authored revision date:
  the frame renders no update row, time or placeholder, while the title, summary, contents and body
  stay the same. Dated callers keep the same markup and strict ISO calendar and time validation.
  `null` is not omission and still throws rather than silently dropping the date.

## 0.47.0

<!-- release-fragment: live-qa-kit-options -->
- `@yesid/ui` (minor): Owner live QA options, additive with today's defaults unchanged.

  - `RailTitle clipAtHeader` (default `true`) opts out of the scroll-applied header clip: the title
    leaves naturally with its section while sticky placement, scrollport fitting, the 12px horizontal
    fallback and sizing stay the same. `ListingFrame clipAtHeader` forwards it to the decorative edge
    title.
  - `Separator variant="hand-drawn"`: one static orange pen stroke in the blueprint ink (`--primary`
    through `currentColor`), 8px tall and full width, with no ticks, glow, shadow or animation, for
    the drawn page divider the owner chose.
  - `PageSections divider` (`dimension` by default, `hand-drawn` or `hazard`) chooses the boundary
    between registered sections; `PageSection` reads the parent choice and follows a change.
  - `SiteFooter edge` (`street` by default, `hazard`) draws the existing hazard strip instead of the
    road marking.
  - `TerminalPanel rule="line"` and `CodeBlock rule="line"` draw one solid yellow line
    (`--accent`) in place of the grey title-bar hairline, with no separator; the `.terminal-rule-line`
    root class does the same for server-rendered terminal markup. `hazard` remains the default.
  - `SiteHeader` grouped menus lay out as organized columns from 768px and as one column below it.
    Every pill divider, including `ProductBrand`'s inside the pill, uses one `--nav-split-space` on
    both sides (20px, then 10px, 4px and 2px at the phone tiers). A product brand snippet that draws
    its own `|` owns that spacing: use `ProductBrand`, or space it with `var(--nav-split-space)`.
  - `Card interactive` lifts and firms on keyboard focus of a product-owned link or control passed
    as children, not only kit components.

## 0.46.0

<!-- release-fragment: reading-label-and-horizontal-title -->
- `@yesid/ui` (minor): Add optional `MetricDisplay labelRole="reading"` to use the existing sentence-case Inter
  label role independently of the figure's tone. The default remains the uppercase metric label.
  Add optional `RailTitle horizontalSize` for phone/tablet headings and the desktop horizontal
  fallback; rotated `size` and every existing default remain unchanged. Products can request
  `horizontalSize="2rem"` for a 32px heading at a 16px root without overriding component styles.

## 0.45.0

<!-- release-fragment: dimension-divider-street-edge -->
- `@yesid/ui` (minor): The dimension-line divider and the footer street edge (D22, owner ruling of 15 November 2026).
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
    without it each presentation keeps its rule; it is the one line between the header and the list,
    and the search draws no rule of its own); `TerminalPanel` and `CodeBlock` `rule` (`hazard` default or `dimension`);
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

<!-- release-fragment: header-link-tiers -->
- `@yesid/ui` (minor): Add SiteHeader `linkTiers` (type `SiteHeaderLinkTiers`) so the header's link tiers agree before
  and after hydration for a wider brand (Transit R1063-1, transit#1063).

  With a supplied brand plus search and actions, Transit's full pill fits only from a wider header
  than the default tiers assume: priority 3 links showed from 1024px in the server-rendered CSS, and
  links-fit took the tier out once the app script ran, so at 1206px both toggles moved about 169px.
  `linkTiers` raises the header width each priority needs: `priority2` takes 768, 1024 or 1280 and
  `priority3` takes 1280, 1440 or 1600. Transit passes `linkTiers={{ priority3: 1280 }}`.

  The link tiers, defaults included, are now static container-query rules in em, named in px at the
  default 16px font size. They decide the same before hydration, after it and without JavaScript,
  and they scale with the reader's font size, as rem-sized brands and controls do: a 1280px tier is
  1600px at a 20px default. links-fit never brings back a tier they hide. Each priority hides below
  its own width; the links row and its divider hide only below the lowest width among the
  priorities present, so a raised priority 2 never hides priority 3 at its own width.

  Defaults at the 16px default font size are unchanged (priority 1 from 375px, priority 2 from
  600px or 500px with the deprecated `compactControls`, priority 3 from 1024px), so yesid.dev and
  yesid.login keep today's output there. At another default font size the default tiers now move
  with it. The `search` snippet keeps its 1024px step, since products pair their own compact
  search with it. Defect fix in the same rules: a header whose links are all priority 2 no longer
  shows the divider before an empty links row below 600px (500px in compact mode); no current
  product has such a header.

  Proven in the Gallery (`site-header-wide.spec.ts`): a Transit-shaped header stays still through
  hydration within 0.1px at 320, 390, 1100, 1206, 1279 and 1280px at 16px, and at 1279, 1280, 1599
  and 1600px at a 20px default font size, in EN and FR, and a mixed priority 2 and 3 header shows
  the right links at 1023, 1024, 1279 and 1280px with and without JavaScript. Other compositions
  need the same check in the product. These cases fail on the previous source.

  Migration: none required. Transit passes `linkTiers={{ priority3: 1280 }}`.

<!-- release-fragment: rail-title-header-band-listing-fixes -->
- `@yesid/ui` (minor): Sticky rail titles, a compact editorial header band and listing fixes (D23 and the owner rulings
  of 15 November 2026).

  New:

  - `RailTitle` (Experimental, `@yesid/ui/brand`, with `RailTitleProps`): the rotated section title
    on a side rail, outside the centred content. It is the section's real heading (`level`, default
    2; `titleId`), first in the section's DOM order, ending on the brand's orange dot (`dot`, default
    `true`). From 1024px it sits rotated on the `side` rail (`left`, the default, or `right`) and is
    sticky under the header pill (`--rail-title-top`, default the chrome offset plus 1rem) while its
    section scrolls, then the next section's title takes over; below 1024px it reads horizontally
    above the content. With `children` it lays out both rails (`--rail-title-rail`) so the content
    stays centred and the title never covers it. `size` sets one rotated size for every title on a
    page. A title longer than the room in its actual scrollport (the nearest scrolling ancestor,
    else the viewport) shrinks to fit, never below 12px; below that it reads horizontally above the
    content. It refits when its words, `dot`, `size`, the scrollport or its own size change, and a
    departing title is clipped at the clearance line, so it never paints under the header pill.
    `decorative` draws hidden decoration instead of a heading, for a frame whose real heading is
    elsewhere.
  - `filterCountText(count, countLabel, locale)` from `@yesid/ui/brand`: the words FilterSummary
    shows for a count.
  - `ListingFrame` `resultCountText`: an always-present, visually hidden polite status that announces
    the result count whenever a search or filter changes it.

  Changed (owner-approved, see DEPRECATION.md):

  - `ArticleHeader`, both presentations: a compact band. No space around the back link, the title
    4px above what follows, `actions` and `controls` in one row group (`.header__acts`) that shares a
    row where they fit, and a short floor under the last row. The title keeps its size; long titles
    still wrap uncropped. A case study with proof links and Collapse all: 254 to 146px at 1440px, 235
    to 131px at 390px.
  - `ListingFrame`: the edge title is a decorative `RailTitle` (same look and place); from 1024px no
    dashed rule above the search; the phone Filters button keeps the standard focus ring.
  - `SearchInput`: the standard 2px focus ring instead of the yellow border and glow.

  Migration: yesid.dev can replace its own rotated titles (home sections, contact, manifesto edge)
  with `RailTitle` and drop the page CSS that rotates or pins them; pass `resultCountText` (for
  example `filterCountText(count, countLabel, locale)`) to `ListingFrame`. Drop product CSS that
  re-spaces ArticleHeader's back link, title or action rows or selects `.header__actions` and
  `.header__controls` as direct children of `.header__content`; drop rules that restore the search
  glow or hide the Filters button's focus ring.

## 0.44.0

<!-- release-fragment: calm-reading-surfaces -->
- `@yesid/ui` (minor): Calm reading surfaces, reading labels, chrome clearance and an Experimental reading frame
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
    calendar and time ranges checked), summary, contents (an unnumbered list of 44px links from
    `sections`, or a `contents` snippet) and body, on a 65 to 70 character measure, with section ids that must be language-independent slugs.
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

<!-- release-fragment: no-hover-halos -->
- `@yesid/tokens` (minor), `@yesid/ui` (minor): Hover never adds a halo (owner ruling, 15 November 2026: "The only thing that I want to remove on
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

<!-- release-fragment: reading-data-controls -->
- `@yesid/ui` (minor): Add MetricDisplay reading tone and phone-row layout, SearchInput native attributes and
  bindable ref with visible-label, description and body-text options, SegmentedChoice fit-row,
  and FilterGroup consistent selection as opt-ins. Existing defaults stay unchanged. Metric
  figures now use tabular numerals. Products explicitly opt into reading ink and consistent
  selection when adopting. Gallery adds public-data, comparison, narrative and member recipes.

<!-- release-fragment: v044-header-brand-deprecations -->
- `@yesid/ui` (minor): Add the Experimental `ProductBrand`, fix SiteHeader's link tiers so the pill toggles always fit,
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
  - Defect fix, SiteHeader transitions: the pill's padding and the links' fold (max-width, margin,
    opacity) transitioned at any time, and header links used `transition-all`. When the header's
    stylesheet applied after a first layout, those transitions slid the pill and its toggles by up
    to 11px before hydration. Layout transitions now run only after hydration, where the menu's fold
    needs them, and links transition only colour and text shadow. Proof: the late-stylesheet cases
    in `site-header-pill.spec.ts` fail before.
  - Deprecated, retained and functional: SiteHeader `compactControls` (omit it; the toggles stay in
    the pill at every width), `CornerMeta` and `MetroStation` with their props types (no product
    use; see docs/migrations/decorative-vocabulary.md and docs/migrations/compact-controls.md).
    The Gallery no longer demonstrates compact controls as a pattern, corner notes, the station
    roundel or the mono section overline. Earliest removal: publication plus 90 days and an
    intervening minor.

  Migration: omit `compactControls`. To adopt `ProductBrand`, replace a local house-plus-product
  cluster with it in the `brand` snippets. ThemeToggle and LanguageToggle are unchanged.

## 0.43.0

<!-- release-fragment: calm-article-header -->
- `@yesid/ui` (minor): Add a calm reading presentation for article, case-study and data pages. The expressive
  presentation stays the default, so existing callers keep today's output apart from the two
  behaviour changes below.

  - `ArticleHeader` `presentation="reading"`: on the page colour, left aligned on the reading
    column (`--article-measure`, else DetailFrame's `--detail-center-width`, else 46rem), title in
    sentence case as written, Inter throughout, an orange underlined back link, no canvas, circuit
    grid, chevrons, corner marks, crosshair, watermark, edge notes or highlight. `category` becomes
    the first meta entry below the title at 15px instead of a line above it.
  - `ArticleHeader` `--article-title-size` replaces the title size, so products no longer restyle
    the header's private `h1` selector.
  - `DetailFrame` `rule`: `hazard` (default), `line` or `none`. From 1024px with both rails the
    frame sets `--detail-center-width`. The README now states that `header` renders before both
    rails, the place for an opening, and that `summary` is the top of the center column, after the
    left rail.
  - `ListingFrame` `presentation="reading"`: a visible horizontal h1 at every width, no edge title,
    accent rail or artwork, a sentence-case subtitle and a neutral line. `blueprint` is now
    optional; the expressive presentation renders an empty art layer without it.

  Behaviour changes for existing callers:

  - `highlight` (Y-4-approved behaviour correction): the previous contract accented the first
    case-insensitive substring match, so `AI` accented part of `BRAIN`. It now accents the first
    case-insensitive whole-word match. Words follow `Intl.Segmenter`, so Chinese and Thai titles
    split into words; title and highlight compare in NFC; an apostrophe between letters stays
    inside the word (`can` never matches in `can't`), while an elision such as `l'`, `d’` or `qu’`
    starts a new word (`espace` matches in `l'espace`). Without `Intl.Segmenter`, letters, digits
    and combining marks form words under the same apostrophe policy. A highlight that appears only
    inside other words now accents nothing; one that also appears as a word later in the title now
    accents that word. Proof: `article-highlight.test.ts`, `ArticleHeader.test.ts` and the Gallery
    `/article-header` browser test fail on the previous source.
  - Defect fix: a label and its date in the meta row wrap inside the column instead of
    overflowing (they were `nowrap`, and the header clips): a long Spanish date reached 429px on a
    320px screen. The pair's spacing is unchanged in the expressive presentation (`gap: 0.5em`
    between the label and the date, now also between rows when it wraps). Products can drop
    overrides of `.header__meta-pair`.

  Migration: none required. To adopt, pass `presentation="reading"` to `ArticleHeader` (yesid.dev
  articles and case studies, Transit data pages) and `ListingFrame` (reading listings), pass
  `rule="line"` and a `measure` to `DetailFrame`, and move any opening into the `header` snippet.

<!-- release-fragment: first-visit-closed-sections -->
- `@yesid/ui` (minor): Add CollapsibleSection firstVisitClosed for optional depth on bulk-enabled pages, approved
  under owner answer 5A on 13 November 2026. Saved Expand all and Collapse all still win.
  Existing callers retain their defaults. The boot script hash changes; read @yesid/ui/boot.json
  from the installed candidate for product CSP adoption. See docs/migrations/selective-first-visit-sections.md.

<!-- release-fragment: header-seams-and-button-wrap -->
- `@yesid/ui` (minor): Add SiteHeader `brand` and `wordmarkAutoPlay` (default true), and Button `wrap` (default false).
  Existing callers keep their wordmark and button layout. A supplied brand owns its motion.
  Empty effective menus now omit the menu button; compact controls remain in the pill without a
  menu. Supply menu items to retain the menu. No language disclosure or replacement toggles.

  Fix compact pre-hydration popover spacing and visible labels without changing toggle artwork,
  and round the menu button focus outline. Regression browser cases fail on main before these fixes.

  Fix table cells splitting ordinary words through inherited base styles: cells now use
  `word-break: normal` and `overflow-wrap: break-word`. Review consumer table CSS overrides on
  adoption; a word wider than the cell may still split. Browser regression at 320 and 390px fails
  on main. Additive options require no migration; behavior fixes should be rehearsed in consumers.

<!-- release-fragment: labelled-field-recipe -->
- `@yesid/ui` (patch): Document the native labelled-field recipe and Gallery proof for labels, hints, errors, summary focus, busy text and input-token boundaries. No runtime API or token value change; products adopt the documented composition in their own forms.

<!-- release-fragment: orange-links-and-doctrine -->
- `@yesid/tokens` (patch), `@yesid/ui` (minor): Owner answer 9A (13 November 2026) approves orange text links in v0.43.0.
  Text links (a link without a class) now use `--primary`. Remove product rules that colour
  links yellow; a component that needs another link style styles its own. Underlines and focus
  outlines stay unchanged. Rehearse the migration in yesid.dev, yesid.login and Transit.

  Publish the doctrine and register recipes; amend colour descriptions without token value changes.
  Deprecate SiteFooter's self-made `statusPrefix` / `liveLabel` date/status pair, retaining its API.
  Omit both, or use `statusStart` with a real source, subject and observation time. Removal waits
  90 days after publication and an intervening minor, or the owner's waiver. See
  `docs/migrations/footer-status.md`. The former pulse is already still.

<!-- release-fragment: quiet-error-page-and-masthead -->
- `@yesid/ui` (minor): Quiet task headers and error page. `Masthead`'s `kicker` is now optional (omit it to start with
  the heading) and a new `dot` prop (default `true`) can drop the brand dot; `tape` was already
  optional. `ErrorPage`'s `label` is now optional, a new `tape` prop (default `true`) can drop the
  hazard rule, and a new `illustration` prop (`'large-first'` default, `'small-after'` or `'none'`,
  exported as `ErrorPageIllustration`) places the construction scene: `'small-after'` draws it small
  after the heading, body, destinations and terminal line. Every default keeps today's output.

  Fix: the suggestions navigation is always named. Without `suggestionsLabel`, or with an empty or
  whitespace-only one, it was a navigation landmark with no usable name; it is now named by the
  heading through `aria-labelledby`. Callers that pass a non-blank `suggestionsLabel` keep their
  output; the heading gains an `id` either way. Regression proof: `packages/ui/src/layout/ErrorPage.test.ts`,
  "names the navigation by the heading when suggestionsLabel is ..." (undefined, empty, spaces, tab,
  newline and mixed whitespace), which fails on v0.42.0's `ErrorPage.svelte`, with server markup in
  `ErrorPage.ssr.test.ts` and the Gallery's `quiet-task-headers.spec.ts`.

  No migration is required. The error scene's lamps have been still since v0.42.0, so no still-lights
  option was added.

## 0.42.0

<!-- release-fragment: no-endless-decorative-loops -->
- `@yesid/ui` (patch): Correct the WCAG 2.2.2 Pause, Stop, Hide defect: default decorative ErrorIllustration lamps,
  MetroStation ping, StopLabel glow and TerminalCursor blink now use their still reduced-motion
  frames. The Gallery browser regression fails on the original source and checks every route
  at load and after six seconds under normal and reduced motion, allowing only busy Skeletons.

  Owner-approved compatibility exception (instruction dated 2026-11-14 in DEPRECATION.md):
  opt-in gradient Separator, StatusDot pulse, TerminalPanel signal.live and led-pulse are still.
  Pulse and live remain accepted for compatibility and produce no visual pulse; all props, types
  and exports remain. Skeleton only animates inside aria-busy="true"; callers remove loading
  indicators when loading completes. The UI API report changes only the SHA-256 receipt for the
  public base.css asset because led-pulse is now still; declarations and export surfaces are unchanged.

## 0.42.0-rc.2

<!-- release-fragment: compact-controls-before-hydration -->
- `@yesid/ui` (patch): Fix SiteHeader compact mode removing language and theme control access before hydration:
  the menu button opens the existing controls through a native popover while JavaScript is
  delayed or disabled, then the existing dialog takes over after hydration. The toggles keep
  their appearance and behavior, with one language link in the DOM and no hydration layout shift.
  Keep priority-1 pill links eligible below 375px in compact mode when they fit; higher priorities
  and callers without compactControls retain their folding rules.
  Gallery regressions cover disabled and held JavaScript at 320, 390 and 599px, real language
  navigation, keyboard reachability, hydration CLS, and EN/FR/ES action lengths at 320, 360 and
  390px. These restore previously valid access under DEPRECATION.md.

## 0.42.0-rc.1

<!-- release-fragment: brand-language-order -->
- `@yesid/ui` (minor): The language toggle follows the brand language order. Callers that passed another order now
  see English, French, Spanish, then any other supported locales in their supplied order.
  The compact header menu follows the same order. Nothing else changes.

<!-- release-fragment: button-visible-focus -->
- `@yesid/ui` (patch): Restore the shared 2px offset keyboard focus outline on every Button variant, including filled
  buttons and links. The outline meets 3:1 contrast on page and card surfaces in both themes and
  keeps the forced-colours outline. No prop changes or caller migration are needed. Unit and
  Gallery browser regressions cover outline availability, contrast, stable geometry and accessibility.

<!-- release-fragment: header-groups-footer-status -->
- `@yesid/ui` (minor): SiteHeader accepts labelled menuGroups and opt-in compactControls that move theme and language controls into the menu below 600px of header width. SiteFooter can omit both statusPrefix and liveLabel to hide its lamp and date, and omits an empty status row. Existing props and defaults retain their behavior.

<!-- release-fragment: reading-safe-sections -->
- `@yesid/ui` (minor): Add an optional `CollapsibleSection` summary snippet for the finding, period and caveat. It stays
  visible outside the collapsible body, wraps without clamping and describes the heading button.
  Existing subtitles keep their current behavior.

  Correct section toggling so only the heading button toggles it. Body clicks and taps no longer
  close text while it is being read. Header actions keep their own behavior. This is a defect fix
  under DEPRECATION.md: regression tests cover prose clicks, touch followed by click and selection,
  with Gallery checks at phone and desktop widths. Existing callers need no prop changes; move any
  finding that must remain fully readable from subtitle into summary. Bulk preferences and jumps
  are unchanged.

<!-- release-fragment: reading-safe-terminal -->
- `@yesid/ui` (minor): TerminalPanel now renders a lamp only with `signal={{ color, label, live? }}`. Colors reuse
  StatusDotColor and the required caller label names the signal for screen readers. Only a live
  signal pulses, after mount and when motion is allowed. Existing callers lose the automatic
  traffic-light chrome and green pulse; status, tag, actions and footer remain unchanged.
  This is a documented implementation-defect correction under DEPRECATION.md: decorative chrome
  must not claim measured health. Unit and SSR regressions cover omitted and named signals;
  Gallery checks cover motion gating at phone and desktop sizes.

  Large section cards no longer scale on press under reduced motion. Global overscroll suppression
  now applies only to fine pointers, preserving native touch overscroll and pull-to-refresh.
  Gallery checks assert held-press geometry and pointer-specific computed overscroll styles.

## 0.41.1

<!-- release-fragment: surface-rail-close -->
- `@yesid/ui` (patch): SurfaceRail keeps its controls mounted inside the mobile sheet until the closing animation finishes,
  so dismissal slides the complete panel away without briefly showing an empty pill. Control state,
  focus restoration and desktop breakpoint handoff are preserved. No migration is required.

## 0.41.0

<!-- release-fragment: ripple-exempt-attribute -->
- `@yesid/motion` (minor): The global ripple now skips any click inside an element marked `data-ripple-exempt`, without needing an `exclude` option.
  Mark reading surfaces such as article bodies, editorial cards, charts and maps with the attribute so the ripple stays on
  navigation and controls. A consumer `exclude` selector still works and now adds to this rule instead of being the only
  one. Consumers that already pass `exclude: '[data-ripple-exempt]'` can drop it; leaving it in place is harmless. No other
  migration is required.

## 0.40.0

<!-- release-fragment: sheet-touch-drag -->
- `@yesid/ui` (patch): Bottom Sheet detents can now be dragged by touch. A touch drag on the handle used to stop after its first move, because the
  touched child's implicit pointer capture ended when the sheet took capture, and that event bubbled up as the end of the
  drag. Only the sheet's own lost capture ends a drag now. Mouse drags, taps and keyboard changes are unchanged. No migration is required.

## 0.40.0-rc.1

<!-- release-fragment: content-share-copy -->
- `@yesid/seo-kit` (minor), `@yesid/ui` (minor): Resolve independent per-locale description and OG card text from ordered content
  fields with `resolveShareCopy` (root or `@yesid/seo-kit/share-copy`). The first
  candidate is primary short text. The card always preserves its full nonempty
  primary after whitespace collapse, falling back to the default-locale primary
  only when the requested primary is empty. With no primary in either locale, it
  uses leading complete longer-summary sentences, then `defaults.ogLine`.

  Descriptions try primary plus localized CTA, then primary alone, then leading
  complete sentences from longer candidates in order. Bounds remain configurable,
  inclusive Unicode code-point counts, defaulting to 50 to 200. Longer candidates
  never contribute a partial sentence. Sentence splitting handles French/Spanish
  punctuation and closing quotes, accepts abbreviations at the end of text and keeps
  localized `p. ex.` / `p. ej.` continuations together instead of selecting fragments.
  CTA composition recognizes existing suffixes after Unicode punctuation as well
  as whitespace, stays idempotent across straight/curly apostrophes and follows
  the description content's locale independently of the card's locale. After
  requested/default-locale content fails, use `defaults.description`; no generic
  copy is built in. Defaults do not receive a CTA.

  Selections expose distinct `description` and `ogLine` plus per-output rule,
  candidate and source-locale provenance. Top-level source/candidate fields alias
  the description source (null candidate for defaults). Missing results retain any
  independently resolved output, so a short primary is not lost when description
  copy is missing. This reshapes the new, unreleased selection contract in this PR.

  Pass a selected result to `SeoHead.description` and `renderOgPng`'s `title`.
  Meta/OG/Twitter descriptions use `description`; the generated image uses `ogLine`.
  `OG_LINE_MAX_LENGTH` (200 code points, root or `./share-copy`) is the CMS validation
  limit guaranteed by measured card fitting with bundled fonts. Full text and the
  footer remain within the padding, including multiline and wide/unbroken primary
  text. Real-Satori regressions cover six individually fitting wide words at 197
  and 200 code points, preserving every glyph and the footer within bounds.
  Type starts at 32px and stops at `OG_LINE_MIN_FONT_SIZE` (24px, `./og`);
  unfit input rejects instead of clipping or shrinking below legibility. Primary
  text beyond the limit is still preserved by the resolver and needs consumer
  verification. Existing string inputs work byte-identically.

  No per-page hard-coded share copy; write it in content fields. Consumers adopt
  this API in their own release upgrade and verify real content, head tags and
  images in their locales. Package checks do not establish consumer adoption.

<!-- release-fragment: packed-design-peer-owner -->
- `@yesid/tokens` (patch), `@yesid/motion` (patch), `@yesid/gates` (patch), `@yesid/seo-kit` (patch), `@yesid/ui` (patch), `@yesid/analytics` (patch), `@yesid/i18n-core` (patch), `@yesid/config` (patch): Pack sibling design dependencies at the release's own repository, tag and asset
  version, including previously pinned URLs from before the repository transfer to
  yesid-dev/yesid.design. New tarballs no longer retain old-owner sibling URLs that
  rely on GitHub redirects. All-eight-package packing regression checks every
  design dependency URL against the canonical repository. Public APIs are unchanged;
  consumers receive this correction through the next normal release upgrade.

## 0.39.1

<!-- release-fragment: boot-recovery-own-scripts -->
- `@yesid/ui` (patch): Keep the reader's collapsed section choice when an optional or third-party script fails to load. Startup resource recovery now responds only to same-origin `/_app/` module scripts and modulepreloads, preserving readable content when app assets fail. No migration is required.

## 0.39.0

<!-- release-fragment: section-cards-wider-on-phones -->
- `@yesid/ui` (patch): Section cards in `DetailFrame` are wider on phones. Below 768px, top-level section cards in the
  center column now sit 8px from the screen edges instead of the 24px page gutter, so their text gets
  about 32px more width. Nested cards, tablets and desktops are unchanged. Update product tests that
  expect section cards on phones to line up with the page gutter.

<!-- release-fragment: sheet-detents -->
- `@yesid/ui` (minor): Opt into draggable bottom Sheet heights with Content detents, caller-owned handle and stop labels,
  and bind:detent. User changes emit ondetentchange; callers own persistence. Content also accepts
  modal={false} for an interactive page behind the sheet. Existing Sheet defaults remain unchanged.

## 0.38.1

<!-- release-fragment: analytics-relay-cloudflare-visitor -->
- `@yesid/analytics` (patch): `relayAnalyticsEvent` now counts visitors on sites that Cloudflare proxies to another host, such as
  yesid.dev on Vercel. There, the connecting address is a Cloudflare server, which Plausible accepts
  with 202 and then drops. When `clientAddress` is in Cloudflare's published ranges, the relay forwards
  the request's `CF-Connecting-IP` instead. A request from outside those ranges cannot choose its
  address with that header. No call changes are needed; a route that already reads `CF-Connecting-IP`
  itself keeps working and can drop that code.

## 0.38.0

<!-- release-fragment: analytics-first-party-endpoint -->
- `@yesid/analytics` (minor): Analytics can now reach visitors whose browsers block `plausible.io`. Additions only; existing
  calls behave as before.

  - `createAnalytics` takes `endpoint`, a same-origin path such as `/relay/e`, and sends events there
    instead of `https://plausible.io/api/event`.
  - New `@yesid/analytics/relay` subpath: `relayAnalyticsEvent(request, { domain, clientAddress })`
    serves that path from any Fetch-API runtime (SvelteKit endpoint, Cloudflare Worker). It forwards
    each event to Plausible exactly once with the visitor's IP and user agent, with no retry and no
    fallback. It refuses events for another site, or from a host that isn't the site or one of its
    subdomains, such as a preview. `RELAY_MAX_BODY_BYTES` is its 4 KiB body limit.
  - `createAnalytics` takes `reducePath(pathname)`, which maps each page path to the one Plausible
    records before campaign tags are reduced. An event is dropped if it throws or returns anything
    but a root-relative path.
  - `createAnalytics` throws for an `endpoint` that isn't a same-origin path. A `domain` that isn't
    one plain host, such as a comma-separated rollup, sends nothing, as it did before.

  To migrate to the first-party endpoint: add the route (see the package README's Relay section),
  pass `endpoint: '/relay/e'`, and remove `https://plausible.io` from the CSP's `connect-src`.
  Products that let visitors opt out by blocking `plausible.io` must update that privacy text.

## 0.37.0

Promotes 0.37.0-rc.3, which also contains the 0.37.0-rc.2 and 0.37.0-rc.1 changes below:
content sections start expanded on a first visit, and the nav keeps 16px text at every width.

<!-- release-fragment: nav-links-fit -->
- `@yesid/ui` (patch): `SiteHeader` now moves its links to the menu whenever the pill would not fit its header with 4px
  to spare, measured from the real labels. The fixed 375px threshold alone let longer labels run off
  narrow phones: yesid.dev's Spanish header was 399px wide on a 390px phone. Width thresholds still
  apply before the app script runs. No API change.

## 0.37.0-rc.2

<!-- release-fragment: nav-text-one-size -->
- `@yesid/tokens` (minor), `@yesid/ui` (minor): The floating nav keeps one text size at every width: header links are 16px (was 15px on desktop,
  14px on tablets and 13px on small phones) and the wordmark is 18px (was 18, 17 and 16px). All
  `--text-nav-link-*` tokens are now `1rem` and all `--text-nav-brand-*` tokens `1.125rem`.

  Links that don't fit move to the menu instead of shrinking. `SiteHeader` now shows `priority: 1`
  links (the default) from a 375px-wide header; below that the header shows the wordmark and
  controls only. `priority: 2` still shows from 500px and `priority: 3` from 1024px. Keep every
  header link in `menuItems` so narrow phones can still reach it. Update product tests that expect
  header links on screens narrower than 375px or assert the old nav text sizes.

## 0.37.0-rc.1

<!-- release-fragment: sections-start-expanded -->
- `@yesid/ui` (minor): Content sections now start expanded on a first visit. With no `sections-choice` stored, or a
  malformed one, pages with a `SectionsToggle` and at least two content sections open every section,
  and the control shows Collapse all in its neutral state. A remembered Collapse all still collapses
  content across pages and visits, and the control is orange after it. Blocked storage still uses
  declared defaults.

  The boot script changed, so `@yesid/ui/boot.json` has a new CSP hash. Products that import it
  pick it up on rebuild; a manually copied hash must be updated. Update product tests that expect
  collapsed content on a fresh visit. See
  [Remembered sections](docs/migrations/remembered-sections.md#first-visit-opens-content).

## 0.36.1

<!-- release-fragment: rename-yesid-design -->
- `@yesid/tokens` (patch), `@yesid/motion` (patch), `@yesid/gates` (patch), `@yesid/seo-kit` (patch), `@yesid/ui` (patch), `@yesid/analytics` (patch), `@yesid/i18n-core` (patch), `@yesid/config` (patch): The repository is now `mgkdante/yesid.design`. Package names and APIs are unchanged. To migrate, replace `mgkdante/yesid.dev-design` with `mgkdante/yesid.design` in every tarball URL when you bump to this release. Verify this and later releases with `gh attestation verify --repo mgkdante/yesid.design`. Attestations for v0.36.0 and earlier stay bound to the old name, so verify those with `--repo mgkdante/yesid.dev-design`.

## 0.36.0

<!-- release-fragment: remembered-sections -->
- `@yesid/ui` (minor): The expand-all control remembers one origin-wide localStorage choice under `sections-choice`.
  Pages with at least two content sections and the control start collapsed on a first visit; the
  visitor's bulk choice wins across pages and visits. The collapsed control is orange and its
  default active effect is `glow`. Individual toggles, the TOC and independent panels keep their
  own state. Server HTML keeps complete, readable bodies, and the head boot script applies initial
  geometry before paint. Blocked storage uses declared interactive defaults.
  The body stays visible during parsing. Boot and app-resource failures expose pending bodies;
  stalled startup has a five-second readable fallback. Other-tab choices apply to future mounts,
  and late content adopts the bulk choice while preserving deliberate individual toggles.
  Pending disclosure semantics and the bulk accessible name match their visual state. Recovery
  preserves the control's space, belongs to pending mounts and keeps future route preferences intact.
  The server HTML eligibility scan has forward-only progress on malformed input.

  This is the owner-approved D15 behavior change of 2026-11-05. Rebuild with the package's new
  `boot.json` CSP hash, update disclosure expectations and privacy/device-storage copy, and rehearse
  the prerelease on both products before stable promotion. No new props, settings, CMS fields or
  consumer initialization are required. See `docs/migrations/remembered-sections.md`.

## 0.35.0

<!-- release-fragment: connect-kit3-truth -->
- `@yesid/ui` (patch), `@yesid/config` (minor): Document Kit 3 as the supported app target, with TypeScript 6 for SvelteKit consumers and
  TypeScript 5.9/6 for the library config. Config flags and package runtime source are unchanged.
  The repository contract suite composes the real Kit 3 config on TypeScript 6, and Gallery now
  runs Kit 3, Vite 8 and the hook-only navigation lifecycle. The optional accepted-start adapter
  retains fake-router coverage; eventless language redirects close the menu on Kit 3.

  Follow the composed product guide for boot hooks, fonts, theme and language injection, Kit/Vite
  config, header/navigation/language/section controls, source scanning and required peers. The UI
  README uses Kit 3 and the existing tap-size token; migration/deprecation notes name shipped
  v0.33.0 and v0.34.0 changes. This does not establish consumer adoption or deployed acceptance.

<!-- release-fragment: connect-module-fixes -->
- `@yesid/ui` (minor): Sheet animation CSS now comes from `@yesid/ui/base.css` and its package-owned
  `tw-animate-css` dependency. Products can remove their direct dependency and stylesheet import.

  Breaking: Sheet Content requires caller-owned `closeLabel` whenever its close button can appear.
  Pass localized copy, or explicitly set `showCloseButton={false}` to omit the button and label.
  The owner approved this coordinated transition without a deprecation wait for v0.35.0.

  DetailFrame accepts both `toc.openAria` and `toc.closeAria`, or neither. Omitting both disables
  the mobile contents pill while retaining active tracking and fragment handling. Existing labelled
  callers and `pillEntries: []` remain valid.

  Document the yesid dot favicon repaint on SiteRoot mount and the CI-decided lockfile rule.
  See `docs/migrations/connect-module-fixes.md` for both products' bump requirements and checks.

<!-- release-fragment: connect-prune -->
- `@yesid/tokens` (minor), `@yesid/gates` (minor), `@yesid/seo-kit` (minor), `@yesid/ui` (minor), `@yesid/analytics` (minor): Remove unused public contracts. The owner approved removing them in this one release,
  without the usual deprecation wait (see DEPRECATION.md). Card keeps its root; compose children with ordinary markup. Sticky panels use
  product layout and the retained scrollChain action. Button, Badge, Sheet and Tabs keep their
  props and types while their variant functions stop being index exports. Remove the unused
  color-mix floor engine, CSP serializer and token parse subpath. Analytics referrer reduction
  and property filtering remain private behind createAnalytics with unchanged request behavior.
  See docs/migrations/connect-prune.md for exact exports, source scans and verification limits.

<!-- release-fragment: connect-station-tab-look -->
- `@yesid/ui` (minor): Add the opt-in `@yesid/ui/station-tabs.css` signage look for Tabs triggers and native navigation
  links. Import it after base.css and apply `station-tabs` to the rail and `station-tab` to controls.
  Active state follows bits-ui's `data-state="active"` or a link's `aria-current="page"`.
  Weight, inactive ink and inactive hover-rule color remain independently adjustable CSS variables.
  Hover keeps full-strength text and shows the existing 3px bottom rule. The inset focus outline
  uses the control's text color for visible keyboard focus on both inactive rails and active chips.
  Existing Tabs variants are unchanged. Product copy removal and regression checks happen at adoption.

<!-- release-fragment: motion-pointer-capability -->
- `@yesid/motion` (minor): Unify device capability policy through the existing `shouldAnimate(tier, input?)` export from
  both the root and `@yesid/motion/policy`. Its optional input is `pointer` or `touch-only`;
  existing calls without an input keep their motion-only behavior.

  All six hover effects require a hover-capable fine pointer, including a mouse on a touchscreen
  laptop or touch-primary tablet. PressBounce now runs only on touch devices without that
  capability, so boop and pressBounce are mutually exclusive. Hybrids use the same CSS press
  baseline as desktops; retain `tap-press` or a deliberate CSS alternative on pressBounce callers.
  The original transform-based action bodies and touch-only phone behavior are preserved.

  Existing reduced-motion tiers and Lenis behavior remain. Missing matchMedia makes input-gated
  actions inert, including on fresh imports. Checks apply at mount time. The device table covers
  all seven actions under both motion preferences, and browser tests verify desktop/hybrid CSS
  press feedback through the hover pulse and after it.

## 0.34.0

<!-- release-fragment: deepen-primitive-cleanup -->
- `@yesid/tokens` (minor), `@yesid/ui` (minor): Remove unused Toggle/ToggleGroup subpaths, Button variants secondary/destructive/link and sizes
  xs/lg/icon/icon-xs/icon-sm/icon-lg, Badge variants secondary/ghost/link, Sheet left, and unused
  inline-icon, button-group and invalid-state selectors. Use bits-ui directly for toggle behavior;
  choose an existing supported variant/size or own a product-specific treatment locally. FilterGroup
  keeps its DOM, classes and keyboard/selection behavior through bits-ui directly. Declared defaults,
  Gallery-only destructive Badge/right Sheet, and Button ghost's dark hover remain.

  Remove the eight sidebar color mappings, exact --radius, --secondary and --color-secondary.
  Use semantic color tokens directly, --radius-md instead of --radius, and --popover instead of
  --secondary. Keep --secondary-foreground and named radius tokens. Transit must migrate its
  MetricInfo radius before adopting this token output. See docs/migrations/deepen-primitives.md.
  These owner-approved removals have no deprecation window.

<!-- release-fragment: deepen-section-independent -->
- `@yesid/ui` (minor): Add `CollapsibleSection.independent` for filter and control panels that keep their own open
  state and stay outside content-section bulk actions, counts and the all-closed calculation.
  Use `<CollapsibleSection independent bind:open={panelOpen}>` without changing the card's
  rendering or storing disclosure state. Explicit section jumps still reveal the target panel
  and its containing disclosures. Included in the coordinated v0.34.0 minor with primitive cleanup.
  When content TOC entries exist, independent targets do not replace their active entry, counter
  or pill label through observation or explicit jumps. Empty-entry controllers retain target activity.
  Static independent panels have the same TOC protection; reveal requests leave their bound `open` unchanged.

<!-- release-fragment: section-jump-cancel -->
- `@yesid/ui` (patch): Keep in-flight section jumps through non-navigating clicks, including reopening the mobile TOC
  while layout settles. Navigation links, newer jumps, history, route changes, root changes and
  disposal still cancel stale landings. Real-component browser coverage reproduces the mobile
  regression; cancellation tests preserve navigation and history restoration.

## 0.33.0

<!-- release-fragment: deepen-disclosure -->
- `@yesid/ui` (minor): Replace QuietModeButton with SectionsToggle and quietMode with in-memory sections state.
  The single expand-all control collapses all content sections whenever any is open, and expands
  all only when every section is closed. It hides with fewer than two mounted collapsible content
  sections. The TOC card, filter groups and listing filter panels remain independent; the TOC does
  not count toward the content-section threshold.
  Remove remembered open/closed state, the Remember/Forget control, persistence props, quiet-mode
  classes/marks and remembered-state boot logic. openSection(anchor) opens mounted sections.
  See docs/migrations/deepen-disclosure.md for the breaking API renames/removals, consumer caller
  inventory and CSP hash migration. The owner explicitly requested these removals for the next minor
  on 2026-11-03; the standard deprecation waiting periods have not elapsed.

<!-- release-fragment: deepen-section-jump -->
- `@yesid/ui` (minor): Replace the public TOC helper cluster with createSectionJump, useSectionJump and SectionJump.
  One controller owns registration, active id, target opening, the 25% landing line, layout settling,
  request cancellation, router fragments and reduced motion. TocNav, TocPill and DetailFrame share
  it through navigation; content opening uses the section interface instead of private classes or
  trigger clicks. Real-section unit, SSR and Gallery tests cover the integration.

  This owner-directed breaking removal retires TOC_TARGET_SELECTOR, navigateToc, observeActiveToc,
  onTocNavigate, openCollapsedTocTarget, reconcileActiveToc, revealTocTarget, settleLayout,
  tocElement and RevealTocTargetOptions from the root and /brand entrypoints. The scoped exception
  to both waiting gates is recorded in DEPRECATION.md. See docs/migrations/deepen-section-jump.md
  for replacements, changed selector/landing semantics and the read-only consumer caller inventory.

<!-- release-fragment: navigation-lifecycle -->
- `@yesid/ui` (minor): Owner-approved breaking transition (2026-11-03, deepen D-c): initialize
  `createNavigationLifecycle({ beforeNavigate, onNavigate, afterNavigate })` once in the persistent
  app layout and pass its result as `SiteHeader.navigation`. The module interrupts Lenis even
  without a header, waits for menu closure and coordinates locale-switch focus through a native
  link ref. `LanguageToggle` is a plain link: remove its `onNavigate` prop.

  Copy now belongs entirely to each app's local locale files (Transit i18n messages and yesid.dev
  local locales, not the CMS): `SiteHeader.labels.menuFooter` and `skipToContent`, plus
  `LanguageToggle.names` (or `SiteHeader.language.names`), are required. Pass an empty footer
  explicitly to hide it. No built-in EN/FR/ES copy or language-name fallback remains. See
  `docs/migrations/navigation-lifecycle.md` for the exact Transit and yesid.dev changes and strings.
  This is source-stage work for the coordinated minor release, not consumer adoption or release proof.

  Navigation also re-closes a menu reopened during a slow loader, reconciles redirect and superseding
  events when `beforeNavigate` is skipped, and advances the stale-focus guard for each actual commit.
  The optional `NavigationEvent.event` preserves native trigger identity through custom adapters.
  Lenis momentum is canceled through its public stop/start API in both navigation hooks, independently
  of any header, without leaving input locked after cancellation. The migration includes the Transit
  unit harness and yesid.dev browser expectation updates required alongside the production calls.

  The router adapter optionally accepts `subscribeNavigation` for redirect continuity: every accepted
  original link start, including superseding links, carries its native event before loading/redirecting.
  Transit / Kit 2 can use `$app/stores.navigating.subscribe`. Kit 3 apps omit it and use the safe
  fallback: direct language switches preserve the menu through matching native hook events, while
  a language switch that lands on an eventless redirect closes the menu without locale refocus.
  There is no Kit 3 SDK adoption prerequisite. Partial/late subscriptions are unsupported; hook-only
  claims are dropped at eventless commits and completed-event replays are ignored. The lifecycle
  never observes DOM clicks or treats `defaultPrevented` as proof of router interception.

## 0.32.2

<!-- release-fragment: language-toggle-full-size -->
- `@yesid/ui` (patch): `LanguageToggle` keeps its boards full size at every width. Phones used to scale the whole post down to 34px, or 22px under 360px, which drew the language codes about 6px tall. The toggle no longer shrinks in a crowded pill, and below 768px it drops its side padding instead. The post stays centred and its pole runs past the 44px slot.

## 0.32.1

<!-- release-fragment: stop-scroll-on-navigate -->
- `@yesid/ui` (patch): `SiteHeader` stops a smooth scroll still in flight when a navigation starts. Clicking a link while Lenis was still easing let the old animation carry on and scroll the new page down, so it could open at its bottom instead of the top. Back and forward navigation still restore the saved position.

## 0.32.0

<!-- release-fragment: slider-button -->
- `@yesid/ui` (minor): Add `SliderButton` to `@yesid/ui/brand`: the shared previous/next control for sliders, carousels and lightboxes, with the chevron centred on the button. Replace hand-rolled arrow buttons with `<SliderButton direction="previous" aria-label={...} onclick={...} />`.

## 0.31.1

<!-- release-fragment: collapsible-mobile-padding -->
- `@yesid/ui` (patch): `CollapsibleSection` gives text more room on phones: below 768px the header, body and article-summary side inset drops from 24px to 16px. Desktop and tablet spacing is unchanged. The inset is one custom property, `--collapsible-pad-x`, set on the section card. No API change.

## 0.31.0

<!-- release-fragment: analytics-allowed-props -->
- `@yesid/analytics` (minor): Add allowlisted custom properties. A preset can declare `props: { key: [allowed values] }`; value lists may be runtime string arrays. `trackEvent(name, props)` sends a subset of them, and the new `context` option of `createAnalytics` adds properties to every pageview and event. Any key or value outside the allowlist is dropped in the browser, including properties from class-tagged clicks. `allowAnalyticsProps` exposes the filter. Presets without `props` behave as before and send no properties.

## 0.30.3

<!-- release-fragment: ordinary-reading-roles -->
- `@yesid/tokens` (patch), `@yesid/ui` (patch): Add explicit ordinary-reading size roles: prose 19/20px, block code 16/17px, inline code 0.95em, figure captions 16px, supporting prose 18px and section headings 20/22px, with desktop sizes starting at 1024px. Apply these roles with the documented line heights when adopting the package. The shared class merger recognizes them as font sizes, preserving text colours and replacing competing base sizes. Existing body, mono, caption, compact-density, control, data and artistic display sizes are unchanged. Gallery demonstrates the reading roles.

<!-- release-fragment: portable-style-regression-paths -->
- `@yesid/gates` (patch): Normalize style-regression hit paths to `src/` with forward slashes on every OS, including scan roots with a trailing separator. Windows callers receive the same finding paths as Linux callers.

<!-- release-fragment: seo-kit-og-background-grid -->
- `@yesid/seo-kit` (patch): Add the subtle blueprint grid to the default shared OG card: 40px minor lines and 200px major lines behind the existing content, using the token accent at 0.04/0.07 opacity. Card dimensions, typography, padding and public helper signatures are unchanged. Consumers receive the background after adopting the release; OG and Twitter reuse the same image asset.

<!-- release-fragment: seo-kit-satori-security-floor -->
- `@yesid/seo-kit` (patch): Require Satori >=0.33.5 and <1 to exclude versions affected by GHSA-wx4j-mvgx-mqwp. Consumers must upgrade their Satori peer before adopting this release. No rendering-helper signatures or injected-rasterizer call shapes changed.

## 0.30.2

<!-- release-fragment: header-link-tap-width -->
- `@yesid/ui` (patch): The last package controls under `--size-tap-min` now meet it: `SiteHeader` links are at least 44px wide with the label centred (a short label such as "Map" was 39px); the `Sheet` close button is a 44px square around the same icon (it was 16px), and a sheet header leaves room for it; the `CodeBlock` copy button is 44px tall inside the same title bar height (it was 29px) and keeps clear of the title when the bar wraps; nested `TocNav` entries are 44px tall like the top level (they were 36px).

## 0.30.1

<!-- release-fragment: resizable-server-separator -->
- `@yesid/ui` (patch): `ResizableHandle` server-renders as a static separator, out of the tab order, and becomes focusable once paneforge has written its `aria-valuenow`, `aria-valuemin` and `aria-valuemax` on mount. Server markup no longer fails axe `aria-required-attr`, so tests can run axe without waiting for hydration.

## 0.30.0

<!-- release-fragment: accessibility-in-the-packages -->
- `@yesid/tokens` (minor), `@yesid/ui` (minor), `@yesid/config` (minor): Accessibility moves into the packages, and both products share one page skeleton.

  - `SiteHeader` opens with a skip link to `#main` ("Skip to content" in en, fr or es; `labels.skipToContent` replaces it) and renders the pill inside a `header`, the page's banner. Render `<main id="main">` after `SiteHeader` and `SiteFooter` after `main`, outside it, then delete any local skip link. The pill's `nav` now carries `labels.nav`; `data-testid="nav"` stays on the outer box.
  - `LanguageToggle`'s name lists the codes the post shows, such as "Language: English (EN FR)". Tests that match the old name exactly need the codes.
  - Footer links are at least `--size-tap-min` wide, `Wordmark` at least that tall, and breadcrumb links 24px tall. The `TocPill` counter uses full `--primary`. Sheets skip their open and close animations under reduced motion. `base.css` adds a focus outline under forced colors.
  - The light `--primary` is `#985000` (was `#A05500`) and `--primary-hover` `#7D4000` (was `#854500`), so primary text passes AA on tinted cards too. Tests pinned to the old values need the new ones. `@yesid/tokens` now tests its semantic contrast pairs, so products can delete their copies.
  - `@yesid/config/playwright`: `expectAccessible` also fails on a name that leaves out its visible text (WCAG 2.5.3). New `expectTapTargets(page, { exclude })` and `expectNoHorizontalOverflow(page, scrollers)`.

## 0.29.0

<!-- release-fragment: config-playwright -->
- `@yesid/config` (minor): Adds `@yesid/config/playwright`. `yesidProjects(baseURL)` returns the standard Playwright projects: `phone` (390×844), `tablet` (768×1024) and `desktop` (1440×900) for untagged tests, `reduced-motion` for tests tagged `@motion`, and `light` and `dark` (seeded through the `theme` localStorage key) for tests tagged `@theme`. `expectAccessible(page, { include, exclude })` fails a test on any serious or critical axe violation of WCAG 2.2 AA or axe best practice; the contrast rule skips blueprint art (`.blueprint-bg`). `@playwright/test` and `@axe-core/playwright` are optional peer dependencies: install them in the same package.json as `@yesid/config` (the workspace root in a monorepo), since a root package cannot see peers installed in a child workspace.

  Deprecates `@yesid/config/turbo/base.json` and the `@yesid/config/tsconfig/base.json` subpath, which have no consumer: each app commits its own `turbo.json`, and products extend `tsconfig/library.json` or `tsconfig/svelte-kit.json`, which keep their base. Replacement: keep your own `turbo.json`, and extend `library.json` or `svelte-kit.json`. Earliest removal: v0.31.0, and not before 90 days after v0.29.0 is published.

<!-- release-fragment: language-toggle-tap-size -->
- `@yesid/ui` (patch): `LanguageToggle`'s link keeps the 44px tap minimum (`--size-tap-min`) on phones. It was 38px wide below 480px and 26px below 360px; the drawing keeps its phone size inside the wider target.

<!-- release-fragment: seo-kit-highlight -->
- `@yesid/seo-kit` (minor), `@yesid/ui` (minor): `@yesid/seo-kit/highlight` adds `highlight(code, lang)`, server-side Shiki highlighting with the JavaScript regex engine. It resolves to token markup for a `<code>` element in `syn-*` classes, with no inline styles, and returns unknown languages escaped. `shiki` 4.x is a new optional peer dependency, needed only for this subpath. `@yesid/ui/base.css` colors the `syn-*` classes through the `--syntax-*` tokens. `CodeBlock`'s copy labels take an optional `copied`, and a polite status now announces `copied` or `failed` after a copy; the visible ✓ and failure label are unchanged.

## 0.28.1

<!-- release-fragment: article-header-still-grid -->
- `@yesid/ui` (patch): `ArticleHeader` holds its circuit grid still while the page scrolls. The grid is fixed to the viewport and clipped to the header, so it lines up with a fixed page grid instead of sliding over it. Nothing else in the header changes.

<!-- release-fragment: closer-phone-spacing -->
- `@yesid/ui` (patch): `ConstructionProps` with `layout="around-fixture"` now spaces its four artworks evenly on phones (below 768px). The order is balise, sign, a centred 40px gap for the caller's light, helmet, barricade, with equal gaps while the row fits its container (304px or wider); a narrower container shrinks the artwork to fit. Its phone rules now use a plain `(max-width: 767px)` query, so they apply without the consumer compiling `@custom-media`; consumers that already compile it get the same CSS. Artwork sizes, wider viewports and the other layouts are unchanged.

## 0.28.0

<!-- release-fragment: c1-carried-fixes -->
- `@yesid/tokens` (minor), `@yesid/motion` (minor), `@yesid/seo-kit` (minor), `@yesid/ui` (minor): `StateNotice` with a `role` is named by its title. `QuietModeButton` paints the remembered labels before hydration instead of flipping them when the app starts. A view transition that a reload cuts short no longer logs `AbortError: Transition was skipped`: `viewTransition` and the head boot script catch its `ready` promise, and `boot.json` carries the new hash. `@yesid/ui/blueprints` exports `BlueprintProps`, the props every drawing takes. `.circuit-grid` and `ArticleHeader`'s grid anchor their lines to the top-left corner, so the grid no longer slides when the page grows.

  Removed without a deprecation period under the owner's 2026-10-29 waiver of both DEPRECATION.md gates; neither app nor the Gallery imports any of them. `@yesid/motion` loses `./utils/sectionMagnet` and its root re-exports (`initSectionMagnet`, `findSettleTarget`, `DESKTOP_TIER`, `TOUCH_TIER`, `MagnetTier`, `SectionMagnetOpts`, `SettleTargetOpts`). `@yesid/tokens` loses `./serialize`, `./types`, `./generators/tokens-css`, `./generators/theme-css`, `./generators/motion-ts` and the legacy `./src/parse.ts`, `./src/generators/tokens-css.ts` and `./src/generators/motion-ts.ts` aliases. `@yesid/seo-kit` loses the `./satori` subpath; `renderSatoriPng` stays in the root export. `@yesid/ui` and `@yesid/ui/brand` stop exporting `flattenToc`, `landTocFragments` and `resolveTocCounter`, and `@yesid/ui/state` stops exporting `DESKTOP_MIN_WIDTH`. To migrate, there is nothing to change unless you imported one of these; `DetailFrame`'s `toc.landFragments` replaces a direct `landTocFragments()` call.

<!-- release-fragment: release-tgz-assets -->
- `@yesid/tokens` (minor), `@yesid/motion` (minor), `@yesid/gates` (minor), `@yesid/seo-kit` (minor), `@yesid/ui` (minor), `@yesid/analytics` (minor), `@yesid/i18n-core` (minor), `@yesid/config` (minor): Each package now ships as its own tarball on the GitHub Release (`yesid-<pkg>-X.Y.Z.tgz`), with a
  build-provenance attestation. Install them by URL instead of vendoring: see
  `docs/BUILD-A-YESID-PRODUCT.md`. `@yesid/ui` and `@yesid/seo-kit` take their sibling packages as
  peer dependencies pinned to the same release, so list every `@yesid` package the app uses.
  `@yesid/config` joins the lockstep version and the separate `config-v*` releases end. The adoption
  CLI, the `yesid.dev-design-vX.Y.Z.tar` archive and the schema-2 `manifest.json` are removed under
  the owner's 2026-10-29 waiver (see `DEPRECATION.md`).

## 0.27.0

<!-- release-fragment: analytics-always-on -->
- `@yesid/ui` (minor), `@yesid/analytics` (minor): `@yesid/analytics` measures without asking. `createAnalytics(preset, { domain })` (in `./client` and the root export) wraps the official `@plausible-analytics/tracker`, now a dependency: it captures pageviews, including client-side navigation, and returns `trackEvent`, typed to the preset's events. Only pageviews, engagement and the preset's custom events are sent, never custom properties or revenue, including events the tracker raises on its own (class-tagged clicks, `window.plausible`). It sends nothing unless `domain` is set and the page is served from that host or one of its subdomains, and it is a no-op without a browser location. Requests carry only the page path, bounded campaign tags and the referrer's origin; nothing is written to cookies or browser storage. `AnalyticsPreset` is now `{ events }`, and `svelte` is no longer a peer dependency.

  Removed without a deprecation period. The owner waived both DEPRECATION.md gates (90 days and the intervening minor) on 2026-10-29 for every removal below: there are no third-party consumers and both apps drop consent in this cycle. `@yesid/ui/feedback` loses `AnalyticsConsent`, `AnalyticsConsentCopy` and `AnalyticsConsentProps`, and `@yesid/ui` no longer depends on `@yesid/analytics`. `@yesid/analytics` loses `./consent` (`createAnalyticsConsentStore`, `probeDurableAnalyticsStorage` and their types), `./policy` (`getAnalyticsPolicy`, `normalizeAnalyticsControls` and their types), `./plausible` (`sendPlausibleEvent`, `PLAUSIBLE_ENDPOINT`, `PLAUSIBLE_REQUEST_TIMEOUT_MS` and their types), `createAnalyticsClient`, `createPathnamePageviewTracker`, `AnalyticsClient` and `AnalyticsClientDependencies` from `./client`, and `AnalyticsStorageKeys` with `AnalyticsPreset`'s `domain` and `storageKeys` from `./config`. Measurement no longer asks, so the consent parts have no replacement. To migrate, delete the consent UI, store, policy and their storage keys, drop `domain` and `storageKeys` from the preset, replace `createAnalyticsClient` and any pageview code with one `createAnalytics(preset, { domain })` call when the app mounts, and allow `connect-src https://plausible.io`.

## 0.26.0

<!-- release-fragment: p4-construction-props -->
- `@yesid/ui` (minor): Add ConstructionProps and ConstructionFloodlight: the four original Montréal construction artworks, optional warm lighting and lit/unlit fixtures, and a scroll-linked reveal beginning when the footer has entered 5% of the active viewport. Reduced motion switches instantly and no-JavaScript artwork stays visible.

## 0.25.3

<!-- release-fragment: p4-manifesto-strength -->
- `@yesid/ui` (patch): Quiet Manifesto circuit backgrounds uniformly through one shared strength default, including static nodes, pointer traces, warm glow and ripple ink. Preserve foreground and listing blueprint ink.

## 0.25.2

<!-- release-fragment: p3-header-copy-contrast -->
- `@yesid/ui` (patch): Protect listing-header glyphs with a solid page-colour shadow beneath their existing soft halo, preserving blueprint ink and header layout.

## 0.25.1

<!-- release-fragment: p3-listing-headers -->
- `@yesid/ui` (patch): `ListingFrame` draws every header drawing at one ink, `--blueprint-ink` on the art slot (0.32 dark, 0.5 light, a step bolder than before). It overrides the opacity `BlueprintShell` and inline styles give the drawings, so apps can delete their own listing-header opacities; an app rule that also forces opacity with `!important` must go. The header copy gets a halo in the page colour, and rests on the bottom of the band at every width; from 1024px without an `aside` it used to sit at the top.

## 0.25.0

<!-- release-fragment: p1-polish-review -->
- `@yesid/tokens` (patch), `@yesid/ui` (patch): `SiteHeader`'s menu line now runs from each item's icon to the next one, short viewports included. The token doctrine names conversion buttons as the only clickable yellow surface and underlined text links as yellow's second interaction.

<!-- release-fragment: p1-polish -->
- `@yesid/tokens` (patch), `@yesid/motion` (patch), `@yesid/ui` (minor), `@yesid/i18n-core` (patch): Polish from the owner's review of both sites. `SiteHeader` menu items take an optional `icon` (a Lucide icon component) that replaces the stop and lights up on the current page, and the menu footer now defaults to "Navigation · All routes" in the language's locale (en, fr, es); `labels.menuFooter` still replaces it, and an empty string hides it (before, an omitted label hid the footer). `@yesid/ui/base.css` makes every link without a class a text link: underlined, in `--accent-text` (yellow in dark, amber in light), with a thicker underline on hover; component links keep their own styles. `ArticleHeader` centers the back link between the chrome and the next line, drops its fixed minimum height and sizes the title with `--text-title` (smaller at every width, and density-aware); apps whose `--chrome-offset` leaves a gap under their chrome set `--chrome-gap`. `SurfaceRail`'s phone sheet now opens centred instead of sliding in from the right. `@yesid/i18n-core`'s `localizeHref` keeps a query or hash while switching the locale (`/fr?provider=stm` now localizes to `/?provider=stm`) and decides path exemptions without them. `@yesid/motion`'s `blueprintScrub` redraws when its trigger resizes, so content rendered after mount no longer leaves a stale first draw. The token doctrine now names underlined text links as a yellow (`accent-text`) job. To migrate, delete local text-link styles and the classes that only styled links, move any typography those rules set onto the surrounding element, pass `icon` per menu item, and drop a menu-footer label that repeats the default.

## 0.24.0

<!-- release-fragment: ds7-brand-surfaces -->
- `@yesid/tokens` (minor), `@yesid/motion` (minor), `@yesid/ui` (minor): The brand surfaces move into the packages. `@yesid/ui/brand` adds `TerminalPanel`, the terminal window (signal-head title bar with `title`, `tag`, `status` and an `actions` snippet, a hazard rule, the body and an optional `footer` readout), `CodeBlock`, which shows source in a `TerminalPanel` with the language as its tag and an optional copy button and takes the app's highlighted `<pre>` as `children`, and `ManifestoCanvas`, the circuit-node backdrop of brand headers (static under reduced motion). `ArticleHeader` now renders a `ManifestoCanvas` by default; its `canvas` snippet replaces it, and an empty snippet leaves the header plain. `@yesid/ui/base.css` styles the terminal and code-block classes (`.terminal-*`, in the components layer), so markup rendered on the server can wear the same chrome. `@yesid/ui/blueprints` (new) exports 40 blueprint drawings in `currentColor`, such as `BlueprintBridge` and `BlueprintSignal`; `BlueprintBusSide` takes the fleet's `operator`. `.led-pulse` now stops under reduced motion, as documented. `@yesid/tokens` adds the `syntax` group (`--syntax-keyword`, `-string`, `-number`, `-function`, `-comment`, `-punctuation`, `-plain`), aliases of the brand voices for code highlighting. `@yesid/motion/utils/blueprintScrub` (new) exports `blueprintScrub(band, trigger = band)`, which draws a header's blueprint art as `trigger` scrolls through the viewport; it fits `ListingFrame`'s `onHeaderMount`. To migrate, delete local manifesto canvases and the `canvas` snippets that pass them, local terminal panels and their CSS, code blocks, blueprint scrubs and drawings, import these instead, and color highlighters through `--syntax-*`.

  Removed, with the owner's waiver of the 90-day wait (the intervening-minor requirement is met for every removed contract, and neither consumer uses them): `@yesid/tokens/generators/theme-block` and its legacy `./src/generators/theme-block.ts` alias (`generateThemeBlock`, `replaceThemeRegion`; deprecated in v0.18.0, use `@yesid/tokens/theme.css` or `generateThemeCss`), `MetroStation`'s `roundel` snippet (deprecated in v0.19.0; the default roundel is the one every product uses), and `QuietModeInit` with its `storageKey` plus `SiteRootProps.quietModeKey` (deprecated in v0.22.0; quiet mode always uses the standard `quiet-mode` key, the one the boot script reads). To migrate, delete any use of them.

## 0.23.0

<!-- release-fragment: ds6-foundation-primitives -->
- `@yesid/ui` (minor), `@yesid/analytics` (minor): `@yesid/ui` adds the parts of a data page. `@yesid/ui/feedback` (new) exports `StateNotice`, a quiet empty, error or status notice in five presentations and four tones, and `AnalyticsConsent`, the consent rail for an `@yesid/analytics/consent` store with the product's copy, controls and privacy link. `@yesid/ui/table` (new) exports `DataTable`, a captioned table from column definitions that stacks into label and value pairs or scrolls sideways on narrow screens; a scrolling table that overflows becomes a focusable region named by its caption. `@yesid/ui/layout` adds `Surface`, `Masthead`, `Breadcrumb` (a named trail with the current page last), `ControlsRail`, `DashboardGrid` and `SurfaceRail` (a sticky rail from 1024px, a pill and bottom sheet below). `@yesid/ui/brand` adds `CornerMeta`, `SegmentedChoice` (a single choice with radio-group keyboard behavior) and `ToggleChip` (a controlled `aria-pressed` pill). `@yesid/ui` now depends on `@yesid/analytics`. `@yesid/analytics/vitals` (new) holds the web-vitals beacon schema and `startVitals({ endpoint, load })`, which collects Core Web Vitals once per page and sends one beacon when the page is hidden; `load` supplies the `web-vitals` module. To migrate, delete local copies of these parts and import them from the packages; static pills use `Badge variant="tag"`.

## 0.22.0

<!-- release-fragment: ds5-i18n-and-format -->
- `@yesid/ui` (minor), `@yesid/i18n-core` (minor): `@yesid/i18n-core` adds `createIntl`, which binds each app locale to an Intl tag and returns cached `number`, `dateTime`, `collator` and `plural` Intl objects plus `relativeTime` (a signed offset in seconds read in its largest whole unit, with Intl's own "now" under 5 seconds), and `createCopy`, which returns a `defineCopy` that type-checks every locale against a source locale's keys and signatures. `@yesid/ui/state` adds `clock`, a shared wall clock (1 s tick while subscribed, 30 s under reduced motion, paused in hidden tabs) with a server-time anchor, and `createLocaleContext`. `SiteRoot` takes `lang` and keeps `<html lang>` current after client navigation. A remembered quiet mode now paints right on reload: the head boot script closes every section that follows quiet mode (marked `data-quiet`) before first paint, and `SiteRoot` restores quiet mode before its children render, so they hydrate closed. `@yesid/ui/boot.json`'s hash changes. Importing `@yesid/ui/state` no longer throws where there is no `window` (a node test that loads Svelte's client build); `desktop.current` reads false there. Deprecated: `QuietModeInit.storageKey` and `SiteRootProps.quietModeKey`, because the boot script only reads the standard `quiet-mode` key; a custom key keeps working, but what the boot script paints can disagree with it until hydration. They stay through v0.23.0: removal is no earlier than v0.24.0 and 90 days after this release is published. To migrate, delete local formatter caches, relative-time tables, locale-context code, `<html lang>` effects and clock stores, bind `createIntl`, `createCopy` and `createLocaleContext` once per app, pass `lang` to `SiteRoot`, drop any `quietModeKey`, and take the new `boot.json` hash into a hash-based CSP.

## 0.21.0

<!-- release-fragment: ds4-head-seo-assets -->
- `@yesid/seo-kit` (minor), `@yesid/ui` (minor): `@yesid/ui/head` adds `SeoHead`, which writes a page's title, description, canonical and hreflang, Open Graph, Twitter, robots and one `@graph` JSON-LD script from resolved values, and `injectThemeBoot`, which swaps `%yesid.themeBoot%` in `app.html` for the pre-paint script. That script sets the stored theme and, as the parser adds them, the stored open or closed state of persisted collapsibles, so a reload no longer paints a closed section open. `@yesid/ui/boot.json` carries the script's CSP hash. `CollapsibleSection`, `FilterGroup` and `ListingFrame` mark their state with `data-persisted-key` and `data-persisted-body`; `ChevronToggle` and `FilterGroup` style from `data-state` instead of the `chevron-open` and `filter-open` classes. The theme store also repaints `link[rel="icon"]` with the brand mark in `--primary`. `@yesid/seo-kit` adds `serializeJsonLd`, `robotsTxt`, the share card (`./og` with `renderOgPng` and the token palette, `./og/fonts` for Vite and `./og/files` for Bun scripts, with Inter and JetBrains Mono TTFs), `./icons` (`brandMarkSvg`, `touchIconSvg`) and `./headers` (`SECURITY_HEADERS`, `contentSecurityPolicy`). To migrate, replace the app's SeoHead, OG template and fonts, favicon builder and app.html theme script with these, and change any test that reads `chevron-open` or `filter-open` to read `data-state` or `aria-expanded`.

## 0.20.0

<!-- release-fragment: ds3-site-header -->
- `@yesid/ui` (minor): `@yesid/ui/layout` adds `SiteHeader`, the floating pill header with the full-screen metro-line menu: wordmark, `links` (with `priority` 2 and 3 folding them away below 500px and 1024px of header width), an optional `search` snippet from 1024px, an `actions` snippet, and the theme, language and menu controls. It takes `beforeNavigate`, `onNavigate` and `afterNavigate` from `$app/navigation` as its `navigation` prop. `--site-header-inset-end` makes room for a docked side panel. `@yesid/ui/brand` adds `Wordmark`, `LanguageToggle` (the signpost; the app supplies each locale's `href`, and `preserveState` keeps scroll then resets focus) and `resetFocusAfterNavigation`. `@yesid/ui/base.css` now defines the header geometry (`--nav-top` through `--nav-clearance`); `--chrome-offset` stays app-owned. To migrate, replace the app's nav, menu overlay, language switch and wordmark with these and delete the app's copies of the `--nav-*` variables.

  `ArticleHeader` is about 25% shorter again at the owner's request: tighter padding and gaps around the same title, meta and controls (minimum height 240px from 1024px wide, 220px below).

## 0.19.1

<!-- release-fragment: toc-landing-line -->
- `@yesid/ui` (patch): TOC jumps land on the active-section line. `navigateToc` and `revealTocTarget` (with the default `block: 'start'`) now place the target a quarter down the viewport instead of flush under the site chrome, and `observeActiveToc` reads that same line, so after a jump the pill counter and the highlighted entry name the section the reader picked. App scroll margins no longer affect TOC jumps. No API changes.

## 0.19.0

<!-- release-fragment: ds2-adoption-sweep -->
- `@yesid/motion` (minor), `@yesid/ui` (minor): The package defaults take the settled looks, so consumers can delete their adapters. `Card` has a lit top bevel and adds `shadow-section` on hover. `Button` adds the `conversion` variant (yellow signage CTA with an amber lift at cta sizes) and the 44px `icon-tap` size, uses `text-sm`/`text-xs`, and keeps a caller's `data-slot`. The resizable handle is neutral, the hazard `Separator` is full width by default, `StickyPanel` is `surface-3` with no shadow and chains wheel scrolling through `scrollChain`, `TerminalCursor` is `accent` in dark, and the `MetroStation` default roundel matches the signage Badge, so its `roundel` snippet is deprecated: omit it to get the default. It keeps working, and the earliest removal is the later of 90 days after the v0.19.0 publish date and v0.21.0. `ArticleHeader`'s subtitle now uses the meta row's mono type, and both use the larger `--article-meta-size`. `@yesid/ui/base.css` adds the View Transitions route crossfade, off under reduced motion. `@yesid/motion/utils/gsap` adds `loadDrawSVG`, `loadMorphSVG` and `loadCustomEase`; `@yesid/motion/utils/viewTransition` exports `viewTransition` for `onNavigate`. To migrate, delete local Card, Button, resizable handle, StickyPanel, TerminalCursor, MetroStation and hazard-separator adapters, local GSAP loaders and route fades, and call `onNavigate(viewTransition)` from the root layout.

## 0.18.0

<!-- release-fragment: tokens-one-source -->
- `@yesid/tokens` (minor), `@yesid/ui` (minor): Make the tokens the one source for the Tailwind theme, fonts and density. `@yesid/tokens` adds `theme.css` (the Tailwind `@theme` map plus the semantic color utilities, from the new `@yesid/tokens/generators/theme-css` `generateThemeCss`), `fonts.css` with bundled Inter and JetBrains Mono latin and latin-ext files (OFL), `preloadFont` from `@yesid/tokens/fonts`, new tracking, measure, glass blur, `size.tap-min` and `z.footer` tokens, and a `density.compact` group that `tokens.css` emits as a `[data-density="compact"]` block. `@yesid/ui/base.css` now imports `@yesid/tokens/theme.css`, adds `.glass-chrome`, and `.label-section` reads `--tracking-eyebrow`. To migrate, delete the pasted TOKENS region, any `@theme inline` color map and duplicate `--font-*` variables from the app stylesheet, import `@yesid/tokens/fonts.css` from the root layout, preload with `preload: ({ type, path }) => type !== 'font' || preloadFont(path)` in SvelteKit's `resolve`, and have dense apps such as Transit set `data-density="compact"` on `<html>`. Deprecated in v0.18.0: `generateThemeBlock` and `replaceThemeRegion` from `@yesid/tokens/generators/theme-block` (and the legacy `./src/generators/theme-block.ts` alias); the replacement is `@yesid/tokens/theme.css` or `generateThemeCss`. They keep working, and the earliest removal is the later of 90 days after the v0.18.0 publish date and v0.20.0, since v0.19.0 is the intervening minor.

## 0.17.0

<!-- release-fragment: detail-footer-error-frames -->
- `@yesid/ui` (minor): Add the shared detail, footer and error frames. `@yesid/ui/layout` now exports `DetailFrame` (header, hazard rule, toolbar, left rail or a caller-owned `rail`, center, right rail, `after`, TOC tracking and `TocPill`), `ArticleHeader` (no tag pills; `highlight` accents one title keyword; `canvas`, `decorations`, `actions` and `controls` snippets; about 25% shorter; decorative text at `--article-deco-opacity`, 0.25), `SiteFooter` and `ErrorPage`, with their prop types. `@yesid/ui/brand` adds `ErrorIllustration`, whose sign text comes from `code` and `signLabel`. `@yesid/ui/base.css` now carries the semantic `@theme inline` color utilities and the small-screen metric-value size. To migrate, render `DetailFrame` and `ArticleHeader` from detail pages (pass the app's background canvas through `canvas` and its quiet-mode button through `controls`), `SiteFooter` from the root layout and `ErrorPage` from `+error.svelte`, pad full-bleed detail pages' tops by `--chrome-offset`, keep `afterNavigate(onTocNavigate)` in the app, delete the local shells, headers, footer and error illustration, and drop the color map from the app stylesheet.

## 0.16.0

<!-- release-fragment: listing-frame -->
- `@yesid/ui` (minor): Add the shared listing frame. `@yesid/ui/layout` now exports `ListingFrame`: edge title, accent rail, blueprint header, hazard rule, a filter column and the results. From 1024px its filter panel is always shown, so desktop filters work before hydration and without JavaScript. Below 1024px a toggle opens it, with the open state kept under `persisted:<filterPersistKey>`. `onHeaderMount(header, frame)` starts header motion such as a scroll scrub and returns its cleanup. The frame offsets itself by `--chrome-offset`. `@yesid/ui/brand` adds `FilterGroup`, `FilterSection`, `FilterSummary` and `SearchInput` with their prop types; they hold no product wording, so `FilterGroup` takes `allLabel`, `FilterSummary` takes `countLabel`, `locale` and `clearLabel`, and `SearchInput` takes `label`. To migrate, render `ListingFrame` from the listing page, pass the search field and filters as snippets, define `--chrome-offset` if the app names its chrome height differently, and delete the local shell, filter components and listing CSS. `FilterGroup` has no `joined-grid` variant; render a segmented control directly instead.

## 0.15.0

<!-- release-fragment: navigation-brand-atoms -->
- `@yesid/motion` (minor), `@yesid/ui` (minor): Add table-of-contents navigation and brand atoms. `@yesid/ui/brand` now exports `CollapsibleSection`, `CornerMarks`, `MetricDisplay`, `SectionHeading`, `SectionIcon`, `StatusDot`, `TocNav` and `TocPill` with their prop types, plus the toc helpers `TOC_TARGET_SELECTOR`, `flattenToc`, `landTocFragments`, `navigateToc`, `observeActiveToc`, `onTocNavigate`, `openCollapsedTocTarget`, `reconcileActiveToc`, `resolveTocCounter`, `revealTocTarget`, `settleLayout` and `tocElement`. `@yesid/ui/state` adds `persisted`, tab-scoped state whose values must be locale-free. `@yesid/motion` adds `./lenis.css`, which `@yesid/ui/base.css` now imports. `CollapsibleSection` follows quiet mode by default and stores only reader choices under `persisted:<sectionKey>`. `TocPill` defaults `onNavigate` to `navigateToc`, which jumps under reduced motion. To migrate, import from `@yesid/ui/brand` and `@yesid/ui/state`, delete the local copies, and drop any direct `lenis/dist/lenis.css` import. Drop `closeSignal`, `bulkCollapsed` and any `openSignal` fed from quiet mode: the default follows quiet mode, and `quiet={false}` opts out. Keep `openSignal` only for opens the reader triggers, and remove quiet-mode terms from combined signals, because every change counts as a reader click and is stored. Pass Transit-style absence text through `MetricDisplay`'s `absent` snippet.

## 0.14.1

<!-- release-fragment: lenis-registers-scrolltrigger -->
- `@yesid/motion` (patch): `initLenis` now registers ScrollTrigger before it reads `ScrollTrigger.isTouch`. Before, Lenis started on touch devices whenever the app had not yet called `initScrollTriggerConfig()`, which is the case when `SiteRoot` mounts before the app's own `onMount`. Apps that already call `initScrollTriggerConfig()` first are unaffected.

<!-- release-fragment: rune-modules-prebundle -->
- `@yesid/ui` (patch), `@yesid/analytics` (patch): Fix consumer Vite dev servers. vite-plugin-svelte pre-bundles vendored `.svelte.ts` modules without stripping TypeScript, so the `@yesid/ui/state` stores failed with `Unexpected token` under `vite dev`. Production builds were unaffected. The two rune modules now ship as `.svelte.js` with `.d.ts` declarations beside them, and `@yesid/analytics/consent`, which uses no runes, moves to a plain `consent.ts`. Public subpaths and types are unchanged.

## 0.14.0

<!-- release-fragment: adoption-release-safety -->
- `@yesid/tokens` (patch), `@yesid/motion` (patch), `@yesid/gates` (patch), `@yesid/seo-kit` (patch), `@yesid/ui` (patch), `@yesid/analytics` (patch), `@yesid/i18n-core` (patch): Harden adoption path validation with identity-bound, token-scoped recovery evidence, and carry the existing LICENSE, NOTICE, and TRADEMARK.md bytes through coordinated archives and installed vendor trees starting at v0.13.4 while preserving older immutable archive layouts.

<!-- release-fragment: gate-filesystem-safety -->
- `@yesid/gates` (patch): Make comment scanning linear and bounded, and make stable-tree filesystem traversal deterministic, resource-bounded, explicit about rejecting observed links, and portable across POSIX and Windows path semantics.

<!-- release-fragment: runtime-contracts -->
- `@yesid/motion` (patch), `@yesid/analytics` (patch): Bind ticker disposers to their own registration and contain analytics hostname and listener-teardown failures in the unavailable consent state.

<!-- release-fragment: site-root-foundation -->
- `@yesid/motion` (minor), `@yesid/ui` (minor): Add the shared app root and its state. `@yesid/ui/layout` exports `SiteRoot`, which initializes the theme and quiet mode and owns the Lenis lifecycle. `@yesid/ui/state` exports the `theme`, `quietMode`, and `desktop` stores, `@yesid/ui/brand` adds `ThemeToggle`, and `@yesid/ui/base.css` holds the base layer both products share. `QuietModeButton` state and actions now default to the shared store, and existing controlled usage is unchanged. `@yesid/motion` exports `scrollChain` from `./actions`, and `initLenis` accepts an optional `{ wrapper, content }` element scroller. Both packages move their `happy-dom` dev dependency to `^21.0.4`. Migration: wrap the root layout in `SiteRoot`, import `@yesid/ui/base.css` after Tailwind, and delete the local theme and quiet-mode stores, `ThemeToggle`, and `scrollChain` copies.

## 0.13.3

<!-- release-fragment: architecture-efficiency-pass-2 -->
- `@yesid/tokens` (patch), `@yesid/motion` (patch), `@yesid/gates` (patch), `@yesid/seo-kit` (patch), `@yesid/ui` (patch), `@yesid/analytics` (patch), `@yesid/i18n-core` (patch): Give every coordinated package a local ownership contract covering its interface, invariants,
  consumers, commands, failure modes, deterministic rules, and release implications. Remove
  duplicated tokens and motion narration from package manifests after those facts move to the
  nearest README. Make style-regression scans read each source file once while preserving finding
  order, diagnostics, and caller-owned RegExp state.

## 0.13.2

<!-- release-fragment: postphase3-contract-docs -->
- `@yesid/tokens` (patch), `@yesid/ui` (patch): Move fluid-token and UI compatibility guidance into durable package contracts without changing public APIs, runtime behavior, or token values.

<!-- release-fragment: postphase3-lineage-cleanup -->
- `@yesid/tokens` (patch), `@yesid/motion` (patch), `@yesid/ui` (patch): Remove historical lineage labels from package comments and token descriptions without changing APIs, behavior, or token values.

## 0.13.1

<!-- release-fragment: absolute-ui-guide-link -->
- `@yesid/ui` (patch): Fix the vendored UI README link to the immutable v0.13.1 product setup guide.

## 0.13.0

<!-- release-fragment: 035-footer-ripple-strip -->
- `@yesid/tokens` (minor), `@yesid/motion` (minor), `@yesid/ui` (minor): Add the footer leaf primitive subpath, the opt-in global ripple utility and stylesheet subpaths, and the semantic strip-height token with its public CSS output.

## 0.12.0

<!-- release-fragment: p2-i18n-core -->
- `@yesid/i18n-core` (minor): Add consumer-configured locale-routing mechanics with injected locale values, route exemptions, route-segment syntax, and URL-state preservation semantics.

## 0.11.1

<!-- release-fragment: p2-wordmark-autoplay-cleanup -->
- `@yesid/motion` (patch): Cancel delayed wordmark autoplay and active GSAP timelines when the motion action is destroyed.

## 0.11.0

<!-- release-fragment: i1-neutral-analytics -->
- `@yesid/analytics` (minor): Add neutral consent-aware analytics policy, sanitization, client, and injected Plausible transport primitives.

## 0.10.0

<!-- release-fragment: d1-canonical-breakpoints -->
- `@yesid/tokens` (minor): Add canonical tablet and desktop min/max breakpoint tokens and generated custom-media aliases for reusable consumer media queries.

## 0.9.0

<!-- release-fragment: d3-quiet-mode-button -->
- `@yesid/ui` (minor): Add the controller-neutral `QuietModeButton` brand component with caller-owned copy, state, actions, and an explicit optional glow effect.

## 0.8.0

<!-- release-fragment: i2-seo-foundation -->
- `@yesid/gates` (minor), `@yesid/seo-kit` (minor): Add framework-neutral JSON-LD, sitemap, and injected-rasterizer Satori primitives, plus reusable sitemap and Open Graph coverage engines.

## 0.7.1

<!-- release-fragment: reduced-motion-resubscribe -->
- `@yesid/motion` (patch): Refresh the OS reduced-motion preference when the store gains its first subscriber so preference changes while idle never leave later consumers with a stale animation policy.

## 0.7.0

<!-- release-fragment: u1-package-contracts -->
- `@yesid/tokens` (minor), `@yesid/motion` (minor), `@yesid/gates` (minor), `@yesid/ui` (minor): Move the four vendorable packages to one lockstep release, publish explicit conditioned source and opt-in CSS exports, tighten UI props to rendered behavior, and make UI configuration single-assignment per ESM module graph.

<!-- release-fragment: u2-token-ownership -->
- `@yesid/tokens` (patch): Make token generation a pure logical engine, keep repository paths in the private adapter, and establish `@yesid/tokens/tokens.css` as the single committed public CSS artifact.

<!-- release-fragment: u3-policy-neutral-gates -->
- `@yesid/gates` (minor): Remove product-named preset subpaths and policy tables, require consumers to provide their own brand hex policy, and expose only pure parameterized gate engines with app-neutral defaults.

<!-- release-fragment: u4-verified-adoption -->
- `@yesid/tokens` (minor), `@yesid/motion` (minor), `@yesid/gates` (minor), `@yesid/ui` (minor): Replace schema-1 shallow-clone adoption with schema-2 immutable Release acquisition, deterministic trust receipts, atomic installation, durable rollback and recovery, stable operational exits, and offline verification by the vendored tool bundle.

<!-- release-fragment: u5-ui-accessibility -->
- `@yesid/ui` (patch): Preserve semantic foreground utilities across every typography token, keep filtered combobox keyboard selection and listbox relationships accessible, and make scrollable UI surfaces keyboard reachable.
