# Architecture decisions

This file records the current public architecture contracts. Historical release detail remains
available in Git history and `CHANGELOG.md`; it does not govern the current package surface.

## D1: The parity anchor is immutable

`v0.1.0` is the byte-faithful parity release extracted from yesid.dev commit
`2bdb611d91749dc437c07586cb82129eabe9dfec`, subject only to the deviation register in
[that release's README](https://github.com/yesid-dev/yesid.design/blob/v0.1.0/README.md).
The tag never moves. Later releases advance from that reference rather than rewriting it.

## D2: Consumers install exact release tarballs

Each release attaches one `bun pm pack` tarball per package, and consumers install them by URL from
an exact tag; the lockfile's integrity hash is the pin. The immutable GitHub Release and its
build-provenance attestation replaced the vendored snapshot, adoption tool and manifest in v0.28.0.

## D3: Eight packages release in lockstep

The root version and all eight packages, `@yesid/config` included since v0.28.0, move together and
nothing floats; the private Gallery stays outside. Sibling packages are peer dependencies pinned to
the same release, so each app holds exactly one copy of each.

## D4: Packages ship source and CSS is opt-in

Package exports resolve source TypeScript and Svelte through explicit conditional exports.
Imported CSS is declared as a side effect, but no package enables styling automatically.
`@yesid/tokens/tokens.css`, `@yesid/motion/tap-feedback.css`, and
`@yesid/motion/ripple.css` are deliberate public subpath imports. Consumers may keep a reviewed
copy only when their Tailwind layer or build boundary requires local ownership.

## D5: UI contracts match rendered ownership

Public UI props describe the element, state, and content a component actually owns. Native
attributes and refs follow the rendered element; controlled components leave state, actions,
copy, persistence, and locale policy with the consumer. `configureUi` accepts one normalized
application vocabulary per ESM module graph: an equivalent repeat is unchanged, a conflicting
repeat throws, and first `cn` use locks the zero-configuration default. Request-, tenant-, user-,
or locale-scoped configuration is not allowed.

## D6: Token generation is pure upstream and path-owned downstream

`packages/tokens/src/build.ts` is a pure content engine with no filesystem or consumer-checkout
knowledge. `tools/build-tokens.ts` owns repository paths, public UI inventory discovery and
write-if-changed outputs, and `--check` reports drift. From the same token source it writes four
committed artifacts: `packages/tokens/tokens.css` (plain custom properties),
`packages/tokens/theme.css` (the Tailwind `@theme` layer), `packages/motion/src/tokens.ts` and
`DESIGN.md`.

## D7: Gate engines are policy-neutral

`@yesid/gates` exports pure parameterized engines, types, and app-neutral defaults. Palettes,
thresholds, forbidden patterns, allowlists, markers, exclusions, and expected results remain
consumer-owned policy. App names, app presets, and product doctrine do not enter production gate
source.

## D8: Locale mechanics are shared; locale policy is local

`@yesid/i18n-core` owns pure configured prefix parsing, path localization and delocalization,
URL-state preservation, locale-switch detection, route-id normalization, cached Intl formatting with
relative time, and copy typing. `@yesid/ui` owns the Svelte locale context and `<html lang>` sync.
Consumers own their locale type and supported, default, prefixed, and published values; Intl tags;
copy and fallback policy; route exemptions; SvelteKit adapters; request fallback; and runtime
flags. The exception is the language signpost display and cycle order, owned by `@yesid/ui`
under D18. i18n-core contains no framework import, virtual module or product locale registry.

## D9: Global ripple is explicit and optional

`@yesid/motion/utils/globalRipple` exposes the shared pointer-feedback utility and
`@yesid/motion/ripple.css` exposes its visual contract. Neither is a Svelte action, and neither
runs or injects CSS on import. Consumers explicitly initialize the utility, import the
stylesheet, and supply any live exclusion selector.

Reading surfaces never ripple: anything inside `[data-ripple-exempt]` is skipped whether or not a
consumer passes `exclude`, and `exclude` adds to that rule rather than replacing it. Products mark
articles, editorial cards, charts and maps with the attribute so feedback stays on navigation and
controls while people read or explore data.

## D10: Fluid clamp tokens stay structured at the source

Fluid values use the `yesid.clamp` extension with structured `min`, `preferred`, and `max`
strings. Parsing rejects incomplete triples. CSS and ordinary YAML serialization produce
`clamp(min, preferred, max)`.
`DESIGN.md` typography uses the structured maximum because its font-size schema accepts one
dimension; spacing may retain the quoted clamp expression. This preserves the three inputs for
deterministic targets without pretending that clamp is a native DTCG dimension.

## D11: UI compatibility is owned by durable package and consumer contracts

`packages/ui/README.md` owns the shared component behavior and the known consumer compatibility
seams. Product conflicts never become
app checks in the package: the owner settles each one and the package ships the single look
(the current component contracts are documented in the UI README).

Shared controlled views own only their rendered mechanics. Consumers continue to own copy,
locale selection, state, persistence and actions, such as StopLabel prefixes. Package and
Gallery tests prove the neutral surface; every consumer bump still requires the consumer's source
guards, generated outputs, tests, build, accessibility checks, and relevant browser comparison.

## D12: Gallery is the repository browser authority, not consumer proof

Gallery dogfoods the workspace packages and owns repository-level rendered integration,
accessibility, reduced-motion and responsive checks. It does not install the
immutable Release asset and cannot prove a Transit or yesid.dev bump. Release integrity and
each product's verification remain separate gates.

## D13: Each package README documents its own contract

Each package README states what the package owns, how to use it and the rules it keeps. The root
README is an index, and the generated API reports remain the interface authority. Package READMEs
link repository files at the release tag, so the copy installed in `node_modules` never points at a
moved file. Gallery has its own README because it is a private app that is never released.

## D14: Two consumers are enough to promote a component

The owner changed [principle 4](README.md#principles) on 2026-10-26: a component or composed
pattern promotes once two independent products need the same contract. The rule of three left every frame and composed
component duplicated in Transit and yesid.dev while they waited for a third product. The copies
drifted, and each carried fixes the other lacked. Principle 1 still holds: a difference that cannot be a
prop with a default stays in the app.

## D15: The expand-all control remembers one site-wide choice

On both products, pages with a bulk control and at least two collapsible content sections start
expanded on a first visit, with a neutral control. After Collapse all the control is orange, with
`activeEffect="glow"`; expanded content clears that active state. A visitor's bulk choice wins on
later pages and visits. Under owner answer 5A (2026-11-13), a page may opt chosen optional
content sections into `firstVisitClosed`. With no valid saved choice those sections start closed;
other sections retain the expanded default. A saved Expand all or Collapse all still wins.
The main answer stays outside collapsible bodies; `independent` is not an escape from bulk choice.
`sections-choice` in origin-local localStorage holds only `collapsed` or `expanded`, written by
bulk actions. Individual section toggles affect that view only. There is no page or section key,
cookie, server state or CMS setting. Malformed values use the first-visit default without repair.

The TOC starts open and keeps its independent toggle. Filter groups, listing panels, static
cards and `independent` panels, including Transit's map tools, stay outside the bulk action and
its count. Below two content sections the control stays hidden and sections use declared defaults.
A table-of-contents or fragment jump opens its target and enclosing sections without writing the
choice. Back and locale reading-position restoration remain the product's responsibility.

The head boot script applies initial geometry before paint; hydration adopts it without changing
layout. The server sends complete, readable section bodies. Without JavaScript they stay readable;
if storage access throws, opted sections start closed and other interactive sections use declared defaults. Old `persisted:*` disclosure
keys and `quiet-mode` are ignored. The owner approved this contract on 2026-11-05 and changed
the first-visit default from collapsed to expanded on 2026-11-07.

## D16: Consumers own navigation setup and header copy

`SiteHeader` and `LanguageToggle` ship no built-in English, French or Spanish header or language
copy. Each app supplies that copy from its own local locale files, outside the CMS.

Call `createNavigationLifecycle` once during initialization of the persistent app layout and
pass the resulting instance to `SiteHeader` across route changes. `subscribeNavigation` is optional:
Kit 3 apps omit it and use the safe fallback, where a language switch that lands on a redirect
closes the menu. A supplied adapter must publish every accepted start; partial streams are
unsupported. Kit 3 is the supported app target.

## D17: Primitives are owned code

The primitives are owned code derived from shadcn-svelte under MIT, with no CLI,
registry or package dependency. Token names such as `--card` and `--muted` remain
brand vocabulary. A primitive stays only while a product uses it or it holds real behavior.

## D18: The toggles and language order are brand identity

The language signpost and theme toggle are part of yesid.design's identity. The owner decided
on 2026-11-13 that the system owns the language order: English, French, Spanish, then English
again. `@yesid/ui` exports `LANGUAGE_ORDER` and orders supported known locales accordingly;
other locales follow in the order the product supplies. Products choose their supported languages,
default and copy. D8 and D16 otherwise remain unchanged.

## D19: The toggles always sit in the navbar pill

The owner decided on 2026-11-14 that the theme toggle and the language toggle sit in the navbar
pill at every width, in every product, and never move into the menu. They show no visible label;
their accessible names keep the theme wording and the language name. SiteHeader therefore keeps
both controls in the pill, its link priorities leave room for them (priority 2 from a 600px
header), and links that do not fit leave a whole priority at a time so the toggles stay put.
`compactControls`, which moved them into the menu below 600px, is deprecated from v0.44.0 and
stays functional until removal. D18 still governs the toggles' look, behaviour and order.

## D20: Page types

The owner ruled on 2026-11-15 that every product classifies each page by type, a separate axis
from register:

- **Editorial pages** are the entries of a collection: on yesid.dev, a project case study and a
  blog article. All editorial pages share one design.
- **Listing pages** list a collection, such as projects or the blog. All listing pages share one
  design: the listing design the owner built.
- **Marketing pages** are home, services (with their detail pages) and About: a canvas for unique
  layouts, built only from yesid.design components; never overrides their styles. "Free for all"
  means free composition, not free styling (owner, 05:58 UTC): each page uses the components and
  their options as they are, such as the static surface for something static and the interactive
  surface for something that acts.
- **The contact page** is its own type, the same in every product and domain.
- **A dashboard** is a live map or data view, such as Transit's, with its own patterns.
- **Task pages** are yesid.login's sign-in and account screens (assumed, owner to confirm).

Across products, an editorial page uses yesid.dev's editorial design and a listing page uses
yesid.dev's listing design; Transit likely has one editorial page, and everything else in Transit
is the dashboard. Every product shares the brand pieces: the header and its toggles, cards and
their hover, the section dividers, buttons and links.

The type sets a page's default register (`docs/DOCTRINE.md`, section 4): editorial and listing
are reading; marketing is expressive within the doctrine, and a long-text region on a marketing
page may declare reading; contact, dashboard and task pages are task. A page or region that needs
another register declares it with `data-register`, as before.

**Why.** In the owner's words, "we have to start using the right vocabulary and putting things in
the correct place." Named types give each shared design one home, so pages of one type stop
drifting apart and Transit reuses yesid.dev's designs instead of copying them.

**Consequences.** A change to the editorial or listing design changes every page of that type in
every product. Marketing pages compose freely, but only from yesid.design components, their
options and the signatures listed in the doctrine, never overriding their styles. Dashboard patterns stay product-owned until two products need
the same contract (D14).

Legal pages and page not found or error pages: type to be given by the owner.

## D21: Interactive and static surfaces

The owner decided on 2026-11-15 that every product has two kinds of card or surface, so all
products feel the same under the pointer:

- **Interactive**: the card is a link or control, or contains them, such as a project card with
  Case study, Website and Repo links. It reacts on hover and on keyboard focus, whether on the card
  itself or on a link or control inside it, with a slight lift (none under reduced motion) and its
  edge lighting up and firming. The reaction is identical in light
  and dark, with no glow and no shadow. A card's own links stay the real targets: no whole-card
  link wrapping other links, and no interactive element nested inside another (owner, 06:20 UTC).
- **Static**: nothing to click. It never reacts to the pointer.

PR 239 delivers this. `Card interactive` lifts 1px (not under reduced motion) and firms its edge
on hover, on keyboard focus of the card or of a whole-card link that wraps it, and on keyboard focus
of a link or control inside it (`:has(:focus-visible)`), the same in light and dark with no glow
and no shadow. A `Card` without `interactive` stays still. Section cards (`SectionCard`, used by
`CollapsibleSection`) are static: only their heading button reacts, firming the card's edge on
hover and keyboard focus, with no shadow in either theme.

**Why.** Hover is a promise that something acts. One rule for every surface keeps that promise
the same in every product and theme.

**Consequences.** A product passes `interactive` to every card that is or contains a link or
control, and to no other card. A card with several links keeps them as separate targets inside a
plain `Card interactive`, never inside a whole-card link. Hover effects stay on the shared
components; a product adds no hover shadow or glow of its own.

## D22: The divider and the street edge

The owner ruled on 2026-11-15 that every product draws one divider, from yesid.design, never drawn
by a page (products always use yesid.design components):

- **The divider is a dimension line**, as if drawn on the blueprint paper: a 1px hairline with
  9px end ticks and 5px scale ticks every 80px (the grid's major step), in the blueprint ink
  (`--primary` at 70%, the colour BlueprintShell draws in), running edge to edge. It is identical
  in every product and both themes, decorative and static. `Separator variant="dimension"` draws
  it; `DetailFrame`, `ListingFrame`, `TerminalPanel` and `CodeBlock` take `rule="dimension"`, and
  `Masthead` and `ErrorPage` take `tape="dimension"`, wherever they drew hazard tape as a divider.
- **Placement:** every section ends with the divider at its bottom, except the last section of
  the page; never a divider before the footer. `.section-dividers` in `@yesid/ui/base.css`, on the
  element that holds the page's sections, draws it that way without page CSS.
- **The street edge:** `SiteFooter`'s top edge is a road marking: one dashed line whose dashes
  alternate yellow and white, edge to edge, on the footer's own colours in dark and light. It
  replaces the footer's hazard strip by default.

**Why.** The owner wants the products to read as one family and the divider to belong to the
blueprint, not to construction caution. Earlier pages drew their own lines: hazard tape, a dashed
rule, a solid yellow line, sometimes two at once. One part, owned by yesid.design, ends that
drift. Hazard tape returns to its job, a real caution or a signature. The street edge closes the
page as the ground the construction scene stands on.

**Consequences.** Hazard tape stays the default of every existing option, so no page changes until
it opts in; only the footer's edge changes for everyone (DEPRECATION.md, "Owner-approved behavior
changes"). A product removes its own divider CSS and uses the kit's options as it adopts them.
Divider ink is orange, the clickable hue, used here as faded drawing ink at 70%: it is never a
link or a control. The open owner question is whether the remaining hazard defaults (DetailFrame,
ListingFrame, TerminalPanel, Masthead, ErrorPage) flip to the dimension line in a later release.
