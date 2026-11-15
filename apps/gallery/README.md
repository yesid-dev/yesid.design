# Gallery

A private SvelteKit app that renders the tokens, UI and motion packages from the workspace: token
sheets, primitives, brand components, motion, and the listing, detail, data, error and site-header
pages. Its unit and Playwright suites check rendered behavior and accessibility. It is never
released, and a passing Gallery run does not replace a product's own tests.

Gallery runs SvelteKit 3 with TypeScript 6 and Vite 8. `kit.config.js` is passed to the
`sveltekit` Vite plugin; `tsconfig.json` composes `$app/tsconfig` after sync. Its persistent
layout uses the hook-only navigation lifecycle, as both products do. Direct language links
preserve an open menu; eventless redirects close it and reset focus. The optional accepted-start
subscription remains covered by the UI package's fake-router tests, not a Kit 2 browser fixture.

Gallery uses `@yesid/tokens`, `@yesid/motion` and `@yesid/ui` at runtime and `@yesid/gates` in its
tests, with its own gate policy, demo data and theme persistence. Packages never import it. Its
coverage test fails when a public UI family or shared motion action has no example.

## Commands

```sh
bun run --cwd apps/gallery dev
bun run --cwd apps/gallery test
bun run --cwd apps/gallery check
bun run browser:install
bun run test:browser
bun run test:browser:list
```

`GALLERY_BROWSER_PORT=4187 CI=1 bun run test:browser` selects an isolated port (PowerShell:
`$env:GALLERY_BROWSER_PORT="4187"; $env:CI="1"; bun run test:browser`). Server reuse is always off.

`browser:install` downloads Chromium once. `test:browser` builds the Gallery, then runs Playwright;
`test:browser:list` lists the browser matrix without building. Browser runs are pinned to Chromium,
UTC, `en-CA` and reduced motion, on the standard projects from `@yesid/config/playwright` (untagged
tests at phone, tablet and desktop, `@theme` tests in light and dark, `@motion` tests with reduced
motion), with one worker and no retries. They assert behavior, never pixels.

`/text-links` demonstrates orange underlined prose links on every documented surface and
a dark island. `/registers` demonstrates expressive, reading and task regions with EN, FR
and ES copy. The focused `text-links.spec.ts` checks cues, forced colours and 320 to 1920px.

/labelled-field demonstrates native labelled fields, long EN/FR/ES copy, error-summary
focus and links, aria descriptions and simulated sending. labelled-field.spec.ts checks
axe in both themes, 320 to 1440px reflow, reduced motion, boundaries and 44px targets.

`/reading-surfaces` shows static and interactive cards on the brand and neutral edges, section
cards at three edge weights with long FR and ES titles, fields that keep 16px, the reading label
beside signage, and TocNav with and without its counter. `reading-surfaces.spec.ts` checks that
static cards ignore hover, hovered section titles turn orange, both themes and 320 to 1440px.
`/reading-frame/[lang]` (`en`, `fr`, `es`) renders the Experimental ReadingFrame with section ids
shared by every language; `reading-frame.spec.ts` checks the ids, the measure and reflow.
`/chrome-clearance` puts `.chrome-clearance` on `<html>` with a TocPill and a SurfaceRail pill;
`chrome-clearance.spec.ts` checks that the pills never overlap, forward and backward Tab keep focus
clear, and contents jumps keep the 25% landing line.

`/site-header-pill/[lang]` (`en`, `fr`, `es`) is a three-link product header with both toggles in
the pill; `site-header-pill.spec.ts` checks 500 to 768px with and without JavaScript, the toggles'
place through hydration, and links leaving by priority. `/product-brand/[lang]` shows the
Experimental `ProductBrand` in a narrow navbar ("yesid. | Login") and footer; `product-brand.spec.ts`
checks 320 to 1920px in both themes, long names, keyboard order, focus rings and hover colour.
`/rail-title/[lang]` (`en`, `fr`, `es`) puts the Experimental `RailTitle` on four sections of
different lengths on alternating rails under a product header; `rail-title.spec.ts` checks heading
semantics, the rotated title on its rail from 1024px and horizontal below at 320 to 1920px, the
sticky hand-off from one title to the next, that no title covers the pill, its content or another
title at any scroll position (painted glyphs), a departing title never painting under a pill that
spans the rails, long titles fitting a short window, and axe in both themes. `/rail-title-fit`
(`?offset=`, `?scroller=` and buttons that change the heading, dot and size) checks the 12px
floor and its horizontal fallback, fitting an overflow container's scrollport as it resizes, and
refitting on prop changes without a resize.
`header-band.spec.ts` checks the compact ArticleHeader band on `/article-header` and that long
French and Spanish titles stay uncropped at 320px and 200% text.
`/site-header-compact` keeps the deprecated `compactControls` only to prove it still works.
`/site-header-wide/[lang]` (`en`, `fr`) is a Transit-shaped header ("yesid. | Transit", three
priority 3 links, search, refresh and a provider choice) with `linkTiers={{ priority3: 1280 }}`;
`site-header-wide.spec.ts` holds hydration at 320, 390, 1206 and 1280px and checks that the
brand, links and toggles stay within 0.1px.

`/masthead` shows Masthead with its kicker (today) and heading first without one, with and without
the dot, in EN and long FR and ES. `/error-page` renders today's page; `/error-page/[options]`
prerenders option sets so the chosen props are in the first markup. The segment joins an
illustration (`large-first`, `small-after`, `none`), any of `no-label`, `no-tape` and `unnamed` (no
`suggestionsLabel`), and a language (`en`, `fr`, `es`) with dots, for example
`/error-page/small-after.no-label.no-tape.en`; `OPTION_SEGMENTS` in `options.ts` lists them. The
focused `quiet-task-headers.spec.ts` checks order, fit, stillness and pre- and post-hydration
geometry from 320 to 1920px in both themes and both motion settings.

`/reading-record` is a complete simulated public-data record in EN, FR and ES. It includes
metric context and absence, native labelled search, a fitting time window, consistent filters,
a comparison table with row headers inside its own keyboard-scrollable region, narrative
facts in a definition list and 25 people with confirmation inside each row. The focused
`reading-record.spec.ts` covers 320 to 1920px, both themes and reduced motion. Values are
fixtures, never live service evidence. Consumer rehearsal remains separate.
