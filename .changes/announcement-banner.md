---
"@yesid/ui": minor
---

Add `AnnouncementBanner` from `@yesid/ui/layout` for a site-wide linked message above the
header. Pass `id`, `message`, `href` and a localized `closeLabel`. The banner remembers dismissal
per ID. Use the same ID across pages and translations and give a new message a new ID.

Place `%yesid.announcementBannerBoot%` in the document head before `%sveltekit.head%` and call
`injectAnnouncementBannerBoot(html, id)` from `@yesid/ui/head` in `transformPageChunk`. This
applies a saved dismissal before paint. Add `announcementHash` from `@yesid/ui/boot.json` to
`script-src` when using a hash-based CSP.
