---
"@yesid/ui": patch
"@yesid/motion": patch
---

Mounting `DataTable`, `HourGrid`, `ChartFrame`, `MapFrame` and `AppFrame` no longer forces a
synchronous layout. They read their sizes in ResizeObserver callbacks, which run after layout and
before the first paint, so what renders is unchanged. A scrolling table with
`initialScroll: 'end'` still moves to its end before that paint.

`initLenis()` now drives Lenis from the GSAP ticker only while a smooth scroll runs. An idle page
no longer runs a GSAP frame callback every frame, and scrolling behaves as before. No migration.
