---
"@yesid/ui": patch
---

Keep the `SiteHeader` pill and its close button in place when the menu opens on a scrolled
`AppFrame` page. The menu's scroll lock sets `overflow: hidden` on `body`, and with the
`overflow-x: clip` that `base.css` puts on `html`, `body` became a scroll container: the sticky
chrome scrolled away with the page, leaving the pill and close button at 16px minus the scroll
offset, off screen. An open sheet moved the chrome the same way.

`AppFrame` now clips horizontal overflow on `body` instead of `html` while it is mounted. The page
still clips horizontally as before, and the lock now reaches the viewport: the chrome stays put
under the menu and sheets, and the page behind the open menu no longer scrolls with the keyboard.
Closing still restores the scroll position and focus. App CSS that sets `overflow` on `html` keeps
the lock from reaching the viewport; set it on `body` instead.
