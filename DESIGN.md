---
version: alpha
name: yesid.dev
description: Digital infrastructure that moves. Edge-to-edge, dark-first, four-color infrastructure doctrine (orange signage · yellow wayfinding · reflective white · structural black), motion-with-intent.

# GENERATED FROM packages/tokens/tokens.json — DO NOT EDIT
# Run `bun run tokens:build` to regenerate.

colors:
  primary: "#E07800"
  primary-hover: "#C96A00"
  accent: "#FFB627"
  accent-hover: "#E5A220"
  reflective: "#F5F5F0"
  glow: "#E07800"
  hazard-a: "#FFB627"
  hazard-b: "#1C1814"
  signage-bg: "#1C1814"
  signage-text: "#FFB627"
  background: "#141414"
  foreground: "#F5F5F0"
  muted: "#1E1E1E"
  muted-foreground: "#949494"
  card: "#1a1a1a"
  popover: "#2A2A2A"
  secondary-foreground: "#999999"
  terminal: "#141414"
  manifesto: "#0f0d0a"
  border: "#3A3A3A"
  border-subtle: "#2f2f2f"
  border-strong: "#4A4A4A"
  destructive: "#ff5f57"
  destructive-foreground: "#1B0F0D"
  success: "#28c840"
  accent-text: "#FFB627"
  accent-foreground: "#1A1714"
  input: "#75664F"
  terminal-chrome: "#0E0E0E"
  terminal-ink: "#E9E2D2"
  terminal-ink-muted: "#A89E8D"
  signal-lunar: "#DAD2C2"
  lamp-bezel: "#060403"
  line-amber: "#FFB627"
  accent-surface: "#332812"

typography:
  hero:
    fontSize: "8.125rem"
  hero-mobile:
    fontSize: "4rem"
  display:
    fontSize: "4rem"
  title:
    fontSize: "2.5rem"
  heading:
    fontSize: "1.5rem"
  subheading:
    fontSize: "1.1875rem"
  body:
    fontSize: "1.0625rem"
  reading:
    fontSize: "1.1875rem"
  reading-desktop:
    fontSize: "1.25rem"
  reading-code:
    fontSize: "1rem"
  reading-code-desktop:
    fontSize: "1.0625rem"
  reading-inline-code:
    fontSize: "0.95em"
  reading-caption:
    fontSize: "1rem"
  reading-support:
    fontSize: "1.125rem"
  reading-heading:
    fontSize: "1.25rem"
  reading-heading-desktop:
    fontSize: "1.375rem"
  small:
    fontSize: "0.9375rem"
  mono:
    fontSize: "0.875rem"
  caption:
    fontSize: "0.8125rem"
  card-title:
    fontSize: "1.25rem"
  card-body:
    fontSize: "1.0625rem"
  card-meta:
    fontSize: "0.9375rem"
  control:
    fontSize: "0.9375rem"
  tag:
    fontSize: "0.9375rem"
  back-link:
    fontSize: "0.9375rem"
  detail-meta:
    fontSize: "1.0625rem"
  detail-kicker:
    fontSize: "0.75rem"
  menu-subtitle:
    fontSize: "1rem"
  micro:
    fontSize: "0.6875rem"

rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"

spacing:
  "page-x": "clamp(1.5rem, 4vw, 5rem)"
  "section-y": "clamp(3rem, 8vw, 6rem)"
  "card-gap": "clamp(1rem, 2vw, 1.5rem)"

components:
  AnswerLead: {}
  BlueprintShell: {}
  ChevronToggle: {}
  CodeBlock: {}
  CollapsibleSection: {}
  CornerMarks: {}
  CornerMeta: {}
  ConstructionFloodlight: {}
  ConstructionProps: {}
  ErrorIllustration: {}
  FilterGroup: {}
  FilterSection: {}
  FilterSummary: {}
  ManifestoCanvas: {}
  MetricDisplay: {}
  MetroStation: {}
  ProductBrand: {}
  RailTitle: {}
  RoutePlate: {}
  SectionsToggle: {}
  SearchInput: {}
  SectionHeading: {}
  SliderButton: {}
  SectionIcon: {}
  SectionLabel: {}
  SegmentedChoice: {}
  StatusDot: {}
  Stamp: {}
  StatusMark: {}
  StopLabel: {}
  TerminalCursor: {}
  TerminalPanel: {}
  ThemeToggle: {}
  TocBadge: {}
  TocNav: {}
  TocPill: {}
  ToggleChip: {}
  Wordmark: {}
  LanguageToggle: {}
---

## Overview

yesid.dev is a freelance digital-infrastructure brand. The design language is edge-to-edge,
dark-first, governed by the four-color infrastructure doctrine below. Every visual decision
traces back to one of five principles: edge-to-edge layout, dark-first surfaces, one-orange
interactivity (orange is the clickable hue — with a single doctrinal exception: yellow
conversion buttons, see Colors), motion-with-intent, no fluff.
Public narrative and implementation rules: README.md and
docs/BUILD-A-YESID-PRODUCT.md.

