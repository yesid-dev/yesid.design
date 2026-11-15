---
"@yesid/ui": minor
---

Add SiteHeader `linkTiers` (type `SiteHeaderLinkTiers`) so the header's link tiers agree before
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
