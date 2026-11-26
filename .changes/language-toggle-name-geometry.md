---
"@yesid/ui": patch
---

`LanguageToggle` no longer lays out part of its hidden name outside the link. Since 0.58.1 the destination's autonym, marked with its `lang`, kept an inline box as wide as the word beside the 1px hidden name; with the toggle near the right edge that box ran past the viewport (about 160px past it at 390px wide with 200% text in the Gallery header), so layout checks that measure element boxes against the viewport failed on every page. The autonym now has no box of its own. The link's look, position, `lang` marking and name are unchanged. On a French page (`locale` `fr` or `fr-*`) the name now puts a no-break space before the colon, as French typography asks: "Langue : English (EN FR)" instead of "Langue: English (EN FR)". Other languages keep "Language: Français (EN FR)". Migration: tests that match the French name with a plain colon, such as `/^Langue:/`, must also accept the no-break space, for example `/^Langue\s?:/`.