Before composing a page, read the doctrine ([docs/DOCTRINE.md](docs/DOCTRINE.md)): core identity,
signatures by name, three registers, calm by default.

## Colors

**THE FOUR-COLOR INFRASTRUCTURE DOCTRINE** (constitutional). Real infrastructure speaks four
colors — orange signage, yellow hazard stripes (with black), reflective white, black tape and
structure. Each holds a named role; every component usage maps to exactly one:

- **ORANGE — interactive/signage** (`primary` `#E07800`, light `#985000`): nav and component
  links, buttons, CTAs, focus rings, active/hover states, signage accents. The clickable hue for
  everything except conversion (below), text links included: a link without a class is underlined in `primary` ink.
- **YELLOW: wayfinding, hazard and highlight** (`accent` as surface and art; `accent-text` as
  AA text; `line-amber`; `accent-surface`): the one highlight per screen (the answer figure or
  the selected item), departure-board signage, map and diagram amber, string colours in highlighted
  code, and hazard tape for a real caution, the footer's hazard edge or the page's signature. Not
  for ordinary numbers, labels above headings or status: ordinary numbers use reading ink, and
  status uses the status tokens with a word and a glyph. Under the yellow conversion rule, the only
  clickable yellow surface is the "talk to Yesid" button, at most one per view; every other yellow stays
  unclickable, text links included (they are orange).
- **WHITE — reflective** (`reflective` `#F5F5F0`, theme-invariant; dark `foreground`):
  key headline words on dark, catch-lights (`edge-highlight`), white-core métro dots and
  reflective chips over guaranteed-dark grounds.
- **BLACK — tape/structure** (`hazard-b` / `signage-bg` `#1C1814`; light `border-strong`
  joins the family): hazard stripe pairing, signage chip grounds, light-mode strong
  structural rules drawn as black tape on paper. Dark mode's deep board IS the black voice.

**Status colours** (`--dataviz-status-*`) mark transport status only, each with its word and glyph:
early blue (▼, `#4aa3d4`, light `#1f6f9c`), on time in neutral reading ink (●), late red (▲,
`#ff5f57`, light `#c62828`) and unknown grey (○). `severe` exists for compatibility and equals
late. Interface feedback uses `success`, `accent-text` and `destructive` instead, as StateNotice's
positive, warning and error tones do.

Semantic tokens (`background`, `foreground`, `card`, `muted`, etc.) carry theme-switching
responsibility. Contrast verified on dark first, then light — all pairs script-computed.

## Typography

Inter Variable for headings + body; JetBrains Mono Variable for code, terminals, mono labels.
Self-hosted (no Google Fonts CDN). Type scale uses `clamp()` for fluid sizing across breakpoints.
Hard floors: body ≥ 16px, mono ≥ 13px, labels ≥ 12px, micro for chrome only.

Sentence case. Uppercase only for short signage. A section starts with its heading, never with a label above it.
Data and form labels use `.label-reading` (Inter, sentence case, muted, 15px); `.label-station` and
SectionHeading's `overline` are for real signage only. Numbering marks a real sequence.

## Layout

Four CSS Grid recipes: Full-Bleed · Contained · Content+Sidebars · Edge-Title-Grid. Container
widths cap at `64rem` (content) / `72rem` (wide). Page gutters scale via `--space-page-x`.
Section spacing scales via `--space-section-y`. Consumer integration guidance lives in
docs/BUILD-A-YESID-PRODUCT.md.
SiteHeader accepts a caller-owned `brand` snippet and `wordmarkAutoPlay={false}` for its default
wordmark. Empty menus omit the menu button and keep the identity controls reachable in the pill.
The theme and language toggles stay in the pill at every width (D19); priority 2 links show from a
600px header and links that do not fit leave a whole priority at a time. The Experimental
`ProductBrand` composes the house wordmark, a divider and the product name for header and footer,
with optional sizes for each part. Grouped menus lay out in columns from 768px and in one column
below.
Button `wrap` opts into multiline labels and content-driven height. Table cells preserve whole
words, wrapping a single word only when it exceeds the cell width.
`.chrome-clearance` on the scrolling element keeps focus and fragment jumps clear of the fixed
header and the floating pills; a contents pill stacks above a SurfaceRail pill.
ReadingFrame (Experimental) holds legal pages and long prose on a 65 to 70 character measure,
with its contents. `PageSections` and `PageSection` end every section but the last with a
divider (D22), so none sits before the footer: `divider="hand-drawn"` is the orange pen edge
yesid.dev uses, drawn over the joined section edges with zero layout height, and ArticleHeader ends
with the same edge; the default is the dimension line, a 1px blueprint-ink hairline with end ticks
and a scale tick every 80px, which frames and panels also take as `rule="dimension"` (Masthead and
ErrorPage `tape="dimension"`). Every product's SiteFooter passes `edge="hazard"` for the
diagonal yellow and black strip along its top. TerminalPanel and CodeBlock take `rule="line"`
for one solid yellow rule. Hazard tape is otherwise not a divider.
The Experimental `RailTitle` puts a section's real heading on a side rail outside the centred
content (D23): rotated and sticky under the header pill from 1024px, horizontal above its section
below; `clipAtHeader={false}` lets a departing title leave unclipped. ListingRail is the same
title column for a page without a listing. FilterGroup `selectedStyle="consistent"` gives every
choice and the All reset one selected style. The editorial header band (ArticleHeader) is compact: the title keeps its size, the rows sit
close and the actions share a row with the controls. A listing search keeps the standard focus
ring, with no dashed rule above it; ListingFrame's `resultCountText` announces the count politely.

