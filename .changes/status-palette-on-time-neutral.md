---
"@yesid/tokens": minor
"@yesid/ui": patch
---

Transit status colours follow owner choice A (Y-7): `--dataviz-status-on-time` is now neutral reading ink
(`#f5f5f0` dark, `#131923` light) and `--dataviz-status-late` is red (`#ff5f57` dark, `#c62828` light), so a late
vehicle no longer shares the yellow highlight. `--dataviz-status-early` is unchanged. `--dataviz-status-severe`
stays for compatibility and now matches late.

Migration: anything that used the status tokens for interface feedback rather than transport status should use
`--success`, `--accent-text` or `--destructive` instead. StateNotice now does this itself: its positive, warning
and error tones keep their colour in dark mode and become slightly darker, higher-contrast shades in light mode.
