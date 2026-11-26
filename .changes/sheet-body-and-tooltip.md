---
"@yesid/ui": minor
---

Add `Sheet.Body` and `SheetBody` to `@yesid/ui/sheet`. Replace a `px-4` body div with `Sheet.Body` for the shared inline inset. Keep any vertical padding and scrolling classes on the body.

Add `Tooltip` to `@yesid/ui/tooltip` for short hints on hover or keyboard focus. Move the text from `title` and the screen-reader-only hint to `content`, spread the `trigger` snippet's props onto the existing control, and keep its visible label or `aria-label`.
Pass existing help or error IDs to `Tooltip` through `aria-describedby` to preserve those descriptions.
