---
"@yesid/ui": minor
---

Add SiteHeader `linkTiers` (type `SiteHeaderLinkTiers`) so the header's link tiers agree before
and after hydration for a wider brand (Transit R1063-1, transit#1063).

With a supplied brand plus search and actions, Transit's full pill fits only from about 1230px,
but priority 3 links showed from 1024px in the server-rendered CSS. links-fit then took the tier
out once the app script ran, so at 1206px both toggles moved about 169px. `linkTiers` raises the
header width each priority needs: `priority2` takes 768, 1024 or 1280 and `priority3` takes 1280,
1440 or 1600. The widths are static container-query rules on the pill, so they apply before
hydration and without JavaScript; links-fit never brings back a priority they hide.

Defaults are unchanged (priority 2 from 600px, 500px with the deprecated `compactControls`;
priority 3 from 1024px), so yesid.dev and yesid.login keep today's output. Defect fix in the same
rules: a header whose links are all priority 2 no longer shows the divider before an empty links
row below 600px (500px in compact mode); no current product has such a header.

Migration: none required. Transit passes `linkTiers={{ priority3: 1280 }}`. Proof:
`site-header-wide.spec.ts` fails on the previous source at 1206px in EN and FR.
