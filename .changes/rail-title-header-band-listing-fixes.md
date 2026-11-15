---
"@yesid/ui": minor
---

Sticky rail titles, a compact editorial header band and listing fixes (D23 and the owner rulings
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
