---
"@yesid/ui": patch
---

`createNavigationLifecycle` no longer resets page focus after a programmatic `goto` when the app
passes no `subscribeNavigation`. Its fallback still resets focus for eventless link commits such as
redirect hops, but a `goto` already gets the focus its caller asked for from the router, so
`goto(url, { reset: false })` now keeps focus on the control that triggered it (for example a
`SegmentedChoice` that writes the URL). No migration.
