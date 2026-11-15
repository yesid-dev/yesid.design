# Retired decorative vocabulary

Starting with v0.44.0, `CornerMeta` and `MetroStation`, with their `CornerMetaProps` and
`MetroStationProps` types, are Deprecated in `@yesid/ui` and `@yesid/ui/brand` (Y-26). Both
remain exported, documented and functional. No product uses either one, and the Gallery no
longer demonstrates them, the mono section overline or corner notes. `Breadcrumb` stays.

## Migrate

- **CornerMeta:** its notes are `aria-hidden` and hidden below 768px, so nothing essential may
  live there. Put any line, source or time a reader needs in the content (a heading, a summary
  or the data itself) and drop the corner notes. `CornerMarks` stays available.
- **MetroStation:** use a plain number in the content, or `StopLabel` for a stop on a line.
- **SectionHeading `overline`:** still accepted. A section starts with its heading; prefer
  `heading`.

## Consumers

A read-only scan on 14 November 2026 found no use of `CornerMeta` or `MetroStation` in yesid.dev,
yesid.login or Transit. Transit has a local `cornerMeta` snippet slot and copy file of its own,
which does not import the package component.

Removal requires 90 days from the first published deprecation and an intervening minor, or the
owner's explicit waiver. The earliest eligible version is v0.46.0 if v0.45.0 retains them; the
calendar date is publication date plus 90 days and is not established by this source PR.
