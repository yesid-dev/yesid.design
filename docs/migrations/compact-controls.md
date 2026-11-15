# Compact controls are deprecated

Starting with v0.44.0, SiteHeader's `compactControls` prop is Deprecated. It remains accepted
and functional: below a 600px header it still moves the theme and language toggles into the
menu, with the native popover before hydration.

The owner decided on 14 November 2026 that the theme toggle and the language toggle sit in the
navbar pill at every width, in every product, and never in the menu (`DECISIONS.md` D19). They
show no visible label, and their accessible names keep the theme wording and the language name.

## Migrate

Omit the prop. No replacement API is needed.

```svelte
<!-- Before -->
<SiteHeader {navigation} {home} {links} {menuItems} {labels} {language} compactControls />

<!-- After -->
<SiteHeader {navigation} {home} {links} {menuItems} {labels} {language} />
```

Without it, SiteHeader keeps both toggles in the pill, drawn exactly as the components draw them,
and the open menu holds the destinations only. From v0.44.0 the header also makes room for them:

- `priority: 2` links show from a 600px header (500px before). Between 500 and 599px only
  priority 1 links sit beside the toggles, before and after hydration and without JavaScript.
- When the links do not fit, a whole priority leaves at a time, 3 first, then 2. Priority 1
  leaves only when it cannot fit alone. Before, every link left at once.

Keep every header link in `menuItems` or `menuGroups`, as before. If a labelled `actions` button
relied on the space the toggles freed, check it still fits at 320, 360 and 390px.

## Consumers

| Product | State on 14 November 2026 | Action |
| --- | --- | --- |
| yesid.dev | Dropped the prop in its PR 723 | None |
| yesid.login | Never passed it | None |
| Transit | Never passed it | None |

Removal requires 90 days from the first published deprecation and an intervening minor, or the
owner's explicit waiver. The earliest eligible version is v0.46.0 if v0.45.0 retains it; the
calendar date is publication date plus 90 days and is not established by this source PR.
