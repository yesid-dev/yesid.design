# @yesid/tokens

The design-token source for yesid products. `tokens.json` (DTCG format) holds every color, type,
spacing, radius, shadow and motion value. The package ships the stylesheets generated from it and
the bundled Inter and JetBrains Mono fonts.

## Use

Import order in the app stylesheet: `@yesid/tokens/tokens.css`, then `tailwindcss`, then
`@yesid/ui/base.css`, which brings `theme.css`. Import `@yesid/tokens/fonts.css` from the root
layout and preload exactly the latin faces. They use `font-display: optional`, so a latin face that
is not preloaded usually misses the first paint, and that page view keeps the fallback font. In
SvelteKit:

```ts
import { preloadFont } from '@yesid/tokens/fonts';

resolve(event, { preload: ({ type, path }) => type !== 'font' || preloadFont(path) });
```

Without SvelteKit, serve the two files in the package's `fonts/` folder that `preloadFont` accepts,
`inter-latin-wght-normal.woff2` and `jetbrains-mono-latin-wght-normal.woff2`, and link them in
`<head>` before the stylesheet that declares the faces. Keep `crossorigin` even on the same origin:
fonts load in CORS mode, and a preload without it is fetched twice.

```html
<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/jetbrains-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
```

Compact density is opt-in: set `data-density="compact"` on `<html>` or on a subtree to apply the
`density.compact` overrides. `tokens.css` also declares the breakpoints as `@custom-media`; inside
Svelte styles they need postcss-global-data and postcss-custom-media in the product's build.

Use `--measure-listing` (`46rem`) for a single listing or results column, such as search results or
a directory, between the lede (`34rem`) and body (`60rem`) measures.

For ordinary reading, use these explicit roles. They retain their size inside compact-density
subtrees. `text-body`, `text-small`, `text-mono` and `text-caption` also serve controls,
data and labels at their own sizes. Display, hero and impact roles are separate.

| Reading role | Tailwind size classes | Line height |
| --- | --- | --- |
| Prose | `text-reading lg:text-reading-desktop` (19/20px) | `leading-[1.7]` |
| Block code or terminal prose | `font-mono text-reading-code lg:text-reading-code-desktop` (16/17px) | `leading-[1.6]` |
| Inline code | `font-mono text-reading-inline-code` (0.95em) | inherit |
| Figure caption | `text-reading-caption` (16px) | `leading-[1.6]` |
| Supporting prose | `text-reading-support` (18px) | `leading-[1.7]` |
| Section heading | `text-reading-heading lg:text-reading-heading-desktop` (20/22px) | preserve heading hierarchy |

`lg` means 1024px in the default Tailwind theme, matching `--desktop-min`. Products with custom
breakpoints must use that threshold explicitly. Adopting the package does not remap existing
copy: apply the reading roles to prose and code in the consumer, keeping compact UI classes.

| Export | Contents |
| --- | --- |
| `./tokens.json` | the token source |
| `./tokens.css` | the tokens as CSS custom properties, plus the breakpoints |
| `./theme.css` | the Tailwind `@theme` map and semantic color utilities |
| `./fonts.css`, `./fonts` | the font faces and `preloadFont` |
| `./generators/design-md` | the `DESIGN.md` generator |

The exact interface is in
[`api-reports/tokens.api.md`](https://github.com/yesid-dev/yesid.design/blob/v0.65.0/api-reports/tokens.api.md).

## Rules

- `tokens.json` is the only place a value is edited. Generated files are never edited by hand.
- Generators are pure: tokens in, strings out, with the same LF bytes on Linux and Windows.
- `bun run tokens:build` at the repository root writes `tokens.css`, `theme.css`,
  `packages/motion/src/tokens.ts` and `DESIGN.md`. `bun run ci:tokens` fails if any has drifted.
- No stylesheet loads on import. Products override tokens in their own stylesheet, after these
  imports.

## Develop

```sh
bun run --cwd packages/tokens test
bun run --cwd packages/tokens check
```

Text links use `primary` as AA text, including inside `.theme-dark` islands. Yellow is
wayfinding, hazard and highlight; only the conversion button is clickable yellow. See
[the doctrine](../../docs/DOCTRINE.md) for registers and colour roles.

Use `--skeleton` or `bg-skeleton` for decorative loading placeholders. The solid fill is
defined separately for light and dark themes to read against both `--card` and `--background`.

The transport status colours (`--dataviz-status-*`) each travel with a word and a glyph: early is
blue (▼), on time is neutral reading ink (●), late is red (▲) and unknown is grey (○).
`--dataviz-status-severe` exists for compatibility and equals late. Interface feedback, such as
StateNotice's tones, uses `--success`, `--accent-text` and `--destructive` instead.

For a neutral heatmap, use `--dataviz-heatmap-neutral-0` through `--dataviz-heatmap-neutral-4`.
Match each fill with `--dataviz-heatmap-neutral-ink-0` through `--dataviz-heatmap-neutral-ink-4`
for text. The light and dark ramps move from the calmest to the strongest magnitude. Keep a
visible value or range in each cell and give missing data its own label and pattern.