MetricDisplay is yellow by default; reading pages pass `tone="reading"` explicitly.
Figures use tabular numerals. Put period, unit and comparison in `sublabel`, evidence in
`info`, and explicit absence words in `absent`. The Gallery reading record demonstrates
phone rows, scoped comparison scrolling, narrative facts and in-row confirmation.

## Elevation & Depth

Shadow tokens use `color-mix(in srgb, var(--primary) N%, transparent)` for brand-connected
glows. Six tiers: `glow-sm`, `glow-md`, `glow-lg`, `card`, `section`, `nav`. No raw
`box-shadow` in components except the existing Card, SiteHeader, TocNav and StopLabel surface,
chrome and signage shadows. These exceptions do not authorize new glow on reading or task
surfaces. Only the D15 bulk control and lit artwork in a signature region may glow there.
Only an `interactive` Card reacts to hover; `edge="neutral"` draws a static card's edge in
`border` and never glows.

Hover is identical in light and dark: lift and edge, no shadow (owner rulings, 15 November 2026).
A hovered button, card, section heading, link or illustration may lift 1px, change colour, firm its
border or change its underline, but it never gains a box-shadow, text-shadow or drop-shadow glow, and
cards and section headings cast no outer shadow on hover. Keyboard focus gives an interactive Card
and a section heading the same lift and edge as hover, beside the 2px focus ring. Active-state lamps
are not hover effects. Deprecated shadow tokens: `glow-sm`, `cta-hover`.

## Motion

Decorative animation must not loop endlessly (WCAG 2.2.2). Default-on decoration stays
in its reduced-motion frame. Status dots and live-signal lamps stay still, including explicit
pulse requests kept for compatibility. Other explicit opt-in emphasis lasts at most five seconds,
then rests. Respect reduced motion. Loading indicators, including Skeleton and spinners, may loop
only inside an explicitly busy region while content is loading; the caller removes them when
loading completes. Pointer and scroll responses follow input and settle when input stops.

## Shapes

Five radius tokens: `sm` (4px), `md` (8px, default), `lg` (12px), `xl` (16px), `pill` (9999px).
Borders use semantic tokens (`border`, `border-subtle`, `border-strong`).

## Components

See `@yesid/ui/brand` (39 components: `AnswerLead`, `BlueprintShell`, `ChevronToggle`, `CodeBlock`, `CollapsibleSection`, `CornerMarks`, `CornerMeta`, `ConstructionFloodlight`, `ConstructionProps`, `ErrorIllustration`, `FilterGroup`, `FilterSection`, `FilterSummary`, `ManifestoCanvas`, `MetricDisplay`, `MetroStation`, `ProductBrand`, `RailTitle`, `RoutePlate`, `SectionsToggle`, `SearchInput`, `SectionHeading`, `SliderButton`, `SectionIcon`, `SectionLabel`, `SegmentedChoice`, `StatusDot`, `Stamp`, `StatusMark`, `StopLabel`, `TerminalCursor`, `TerminalPanel`, `ThemeToggle`, `TocBadge`, `TocNav`, `TocPill`, `ToggleChip`, `Wordmark`, `LanguageToggle`) and
12 primitive subpaths (`@yesid/ui/badge`, `@yesid/ui/button`, `@yesid/ui/card`, `@yesid/ui/collapsible`, `@yesid/ui/combobox`, `@yesid/ui/footer`, `@yesid/ui/resizable`, `@yesid/ui/scroll-area`, `@yesid/ui/separator`, `@yesid/ui/sheet`, `@yesid/ui/skeleton`, `@yesid/ui/tabs`). Design-system documentation:
the public `@yesid/ui` package documentation and the living Gallery.

## Do's and Don'ts

**Do**

- Reference tokens via `var(--token)` or Tailwind utilities (`bg-primary`, `text-foreground`).
- Use the 4 CSS Grid recipes; pages own their grids in scoped CSS.
- Respect `prefers-reduced-motion` on every animation.

**Don't**

- Draw a status, date or lamp without a real source.
- Put a label above a heading.
- Accent one word of a title.
- Add hover effects to content that does not act.
- Add a glow, text-shadow, drop-shadow or outer shadow on hover, or hover differently per theme.
- Restyle the theme or language toggle.
- Colour a link yellow.
- Hardcode hex colors in components.
- Use arbitrary Tailwind values (`text-[14px]`, `p-[22px]`) — use the scale or a token.
- Use `vh` on mobile; use `dvh`/`svh`/`lvh`.
- Add motion that doesn't serve wayfinding, feedback, or emphasis.
