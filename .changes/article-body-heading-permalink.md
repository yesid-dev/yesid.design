---
"@yesid/ui": minor
---

Adds three opt-in pieces for long prose; nothing changes for existing callers.

- `@yesid/ui/article-body.css`: the reading roles `.reading-detail`, `.article-body`, `.reading-support`
  and `.heading-anchor`, ported from yesid.dev. Import it once after `base.css`. To adopt, replace the
  local copy and keep product selectors (such as gallery captions or deliverable items) and prose
  decoration in the product.
- `HeadingPermalink` (`@yesid/ui/brand`): a `#` link that shows on heading hover or keyboard focus,
  named "{label}: {heading text}". `target` and the localized `label` are required.
- `CollapsibleSection` `permalink` and `permalinkLabel`: a `HeadingPermalink` to the section's
  `anchor`. With it, the section heading takes `id={anchor}`.
