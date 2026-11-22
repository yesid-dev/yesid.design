# @yesid/ui

Source-shipped Svelte 5 primitives and promoted brand components. The package owns reusable
rendering mechanics and shared theme, content-section actions and tab-scoped state in `@yesid/ui/state`.
Consumers choose what to persist and own product copy, policy, data, routing and every recorded
compatibility seam. Consumers import individual families so unused primitives stay out of their
bundle. The primitives are owned code derived from shadcn-svelte under MIT;
there is no shadcn CLI, registry or package dependency.

```svelte
<script lang="ts">
	import { Badge } from '@yesid/ui/badge';
	import { Button } from '@yesid/ui/button';
	import { Card } from '@yesid/ui/card';
	import { Combobox, type ComboboxOption } from '@yesid/ui/combobox';
</script>

<Card>
	<h2 class="px-4">Queue status</h2>
	<div class="px-4"><Badge>Ready</Badge></div>
	<Button>Open queue</Button>
</Card>
```

`@yesid/ui/card` exports only `Card` and its `Root` alias. Compose its content with ordinary
markup. Variant functions stay internal to the Button, Badge and Sheet implementations; their
props and public variant types remain available.
## Motion

Decorative motion never loops endlessly (WCAG 2.2.2). ErrorIllustration lamps,
StopLabel's marker, MetroStation and TerminalCursor stay in their existing reduced-motion
frames. MetroStation accepts `pulseDelay` for compatibility; its hidden ping stays still.
The opt-in gradient Separator is a still orange-to-yellow rule. StatusDot `pulse`,
TerminalPanel `signal.live` and the shared `.led-pulse` class are accepted for compatibility
and produce no visual pulse; their props, types and exports stay available under the
owner-approved compatibility exception in `DEPRECATION.md`. Reduced motion stays still.

Skeleton and consumer spinners may loop only while something is actually loading. The caller
owns that lifetime: render them within an `aria-busy="true"` loading region and remove them
when it completes. Skeleton only animates inside that busy region. In the Gallery, the explicit
browser allowlist accepts only Skeleton inside `aria-busy="true"`.
The browser regression checks every Gallery route after load and after six seconds, with normal
and reduced motion. See [the inventory](../../docs/migrations/no-endless-decorative-loops.md)
for consumer callers and the JavaScript driver audit.


## Source scanning and application tokens

Because the package ships source, a Tailwind product must scan it. Point `@source` at the
installed source, relative to the stylesheet that holds the directive:

```css
@source "../node_modules/@yesid/ui/src";
```

`Combobox` preserves a 44px minimum tap target through `var(--size-tap-min)`. Import
`@yesid/tokens/tokens.css`, which defines `--size-tap-min: 44px`; products do not need to redeclare
it. Product copy, placeholders, labels, options and localized prefixes always stay in the caller.

## Current public component contracts

### Rendered-element ownership

`ButtonProps` and `BadgeProps` discriminate on `href`. `null` or `undefined` selects the
button/span branch; any string, including `href=""`, selects the anchor branch. Each branch
exposes its real element ref, events, and attributes. Anchor-only attributes are rejected on the
button/span branches. Button-only attributes are rejected on the Button anchor branch except for
the wrapper-owned disabled-link API.

Fixed-content `ChevronToggle`, `SectionLabel`, `StopLabel`, and `TerminalCursor` reject `children`
and export named prop types from `@yesid/ui/brand`. `CollapsibleContent` keeps consumer children
but hides the low-level bits-ui `child` hook because the wrapper owns its animation scaffold.

### Combobox

`Combobox` accepts an optional bindable `value?: string | null` and bindable `open`. It forwards
the supported root behavior props and invokes `onValueChange`, `onOpenChange`, and
`onOpenChangeComplete` once per committed change. The input shows the typed query while searching
and the selected label otherwise, including after an external value update. Closing resets the
transient query; clearing commits `null`; disabled state reaches the clear control.

The caller supplies the option catalogue, stable values, visible labels, optional glyphs and
sublabels, precomputed search haystacks, a pure fold function, and all accessible copy. Filtering
uses token-AND matching over the caller's folded haystack. The package does not import product
locale or copy modules.

### Separator

`Separator` has a discriminated surface. The `default` variant delegates to bits-ui and retains
its `child`, `children`, and `decorative` contract. `hazard`, `gradient` and `dimension` render native
wrapper-owned divs, accept native div attributes, and reject delegated-only props. Custom
variants consume `orientation` instead of leaking it to the DOM, apply `maxWidth`, forward the
outer ref, and preserve or default `data-slot` on that outer element.

The hazard tape is full width by default; the gradient rule defaults to `var(--width-content)`.
Labels use the shared station label vocabulary.

`variant="dimension"` is the dimension line ([D22](../../DECISIONS.md#d22-section-edges-and-the-footer-edge)),
`PageSections`' default divider: a drafting dimension line in the blueprint ink (`--primary` at 70%), a 1px hairline with 9px end
ticks and 5px scale ticks every 80px (the grid's major step), full width, the same in every
product and theme. It is horizontal only, has no size, width cap or label, never moves, and is
hidden from assistive technology (`aria-hidden="true"`, `role="none"`). The `.dimension-line` class
in `base.css` draws it, so it needs `@yesid/ui/base.css`. Use it by hand for a break inside a
section; between sections, let `PageSections` draw it (see [Page sections](#page-sections)).

`variant="hand-drawn"` is the owner's drawn divider (16 November 2026): one slightly irregular
orange pen stroke, at most 1px off true, in the blueprint ink (`--primary` through `currentColor`),
8px tall and edge to edge. It is one decorative inline SVG path with round caps and
`vector-effect: non-scaling-stroke`, so the stroke stays 1.25px at every width: no stamps, ticks,
glow, shadow or animation. Like the dimension line it is horizontal only, has no width cap or
label, and is hidden from assistive technology; `base.css` supplies `.hand-drawn-line` and
`.hand-drawn-line-art`. Between page sections, `PageSections divider="hand-drawn"` draws the
zero-height page edge instead (see [Page sections](#page-sections)); yesid.dev composes its pages
that way.

### Sheet

Sheet exports named prop types for Root, Trigger, Close, Portal, Content, Overlay, Header, Footer,
Title, and Description. `SheetContentProps.portalProps` excludes portal children because Content
owns the portal body. `closeLabel` is required caller-owned accessible copy whenever the close
button can appear (including the default). Only `showCloseButton={false}` permits omitting it.
There is no built-in English label.

## UI configuration

Primitives merge package classes with the caller's `class` prop. The package uses one
module-level merger and exposes a boot-time configuration hook:

```ts
import { configureUi, type ConfigureUiResult } from '@yesid/ui/cn';

const result: ConfigureUiResult = configureUi({
	vocab: {
		text: ['console-label'],
		colors: ['metric-healthy', 'metric-warning'],
	},
});
```

`ConfigureUiResult = 'initialized' | 'unchanged'` is observable public API. `configureUi` is
single-assignment per loaded ESM module graph. The first explicit call in an unlocked graph stores
its semantic configuration and returns `'initialized'`. Omitted fields and empty arrays mean the
zero-configuration default. Vocabulary arrays are deduplicated and order-insensitive, so an
equivalent repeat returns `'unchanged'`. A conflicting repeat throws without replacing the first
merger. There is no reset API.

The first `cn` use, including a primitive's first class merge, locks the zero-configuration
default. Products with custom vocabulary must initialize before any primitive renders. Use one
shared initializer imported by both SvelteKit `hooks.client.ts` (`ClientInit`) and
`hooks.server.ts` (`ServerInit`), not a root layout instance script. See the
[product guide](https://github.com/yesid-dev/yesid.design/blob/v0.52.0/docs/BUILD-A-YESID-PRODUCT.md)
for the complete hook pattern.

The state boundary is the loaded ESM module graph. Browser and SSR bundles, separately bundled
package copies, workers, and HMR-recreated graphs have independent state. Configuration is fixed
application vocabulary only. Never derive it from a request, tenant, user, locale, or other
runtime-scoped value. A provider/context API and per-component `cn` plumbing remain intentionally
outside the public contract.

Package-owned `tailwind-variants` definitions use the base `twMergeConfig` so package vocabulary
is deterministic. The second `cn` merge is where consumer vocabulary applies. There are no app
checks or consumer conditionals in either stage.

## Primitive family seams

These seams are part of the consumer contract. They say what the package owns and what a product
must keep locally to avoid an unreviewed visual or behavior change.

### Badge

Variants are `default`, `destructive`, `outline`, `tag`, `tag-active` and `number`; sizes
remain `default`, `xs` and `sm`.

The package owns the shared variants, sizes, rendered-element split, and merge configuration.
Consumer typography may still resolve named tokens differently. In particular, a product that
must preserve its existing number-badge size keeps the relevant class or adapter locally.
`TocBadge` pins its number to `0.75rem` so current products and Gallery agree without changing the
general Badge token contract.

### Button

Variants are `default`, `conversion`, `outline` and `ghost`. Sizes are `default`, `sm`,
`icon-tap`, `cta-sm`, `cta` and `cta-lg`.

The package owns the variants, the element split, disabled-link behavior and the touch
`pressBounce`. `conversion` is the yellow signage CTA (at most one per view); the `cta` sizes
lift on hover. `icon-tap` is the 44px touch target. A caller's `data-slot` replaces the default.

Keyboard focus inherits the shared `base.css` style: a 2px solid orange outline with a 2px
offset, including on filled variants. The gap exposes the surrounding surface on both sides
of the outline, preserving at least 3:1 contrast on page and card backgrounds in both themes.
Forced colours use the system `CanvasText` outline. Focus does not change layout; pointer focus
continues to follow `:focus-visible`. No caller changes are needed.

`wrap` defaults to `false`. Set `wrap` on either a button or an anchor to allow labels
on multiple lines with a content-driven height and vertical padding. Keep a constrained width
(for example 200px) on the button or its parent; fixed caller heights still override this option.
Button transitions name color, background-color, border-color, box-shadow and translate explicitly.

### Card

A solid panel with a lit top bevel (`edge-highlight`). Only a card that acts reacts (D21): pass
`interactive` on a card that is a link or control, or contains them. Hover, keyboard focus on the
card or a whole-card link that wraps it, and keyboard focus on a link or control inside it firm the
border and raise the card one pixel (no rise under reduced motion), the same in light and dark,
with no glow and no shadow. A focus inside the card matches a product-owned link or control passed
as children too, not only kit components. A static card stays still under the pointer. A card with several links
keeps them as separate targets; never wrap them in a whole-card link.

- `edge="neutral"` draws the edge in `--border` instead of the orange `--border-brand`: the calm
  surface for static reading and task cards. An interactive neutral card firms its border the
  same way.
- `textSize="inherit"` drops the card's 14px base (`text-sm`), so text and form fields inside keep
  the page size (16px or more). The default `small` keeps the 14px base.

```svelte
<Card edge="neutral" textSize="inherit">…</Card>
<a href="/projects/transit"><Card interactive>…</Card></a>
```

### Collapsible

`CollapsibleContent` force-mounts by default, adds the grid/clip scaffold, marks closed content
`inert` and `aria-hidden`, and transitions grid rows plus opacity with `--duration-slow` and
`--ease-default`. Reduced motion removes the transition. A consumer replacing a transparent
Content wrapper must account for the extra DOM, forced mounting, closed-state semantics, and both
animation directions.

### Resizable

Panes, groups and a neutral handle (`withHandle` adds the rounded grip).

### Scroll Area

Root, viewport binding, axes, scrollbars, thumb, corner, and forwarded props are shared. Current
consumer marker-class and transparent-border spelling differences have no visual effect and do
not create a package variant. Add an adapter only if a live consumer selector establishes one.

### Tabs

For station signage, import `@yesid/ui/station-tabs.css` after `base.css`. Apply `station-tabs`
to `Tabs.List` and `station-tab` to each `Tabs.Trigger`, or use the same classes on a native
`nav` and its links. The CSS module has no Tabs or JavaScript dependency. It reads
`data-state="active"` on triggers and `aria-current="page"` on links; callers own selection,
navigation, accessible labels, keyboard behavior, disabled-link handling and overflow scrolling.
Keep the rail horizontal. Product geometry (strip height, padding, centering, fades), distance
opacity and swipe guards remain in the product. Remove the previous local look when adopting.

```svelte
<script lang="ts">
	import '@yesid/ui/station-tabs.css';
</script>

<nav class="station-tabs" aria-label="Service pages">
	<a class="station-tab" href="/overview" aria-current="page">01 Overview</a>
	<a class="station-tab" href="/connections">02 Connections</a>
</nav>
```

The shared defaults are active weight 700, inactive ink `--primary-foreground`, a 3px bottom rule
on inactive hover (with text at full strength), and minimum tap height `--size-tap-min`. Active chips use `--signage-bg` and
`--signage-text` in both themes. Set `--station-tab-active-weight`, `--station-tab-ink` and
`--station-tab-hover-rule-color` on the rail to change those three decisions independently.
The hover rule defaults to `currentColor`; `transparent` hides it without dimming the text.
Reduced motion removes the rule-color transition. Keyboard focus uses a 2px inset outline in
the control's current text color so it contrasts with both the inactive rail and active chip.
Gallery's `/station-tabs` renders both compositions. The module does not affect ordinary Tabs variants.

The package targets bits-ui's real `data-state="active"` selector and rejects the dead
`data-active:` form. A product may keep its rail height, padding, active shadow, underline
position, and typography locally. Adoption requires visual comparison of those geometry and
active-state details rather than treating the import replacement as sufficient proof.

### Sheet and Skeleton

Sheet supports `bottom` and `right`. Its bottom side is the mobile-first default; its overlay, focusable close control, animation,
and side geometry are package-owned. Skeleton is decorative (`aria-hidden="true"`) and its pulse
stops under reduced motion. A product with no prior local family treats first use as a new
product-level visual and accessibility decision, not proof supplied by the package.

### Draggable bottom sheets

`Sheet.Content` accepts `detents` to opt into draggable heights. Supply at least two stops,
ordered from smallest to largest, with unique ids. Each stop has `{ id, size, label }`.
Sizes use positive `px` or `%`; percentages become `dvh`. Stops of the same unit must ascend.
When mixed units cross on a short viewport (`120px` against `50%`), a stop is floored at the
earlier one, so the order never reverses. Detents require `side="bottom"` (the default)
and `handleLabel`. Both the handle name and each stop's label are caller-owned copy.

`bind:detent` stores the current id. Missing or unknown ids resolve to the first stop.
`ondetentchange(id)` fires only when the user changes stops by dragging, keyboard or handle tap.
Content exposes `data-detent` for caller styling. A header should use `shrink-0`; a scrolling body
should use `min-h-0 flex-1 overflow-y-auto`. The handle occupies 44px above the header.
Interactive controls, scrollable descendants and `[data-sheet-no-drag]` do not start drags.
There is no drag-to-dismiss. Height snaps use motion tokens and become instant under reduced motion.
The id and CSS size hold through viewport changes without a resize listener.

`modal={false}` works with or without detents. It removes the overlay, focus trap and scroll lock.
The page remains interactive, outside clicks keep the sheet open, and Tab can leave it. Escape
closes only from inside the sheet. Caller-supplied Bits props override these defaults.
Modal behavior remains the default.

Persistence belongs to the caller. For tab-scoped persistence:

```svelte
<script lang="ts">
  import * as Sheet from '@yesid/ui/sheet';
  import { persisted } from '@yesid/ui/state';
  const height = persisted('detail-height', 'peek');
  const stops = [
    { id: 'peek', size: '120px', label: 'Peek' },
    { id: 'half', size: '50%', label: 'Half height' },
    { id: 'full', size: '90%', label: 'Full height' },
  ] as const;
</script>

<Sheet.Root>
  <Sheet.Trigger>Open detail</Sheet.Trigger>
  <Sheet.Content detents={stops} bind:detent={height.value}
    handleLabel="Detail height" closeLabel="Close detail" modal={false}>
    <Sheet.Header class="shrink-0"><Sheet.Title>Detail</Sheet.Title></Sheet.Header>
    <div class="min-h-0 flex-1 overflow-y-auto">Body</div>
  </Sheet.Content>
</Sheet.Root>
```

Alternatively keep local `bind:detent` state and write the id through `ondetentchange` when only
user changes should persist. The component supplies no storage key or translated strings.

### Combobox compatibility

The package public name and DOM hooks are `Combobox`, `ComboboxOption`, `ComboboxProps`, and
`data-slot="combobox"`; no `LineCombobox` compatibility alias exists. Consumers preserve their
caller-provided copy and change imports, types, component names, and any DOM-hook selector
together. The value, options, filtering, glyph, markup, and accessibility behavior do not depend
on a product name.

## Brand components and composed patterns

### BlueprintShell

Nested SVG text normalization is controlled by `normalizeTextFont`. The default normalizes to
`var(--font-mono)`; a consumer preserving presentation-attribute behavior passes `false`. Source
guards compare numeric CSS meaning rather than lexical forms such as `0.30` versus `0.3`.

### ChevronToggle and SectionLabel

These components own their shared SVG/classes and label styles. Both Chevron directions retain
the established 90-degree open rotation, keyed on `data-state="open"`. Equivalent class ordering is
not a consumer seam.

### SliderButton

The previous/next control for sliders, carousels and lightboxes: a round tap target with a
chevron drawn on the button centre. `direction` and `aria-label` are required; state such as
`disabled` and handlers pass through.

### StopLabel

The component supports an optional label and heading element and defaults `prefix` to `ARRÊT`.
Locale tables and locale selection stay in the product; the consumer passes the resolved prefix.
No product locale type or copy table enters the package.

### MetroStation

Deprecated: no product uses it. It stays functional until removal (see
[DEPRECATION.md](../../DEPRECATION.md#active-deprecations)). Use a plain number or `StopLabel`; see
[decorative vocabulary](../../docs/migrations/decorative-vocabulary.md). Renders the zero-padded
station number in a still 2rem signage roundel.

### TocBadge

The package owns the narrow badge-spec union and renders icons with the public `SectionIcon`. Its
number stays at `0.75rem` across current products even where a consumer's general `text-micro`
token differs.

### TerminalCursor

A steady block cursor in `accent` (`accent-text` in light).

### TerminalPanel and CodeBlock

`TerminalPanel` is the terminal window: a title bar with the
`title`, an optional `tag` and `status` and an `actions` snippet, a rule (`rule`: `hazard` tape by
default, `dimension` for the dimension line, D22, or `line` for one solid yellow line), the body
(pass `noPadding` when the content pads itself) and an optional `footer` readout of label and value
pairs. Extra attributes go to the root. Its look comes from the `.terminal-*` classes in
`base.css`, so markup rendered on the server can wear the same chrome.

`rule="line"` is the owner's terminal rule (16 November 2026), used by yesid.dev's terminals and
code blocks: one solid yellow line (`--accent`) under the title bar in place of the grey hairline,
and the same yellow on the footer's top boundary when a footer is present. It renders no `Separator`, so there is no orange
dimension or hazard rule and no second stroke. The presentation is the root class
`terminal-rule-line`, so server-rendered `<div class="terminal terminal-rule-line">` markup gets
the same line; `CodeBlock` forwards the same `rule` values.

There is no lamp or colored window chrome by default. To report a status the caller can verify,
pass `signal={{ color: 'green', label: 'Live feed', live: true }}`. `color` uses `StatusDotColor`;
`label` is required and supplies screen-reader text. The lamp stays steady even with `live: true`;
`live` is accepted for compatibility and produces no visual pulse. Server output and reduced
motion are also still. `status` is independent text. The panel draws no lamp of its own, because
a lamp nobody measured is an unverified status claim.

`CodeBlock` puts source in a `TerminalPanel` with the `language` as its tag. `rule` takes the same
`hazard`, `dimension` and `line` values, so a CMS or docs code panel can use the yellow line. Pass `copy` labels
to show a copy button; it copies `code` and shows ✓ for two seconds, or `copy.failed` if the
clipboard refuses, and a polite status announces `copy.copied` or `copy.failed`. Highlight on the
server with `@yesid/seo-kit/highlight` and render its markup as `children` inside
`<pre tabindex="0"><code>` so the keyboard can scroll it; give the `<pre>` `role="region"` and an
`aria-label` if it needs a name. `base.css` colors the `syn-*` classes through the `--syntax-*`
tokens. Without `children` the code shows as a plain, focusable `<pre>`.

### ConstructionProps

The four original yesid.dev construction artworks: crossing sign, helmet, barricade and Montréal
balise, with their original responsive ground positions. The caller owns the positioned scene
above its footer. Optional `lighting` preserves the warm scene treatment. Pass a stable marker
before the growing ground as `revealAt` and, for nested scrolling, its viewport as `revealRoot`.
Reveal starts when that collapsed footer edge enters 5% of the active viewport and completes
over the next 25vh of scrolling, reversing proportionally on return. There is no timed transition,
timeout, stagger or delay. Bind `progress` to unfold the caller-owned background below the marker;
keeping the marker before the changing height avoids scroll feedback. Reduced motion switches
instantly and SSR without JavaScript remains plain and visible. No fetch, parser or HTML injection.
`layout="spread"` distributes artwork evenly; `layout="around-fixture"` spaces mobile artwork
evenly in one row around a centred 40px gap for a separate light. `floodlight` includes an unlit
fixture in the moving group.
Omit `revealAt` for always-visible artwork. Stationary lit fixtures remain outside the group.
Spread layout honors `--construction-end-inset` for a caller's stationary fixture/wordmark area.

`ConstructionFloodlight` is the original stationary fixture, unlit by default; `lit` enables its
original lens and halo. The caller owns positioning and any beam. Keep it outside the moving props.

### ManifestoCanvas

The circuit-node backdrop of brand headers. It fills `containerEl` (which must be positioned) and
listens there: nodes glow and link up near the pointer, and a click sends out a ripple. Under
reduced motion the nodes are static. It is decorative and pauses while off screen.
The shared base stylesheet owns `--manifesto-background-strength` (0.75), applied once to
nodes/traces, warm glow and ripple ink. Companion product grids use the same property.

### Blueprint drawings

`@yesid/ui/blueprints` exports the brand's blueprint drawings (`BlueprintBridge`,
`BlueprintSignal` and the rest), drawn in `currentColor`. Each takes `BlueprintProps` (`class`, `style` and other attributes), and `BlueprintBusSide` names the fleet's `operator`; compose them in a
`BlueprintShell`. The Gallery shows every one.

### SectionsToggle

`SectionsToggle` renders one Collapse all / Expand all control. The caller supplies localized
`collapse`, `expand`, `collapseTitle` and `expandTitle` copy. State and `onToggle` default to the
shared `sections` state and origin-wide bulk preference; `collapsed` and `onToggle` support a controlled adapter. The default
label reflects the mounted sections: Expand all when all are closed, Collapse all otherwise.
`CollapsibleSection firstVisitClosed` opts chosen optional content sections into a closed first
visit, while a saved Expand all or Collapse all choice still wins. It applies only on pages
with the bulk control and at least two content sections. It does not change `open` defaults
below that threshold or independent panels. With blocked storage the opted section closes;
other sections retain declared defaults. The main answer belongs outside collapsible bodies.
See [the migration note](../../docs/migrations/selective-first-visit-sections.md).

The control has hidden server markup. The boot script shows it before paint when the server
markup contains at least two collapsible content sections. Client registration keeps the threshold current. Independent panels, static cards
and TocNav do not count;
the TOC keeps its independent toggle and is never changed by expand-all actions.
`activeEffect="none"` keeps flat marks; `"glow"` adds a scoped core filter.

### ThemeToggle

`ThemeToggle` is a `role="switch"` signal lamp bound to the shared `theme` store. The caller
supplies one fixed `label`; `aria-checked` carries the state.

### CollapsibleSection

A card whose heading button toggles it by click, tap, Enter or Space. Body clicks, taps and text
selection never toggle it. Header actions keep their own behavior. It has an optional index badge,
`icon` and `headerActions` snippets, and an
`anchor` that emits `data-toc` for the TOC family. By default, every mounted collapsible card participates in
Collapse all / Expand all. Use `<CollapsibleSection independent bind:open={panelOpen}>` for a
filter or control panel that keeps its own toggle and stays out of bulk actions, counts and the
all-closed calculation.
A content mount adopts the origin-wide bulk choice when the control is available; with no choice
stored, content starts expanded. Below the threshold it uses the declared `open` default (true). If a second
section arrives later, untouched mounts adopt the bulk choice; deliberate individual toggles stay
as chosen for that view. Storage changes in another tab affect future mounts without changing
the current view. Static cards always show their body. Closed bodies stay mounted,
inert and hidden from assistive technology; collapsing a focused body returns focus to its header.
`openSignal` opens a card whenever the consumer counter changes. `openSection(anchor, root?)`
opens mounted collapsible cards with that anchor, optionally within a page root, and returns
whether one matched. Registration is removed on unmount and refreshed when the anchor changes. No trigger click or private selector is needed.

Independent panel anchors are navigation targets, not content-section membership. Keep them out
of content TOC entries; an explicit `jump(anchor)` or jump to a nested heading still opens the
panel and its containing disclosures before landing, leaving unrelated content closed. The
collapsible panel's `bind:open` reflects that request and remains caller-owned; nothing is persisted.
When the controller has content entries, observing or jumping to an independent panel or its
nested targets preserves the content TOC's active entry, counter and pill label. With empty
entries, target activity remains available. Ordinary content headings and `options.selector`
targets outside independent panels keep reporting activity, including unlisted targets.
This protection also applies with `independent collapsible={false}`. A static panel stays
visible, and jumps or reveal helpers leave its bound `open` value unchanged. Ordinary static
cards stay outside bulk actions.

The optional `summary` snippet renders between the header and the body. It stays visible in both
states, outside the inert collapsible region, wraps without clamping, and describes the heading
button without becoming part of its name. Use it for the finding, period and material caveat.
Use `subtitle` for a short label in the header; an article-summary subtitle clamps to two lines
while its section is closed. `SectionCard` owns these rendered mechanics; `CollapsibleSection` owns registration.

Reading surfaces: `edge="neutral"` draws the static edge in `--border`; `edgeWeight` is `heavy`
(3px, default), `regular` (2px) or `thin` (1px); `textSize="inherit"` keeps body text and fields at
the page size. Only the heading button reacts to hover: the border takes the accent and the title
turns orange (`--primary`), the clickable hue, never yellow (owner answer B1 2A); a neutral edge
takes no glow.

```svelte
<CollapsibleSection title="Service observations" subtitle="Completed week">
  {#snippet summary()}
    <p>Most measured passages met the target from November 4 to 10.</p>
    <p>Missing observations limit this finding to the measured service.</p>
  {/snippet}
  <p>Detailed method and evidence.</p>
</CollapsibleSection>
```

### TocNav, TocPill, and section navigation

TocNav is a desktop contents card; it skips rail entries and keeps its own independent toggle.
TocPill is the mobile contents drawer and retains consumer-owned openAria and closeAria copy.
Both show a position (`SEC n / total` in TocNav, `n/total` in TocPill and its accessible name) by
default; pass `counter={false}`, or `toc.counter: false` on DetailFrame, on a reading page where the
position carries no meaning. Below 1024px, when a SurfaceRail pill is on the same page, TocPill
stacks 8px above it and steps aside while the rail sheet is open, so neither pill hides the other.
TocBadge is a stateless rendering adapter for numeric and icon badges. Both navigation views
accept a SectionJump controller through navigation; activeId and onNavigate can still be
explicitly controlled. Without activeId, they read the controller's reactive active id.

createSectionJump() returns one page controller with activeId, register(entries, options), and
jump(id, options). register replaces the previous target scope and returns cleanup. It reconciles
active identity against the previous entry order, then observes marked sections, explicit entry
ids and optional additional selector targets. Cleanup disconnects observers/listeners and cancels
pending work. DetailFrame performs this registration through toc.navigation, or its own controller.

useSectionJump(afterNavigate) is the SvelteKit adapter: call it during page initialization and pass
its result to the frame and TOC views. It handles observer/mount ordering and new URL fragments;
popstate preserves the router's reading position. toc.landFragments opts into same-page fragment
links. Product route, tab/grain and presence policy remains local.

jump resolves section-N, data-toc and ordinary ids, including a nested heading's owning content
section. It opens only that target section through the section interface, waits for Svelte and
layout settlement, and lands the target a quarter down the viewport. The observer reads the same
viewport-height line and refreshes on resize. Reduced motion forces an instant jump. beforeReveal
may mount/select content asynchronously; later requests and cleanup cancel stale jumps. The
boolean result tells the consumer whether it landed, allowing app-owned restoration fallbacks.
See [the breaking migration](../../docs/migrations/deepen-section-jump.md) for removed helpers.

### CornerMarks, StatusDot, MetricDisplay, SectionHeading, and SectionIcon

Stateless atoms. `CornerMarks` draws four corner ticks and needs a positioned parent. `StatusDot`
takes a signal aspect (`orange` to `lunar`) or a data status (`early` to `unknown`), with
optional `pulse` and `ring`. `pulse` is accepted for compatibility and produces no visual pulse. `MetricDisplay` renders `value` and `label`; the `absent` snippet
replaces an empty value and `info` follows the label, so absence text and tooltips stay with the
caller. `SectionHeading` takes `heading` or `overline`, plus `number`, `headingAccent`, and an
`explainer` snippet. `overline` is signage only: a short board, platform or route name in tracked
mono uppercase, never a label above a heading. Start a section with `heading`; label data with the
`.label-reading` role. The Gallery does not demonstrate the overline as a section label; the prop
is accepted for compatibility. `SectionIcon` is the closed `SectionIconName` set that `TocBadge` also uses.

### FilterGroup, FilterSection, FilterSummary, and SearchInput

The listing filter family; every label comes from the caller. `FilterGroup` is a single choice
with an "All" reset (`allLabel`) mapped to `null`; choosing the active item again clears it
unless `allowDeselect={false}`. With `collapsible` it gets a header toggle and starts at `startOpen` (true) on every mount. `FilterSection` wraps one block of a filter
panel with the dashed rule. `FilterSummary` shows `countLabel.singular` or `countLabel.plural`
(each with a `{count}` placeholder) by the plural rule of `locale`, plus a `clearLabel` button.
`filterCountText(count, countLabel, locale)` returns the same words, for ListingFrame's
`resultCountText`. `SearchInput` is the listing search field; `label` is its accessible name. Its
focus shows the standard 2px focus ring from `base.css`, with no glow and no border change.

### CornerMeta, SegmentedChoice, and ToggleChip

`CornerMeta` is deprecated (no product use) and stays functional until removal;
put essential text in the content and drop the corner notes (see
[decorative vocabulary](../../docs/migrations/decorative-vocabulary.md)). It puts decorative mono
notes in the four corners of its positioned parent (snippets `topLeft` to `bottomRight`,
`crosshair` adds `CornerMarks`); it is `aria-hidden` and hidden below 768px. `SegmentedChoice` is a single choice with radio-group semantics: `label` names the group,
arrow keys move and select, and disabled options are skipped. It is controlled: every pick,
the current option included, calls `onSelect`, and the caller sets `value`. `compactLabel` shows
a short label and keeps `label` as the name, and `variant="joined-grid"` lays options out two per
row. `ToggleChip` is a controlled pill button:
the caller sets `pressed` (rendered as `aria-pressed`) and changes it in `onclick`.

## Listing frame

`@yesid/ui/layout` exports `ListingFrame`, the listing page template. From 1024px it adds a
vertical edge title (`edgeTitle`, default `heading`) and an accent rail beside the page and hides
the `heading` h1 visually. The header renders the `blueprint` snippet behind `heading`,
`subtitle` and an optional `description`, with an optional `aside` beside them on desktop. The
copy rests on the bottom of the band. Every drawing in the header renders at the frame's
`--blueprint-ink`, one value per theme that overrides the opacity `BlueprintShell` and inline styles
give the drawings.
`onHeaderMount(header, frame)` runs once on mount for header motion such as a scroll scrub; return
its cleanup.

That is the default, `presentation="expressive"`. `presentation="reading"` is the calm listing
header for reading pages: the `heading` h1 is visible and horizontal at every width, with no edge
title, accent rail or artwork (`edgeTitle` and `blueprint` are ignored, and `blueprint` may be
omitted), a sentence-case subtitle in reading type, and a neutral line instead of the hazard rule.
The title, the line and the filter column share one left edge.

`rule` overrides the rule under the header in either presentation: `hazard`, `line` or
`dimension` (the dimension line, D22). Without `rule`, each presentation draws its own: hazard
tape for expressive, the neutral line for reading. It is the one
line between the header and the list: the search draws no rule of its own.

The filter column holds the `search` snippet and a panel with the `filters` snippet. From 1024px
the panel is always shown and the column is sticky. Below 1024px a button labelled `filterLabel`
opens it. The panel starts closed on every mount. The panel
never uses `inert`; a closed panel is `visibility: hidden` below 1024px only. So from 1024px the
filters are visible and reachable by keyboard before hydration and without JavaScript, and below
1024px opening them needs JavaScript. Wheel scrolling in the sticky column chains to the page
through `scrollChain`.

From 1024px one line parts the header from the list: the rule under the header. The search block
has no dashed rule of its own. The phone `filterLabel` button keeps the standard focus ring beside
its colour change. The edge title is a decorative `RailTitle` (the `heading` h1 stays the page's
heading), centred in a column that stays in view. `clipAtHeader` forwards the same `RailTitle`
option (default true) so a listing can stop the header clip without internal CSS, keeping the edge
column and metro decoration.

`ListingRail` from `@yesid/ui/layout` owns that same centered left title column, both
original four-dot clusters and the adjacent accent. It renders two sibling grid items: on desktop
the parent supplies `grid-template-columns: auto 2px minmax(0, 1fr)` and its content follows the
rail. Below 1024px the semantic title reads horizontally, while the dots/accent are hidden.
The parent must allow natural overflow and enough section height for sticky placement.

```svelte
<section class="page-grid" aria-labelledby="page-title">
  <ListingRail heading="Contact" titleId="page-title" clipAtHeader={false} />
  <div><!-- Page content --></div>
</section>

<style>
  @media (min-width: 1024px) {
    .page-grid { display: grid; grid-template-columns: auto 2px minmax(0, 1fr); }
  }
</style>
```

The default is a real `h1`; `level` accepts 1–6 and `titleId` labels that heading at every
width. The orange title dot and metro artwork remain hidden from assistive technology. Use
`decorative` only beside a separate accessible/mobile heading, as ListingFrame does; that typed
mode excludes `level` and `titleId` and hides the entire title column below 1024px. No focusable
elements are added. `clipAtHeader` defaults to true, as on RailTitle; false disables its scroll
mask without changing fitting, sticky placement or decoration. ListingFrame draws its rail through
the same component. Consumers need no private CSS selectors.

`resultCountText` (optional) is the result count in words, for example from `filterCountText`.
The frame keeps a visually hidden polite status (`role="status"`) in the results column for as long
as the prop is set, so screen readers hear the count whenever a search or filter changes it, even
when the visible `FilterSummary` only shows while filters are active. Without it nothing is
announced.

The frame reads `--chrome-offset`, the height of the fixed site chrome, to pull the header under
it and to park the sticky column below it. It falls back to `0px`.

## Detail frame and article header

`DetailFrame` is the detail and article page template: the `header` snippet, a rule, an
optional `toolbar` band, then a grid of an optional left rail, the center (`children`, with an
optional `summary` on top) and an optional right rail, then `after`. `rule` is `hazard` (the
default tape), `dimension` (the dimension line, D22), `line` (a neutral hairline for
reading pages) or `none`. A header that draws its own edge, as `ArticleHeader` does, hides the
frame's rule.

`header` renders first, before the rule and the grid, so it is the place for an opening that must
come before both rails: the answer, the summary of findings, or the first paragraph a phone reader
should see before the contents or the metadata. Put the opening after the `ArticleHeader` inside
the `header` snippet. `summary` is the top of the center column instead: inside the grid, after
the left rail in the DOM, and below it on phones when `leftMobile` or `paneOwnedRail` shows it.
From 1024px, with both rails, the frame sets `--detail-center-width` to the center track's width,
so content in `header` can line up with the center column
(`max-width: calc(var(--detail-center-width, 46rem) + 2 * var(--space-page-x))`, centred, with
`--space-page-x` inline padding); the reading `ArticleHeader` does this itself.
 `left` and `right` render in
frame asides that stick below the chrome at `--detail-rail-top` (default `--chrome-offset`) and
hide below 1024px, unless `leftMobile` keeps the left one. `rail` replaces the left cell with the
caller's own element, such as a rail that becomes a sheet on mobile. `railScroll` caps rails to the
viewport with internal scrolling; `paneOwnedRail` stacks the left rail above the center. With
both rails the grid is `1fr 2fr 1fr`, or uses `measure` as the center maximum. With `toc` the
frame tracks the active entry (bind `activeId`), lands same-page fragments when `landFragments` is
set, and shows `TocPill` below 1024px when both `toc.openAria` and `toc.closeAria` are supplied,
the pill entries are nonempty, and `rail` is absent. Supply both labels or neither; omitting
them keeps active tracking and fragment handling without rendering a pill. Create one controller with
`useSectionJump(afterNavigate)` and pass it as `toc.navigation`, sharing it with `TocNav` where both
appear. The root takes ordinary attributes such as `class`, `style` and `data-testid`.

`ArticleHeader` is the header those pages share: back link, optional `category`, the `title` with
its `highlight` keyword in the accent, `subtitle`, `meta` (pending state included), and `actions`
and `controls` snippets. `highlight` accents the first case-insensitive match that is a whole word.
Words follow `Intl.Segmenter`, so `AI` never matches inside `BRAIN` and `中文` matches in
`我喜欢中文`; title and highlight compare in NFC, and the accent keeps the title's own characters.
An apostrophe between letters stays inside the word (`can` never matches in `can't`), while an
elision such as `l'`, `d’`, `qu’` or Italian `dell'` starts a new word (`espace` matches in
`l'espace`). Without `Intl.Segmenter`, letters, digits and combining marks form words under the
same apostrophe policy; text without spaces then reads as one word, so a match there may be
missed but a word is never split. `watermark`, `edgeLeft`, `edgeRight` and the `decorations` snippet draw
decorative chrome; `--article-deco-opacity` sets how strongly it reads. The subtitle and the meta
row share one mono type, `--article-meta-size`. A `ManifestoCanvas` fills the header; a `canvas`
snippet replaces it (an empty one leaves the header plain) and receives the header element once
bound (undefined before and during SSR). Its circuit grid holds still with the viewport while the
header scrolls, fixed and clipped to the header, so it lines up with a fixed page grid.
Like `ListingFrame`, it expects the page to pad its top by `--chrome-offset` and pulls itself under
the chrome. The band is compact (owner ruling, 15 November 2026): no space is added around the back
link, the title sits right under it, and the `actions` and `controls` snippets share one row where
they fit (each group still wraps inside itself), with a short floor under the last row. The back
link sits midway between the chrome and the next line; an app whose `--chrome-offset` leaves a gap
under its chrome sets `--chrome-gap` to that gap. The title keeps its size and uses
`--text-title`, so it follows the density mode; `--article-title-size` replaces it, for example
with a container-relative size. Long titles wrap between words and break inside a word only when
it is wider than the column (soft hyphens, U+00AD, choose the break); meta entries, including a
label and its date, wrap inside the column. Products need no selector inside the header for this.

That is the default, `presentation="expressive"`. `presentation="reading"` is the calm header for
articles, case studies and data pages: on the page colour, left aligned on the reading column
(`--article-measure`, else DetailFrame's `--detail-center-width`, else `46rem`, centred like the
column), with the title in sentence case as written, Inter throughout, an orange underlined back
link, and no canvas, circuit grid, chevrons, corner marks, crosshair cursor or highlight.
`watermark`, `edgeLeft`, `edgeRight`, `decorations`, `canvas`, `highlight` and `accent` are
ignored, so a page can switch presentation without changing its other props. There is no line
above the title: `category` becomes the first meta entry below it, at the meta size (15px), and a
wrapped meta line never starts with a separator. Use `DetailFrame`'s `measure` to align it with the
reading column, and put any opening in the `header` snippet after it.

Both presentations end with the built-in hand-drawn edge, in the
`article-header-boundary` slot. It spans the available header width and adds no layout height.
Use the header directly in the frame, without adding a second separator. `DetailFrame` hides its
own rule when the header already supplies this edge. Inside `PageSections` the header shares
the page's alternating ink sequence.

## Reading frame (Experimental)

`ReadingFrame` from `@yesid/ui/layout` is the calm frame for legal pages and long prose. It is
**Experimental**: its shape may change in a minor release, with migration notes. It renders an `article` with an Inter `h1` in sentence case as written, the real
date of the last change when the text has one, an optional `summary`, the contents and the body
(`children`), on a measure of about 65 to 70 characters (`--reading-measure`, default `34em` of the
reading size) with `--reading-gutter` (default `1rem`) on each side. No canvas, tape, mono labels,
numbering or glow; the contents are an unnumbered list (`role="list"`) of orange underlined links,
each a 44px target (`--size-tap-min`).

- `updated` is optional: `{ datetime, label, text }` with an ISO 8601 date (`2026-11-02`,
  optionally with a time and offset) from the text's real revision history, the product's label
  ("Last updated") and the date as the product formats it. Omit it when the text has no authored
  revision date; the frame then renders no update row, time or placeholder, and the title, summary,
  contents and body render as usual. A malformed or impossible date or time (`2026-02-31`, `T24:00`)
  throws during rendering, on the server too, whatever renders the contents. Passing `null` is not
  omission and throws.
- `sections` (`{ id, title }[]`) with `contentsLabel` renders the built-in contents list under a
  visible heading. Ids are lowercase ASCII slugs from language-independent keys, unique on the page,
  so `#contact` reaches the same section in English, French and Spanish; a translated, spaced,
  uppercase or repeated id throws. The body's sections carry the same ids.
- `contents` (snippet) replaces the built-in list for a product that renders its own navigation.
- `contentsRule` selects the top and bottom contents boundaries: `line` (default) draws solid
  rules; `hand-drawn` uses the shared `Separator` hand-drawn orange stroke. It applies to both the built-in list and a custom `contents` snippet, adds no
  focus targets or announced separators, and preserves the contents box dimensions and reading
  rhythm. With no contents, neither boundary renders. For example, pass
  `contentsRule="hand-drawn"` alongside `sections` and `contentsLabel`.
- `titleId` names the title for a landmark labelled by it.

Products keep the legal copy, the schema and server rendering.

```svelte
<ReadingFrame
  title={copy.title}
  updated={{ datetime: page.updatedAt, label: copy.updatedLabel, text: formatDate(page.updatedAt, lang) }}
  sections={keys.map((id) => ({ id, title: copy.sections[id].title }))}
  contentsLabel={copy.contents}
>
  {#snippet summary()}<p>{copy.summary}</p>{/snippet}
  {#each keys as id (id)}<section aria-labelledby={id}><h2 {id}>{copy.sections[id].title}</h2>…</section>{/each}
</ReadingFrame>
```

## App controls and frame

Import `DateRangePicker`, `NetworkPicker` and `AppFrame` from `@yesid/ui/layout`.

- **DateRangePicker** takes a controlled `value` with `start`, `end` and optional `presetId`.
  Supply ready ranges as `{ id, label, start, end }`, with unique nonempty IDs.
  The picker emits the resolved dates and preset ID through `onValueChange`. Other dates
  open the native start and end fields. Applying valid custom dates emits the dates without a
  preset ID. Apply dates with the button or Enter in either date field. All dates use
  `YYYY-MM-DD` with inclusive `min` and `max`. Supply localized
  `legend`, `presets`, `custom`, `start`, `end`, `apply`, `missing`, `bounds` and `order`
  strings in `labels`. Use `missing` for a missing or invalid calendar date. A validation
  error marks the affected fields and focuses the first one.
- **NetworkPicker** takes a localized `label`, `networks` entries of
  `{ id, city, name, shortCode }`, a selected ID as `value`, and `onValueChange(id)`.
  It displays “city · name” and uses the short code below 600px. Native options use the full
  labels at every width. An empty list omits the control.
- **AppFrame** takes `header`, optional `controls`, main `children` and optional `footer` snippets.
  Use `mainLabel` to name the main landmark and `footer` for the site footer. Place
  `SiteHeader` in `header`. The pill and controls stick together and reserve their space in flow
  from the first render. `bind:chromeHeight` reports their combined height in CSS pixels after
  layout and on resize. Within the frame, `--app-frame-chrome-height` exposes that measurement.
  `--chrome-offset` is the sticky clearance and becomes zero when tall chrome scrolls away.
  `--app-frame-header-height` measures the header row alone. Set
  `--app-frame-chrome-height-ssr` and `--app-frame-header-height-ssr` on a parent to supply
  first-render clearance for a known layout. The frame owns `<main id="main">` for the skip link.
  In document mode the frame sets the document’s scroll clearance while mounted.
  Controls can scroll independently when space is tight.
  Pass `evidence={{ rail, label, openAria, closeAria, summary, mobileVisible }}` to put a `SurfaceRail` on the right at
  desktop widths and in its sheet below 1024px. For a map, `fullViewport` sizes the frame to
  the dynamic viewport and lets the main area fill the remaining height below the chrome.

At narrow available widths with enlarged text, a `ProductBrand` gets a row above the other
controls inside the header pill. This keeps the product name readable at 200% on a phone.

## Site announcement banner

Import `AnnouncementBanner` from `@yesid/ui/layout`. Render one in the site shell above the header,
with the same message ID on every page and in every locale. Render it as a sibling before
`SiteHeader` so the pill follows the banner's wrapped height before and after hydration. The
message is the link and names the region. The app supplies all copy, including the close button's
accessible name.

```svelte
<script lang="ts">
  import { AnnouncementBanner } from '@yesid/ui/layout';
</script>

{#if announcement}
  <AnnouncementBanner
    id={announcement.id}
    message={announcement.message}
    href={announcement.href}
    closeLabel={copy.dismissAnnouncement}
  />
{/if}
```

Add `%yesid.announcementBannerBoot%` to `app.html` inside `<head>` before `%sveltekit.head%`.
Use the same ID for both the head and the rendered banner. For a site-wide message, import its
ID from the same module in the layout and server hook.

```ts
import { injectAnnouncementBannerBoot, injectThemeBoot } from '@yesid/ui/head';

// In the existing resolve options in hooks.server.ts:
transformPageChunk: ({ html }) =>
  injectAnnouncementBannerBoot(injectThemeBoot(html), announcement?.id),
```

Pass `undefined` when omitting the banner. If the site uses a hash-based CSP, add
`announcementHash` from `@yesid/ui/boot.json` to `script-src` alongside the theme boot hash.
Keep the component CSS so a saved dismissal takes effect before first paint. Dismissal is stored
per ID on this origin. Change the ID when publishing a new message. Blocked storage leaves the
banner visible. With JavaScript disabled, the banner and link remain available.

## Site header

`SiteHeader` is the floating pill header with a full-screen metro-line menu on a bits-ui Dialog.
The pill renders inside the dialog, so it stays above the open menu and inside its focus trap.
Call `createNavigationLifecycle` from `@yesid/ui/brand` once during the persistent app layout's
initialization with `beforeNavigate`, `onNavigate` and `afterNavigate` from `$app/navigation`,
plus optional `subscribeNavigation` when the router can publish every accepted start.
Pass its result as `navigation`: the menu closes before a navigation lands, and a language switch
from the open menu keeps it open. The lifecycle interrupts Lenis momentum even without a header.
It reconciles redirect and superseding events in `onNavigate` when `beforeNavigate` was skipped,
and re-closes a menu reopened during loading before waiting for its animation and focus trap.
Without a subscription, direct language switches work through matching native hook events.
An eventless step discards locale intent: a language switch that lands on a redirect closes the
menu without locale refocus. The fallback restores ordinary page focus even when a link disabled
the router reset through `preserveState`. Kit 3 apps omit the subscription and use this fallback; no
bridge/SDK change is required. The example below targets Kit 3.

A supplied subscription must publish every accepted start before loading/redirecting, including
superseding links whose before hook is skipped, with the exact original native `NavigationEvent.event`.
Redirect hops may omit it. Cancelled clicks are never published; null denotes idle and the return
value unsubscribes. Partial or late streams are unsupported: an eventless redirect during an
accepted load cannot be distinguished from a superseding start missing its event. Completed-event
replays are ignored, but unseen late events cannot be identified. Omit the subscription if the
router cannot meet the full contract. See the migration note for both consumer integrations.
Momentum cancellation uses Lenis stop/start in the same callback, preserving an existing external
stop and leaving input available if navigation is canceled.

```svelte
<script lang="ts">
	import { beforeNavigate, onNavigate, afterNavigate } from '$app/navigation';
	import { createNavigationLifecycle } from '@yesid/ui/brand';
	import { SiteHeader } from '@yesid/ui/layout';
	import { page } from '$app/state';
	const navigation = createNavigationLifecycle({
		beforeNavigate, onNavigate, afterNavigate,
	});
</script>

<SiteHeader
	{navigation}
	home="/"
	links={[{ href: '/work', label: 'Work', current: true }, { href: '/blog', label: 'Blog', priority: 2 }]}
	menuItems={[{ href: '/work', label: 'Work', subtitle: 'Selected projects', current: true }]}
	labels={{ openMenu: 'Open menu', closeMenu: 'Close menu', menu: 'Site menu', theme: 'Dark theme', menuFooter: 'Navigation · All routes', skipToContent: 'Skip to content' }}
	language={{ locale, locales: ['en', 'fr'], href: (next) => localizeUrl(page.url, next), label: 'Language', names: { en: 'English', fr: 'Français' } }}
/>
```

Nav text keeps one size at every width: links at `--text-nav-link-*` (16px) and the wordmark at
`--text-nav-brand-*` (18px). Links that don't fit move to the menu instead of shrinking: links show
from 375px of header width (the default `priority: 1`), `priority: 2` from 600px and
`priority: 3` from 1024px, and only while the pill fits its header with 4px to spare. The 600px
step leaves room for the theme and language toggles, which stay in the pill at every width. When
the links do not fit, a whole priority leaves at a time, 3 first, then 2; priority 1 leaves only
when it cannot fit alone, so a product's main call to action stays beside the toggles. The header
measures its real labels, so a longer language moves its links to the menu on a wider screen than a
shorter one. Before the app script runs, only the width thresholds apply. Keep every header link in
`menuItems` too.

A wider brand or more controls (a product brand, search, actions) can make the full pill wider
than its header at a width where the default thresholds already show a priority. The header then
looks right before the app script runs and drops that priority once it measures, moving the
toggles. Raise the thresholds with `linkTiers` so both states agree:
`linkTiers={{ priority3: 1280 }}` shows priority 3 from 1280px. `priority2` takes 768, 1024 or
1280 and `priority3` takes 1280, 1440 or 1600; omitted, the defaults above apply.

The link tiers, defaults and `linkTiers` alike, are static container-query rules written in em
and named here in px at the default 16px font size (1280 is 80em). They decide the same before
hydration, after it and without JavaScript, and they scale with the reader's font size: a
1280px tier is 1600px at a 20px default, where rem-sized brands and controls are wider too.
links-fit never brings back a priority these widths hide. Pick the smallest width at which the
full pill fits in every language you publish, with 4px to spare on each side; the Gallery proves
a still header through hydration at 16px and 20px for its wide fixture, and other compositions
need the same check in the product. Each priority hides below its own width, and the links row
with its divider hides only below the lowest width among the priorities present, so raising
priority 2 never hides priority 3 at its own width. The `search` snippet keeps its 1024px step
in px, because products pair their own compact search with it.

The optional `search` snippet shows from 1024px and folds away with the links while the menu is open;
`actions` render before the theme, language and menu controls. The app marks `current` links and
items; snippets can query the header's width with `@container site-header`. A menu item's `icon`
(any Lucide icon component, such as `@lucide/svelte/icons/map`) replaces its stop and lights up on
the current page. All copy belongs to the app: `labels.menuFooter` and `labels.skipToContent` are
required, with an empty footer string hiding it. The header opens with the named skip link to
`#main`, shown on focus, and the pill is the page's banner. Every product renders the same skeleton: `SiteHeader`, then
`<main id="main">`, then `SiteFooter` outside `main`.
`--site-header-inset-end` narrows the header beside a docked panel, animated over
`--site-header-inset-duration`. The menu starts below the app's `--chrome-offset` (default `--nav-clearance`); page offsets read
`--nav-clearance` from `base.css`.

`menuGroups?: readonly SiteHeaderMenuGroup[]` supplies visible group headings and ordered items.
Each group has `{ label, items }`. When supplied, groups replace `menuItems`, including an empty
array. `menuItems` is optional and defaults to an empty array.
Keep every header destination in the selected menu source. Headings use the supplied case and copy.
Grouped menus lay out as organized columns from 768px (one column per group while they fit, then
wrapping) and as one column below it; each heading still labels its own list and reading and tab
order stay group order across the columns.

Every vertical divider in the pill takes one inline space on both sides, from `--nav-split-space`
on `.nav-pill`: 20px by default and 10px, 4px and 2px at the phone compaction tiers. `ProductBrand`
inside the pill uses the same value, so "yesid. | Transit" and the kit's own `|` agree. A product
brand snippet that draws its own `|` owns that spacing: use `ProductBrand`, or space its divider
with `var(--nav-split-space)` so it matches. The divider space never changes the 44px targets, the
pill's fit or the link priorities.

`compactControls` is deprecated: the theme and language toggles stay in the pill
at every width in every product (owner decision of 14 November 2026, `DECISIONS.md` D19). Omit
the prop; see [compact controls](../../docs/migrations/compact-controls.md). It stays functional
until removal. `compactControls` defaults to `false`. When enabled, below 600px of header container width the
pill hides theme and language controls and the open menu shows them with `labels.theme`,
`language.label` and the supplied language names. At 600px and wider the controls stay in the pill.
Only one copy is rendered. The language control retains `preserveState` and lifecycle focus handling.
Use `actions` for a labelled button such as Search in the freed pill space.

Before hydration, the menu button opens the existing controls with a native HTML popover,
including when JavaScript is delayed or disabled. Language is a real navigation link; the theme
switch is reachable and needs JavaScript to act.
Hydration hands off to the dialog without changing the pill's layout. Compact mode also keeps
priority-1 links eligible below 375px when they fit, and keeps priority 2 from 500px because
its controls are in the menu; priority 3 folds away below 1024px. Without `compactControls`,
links fold away below 375px.

`Wordmark` is the name plus accent dot with the `wordmarkHover` effects (`autoPlay` plays one on
mount). `LanguageToggle` is a plain signpost link: one board per locale, linking to `href(next)`.
`LANGUAGE_ORDER`, exported from `@yesid/ui` and `@yesid/ui/brand`, is `['en', 'fr', 'es']`.
The signpost draws and cycles supported languages in that order, then any other locales in their
supplied order. For example, `['fr', 'en', 'es']` draws EN, FR, ES and English links to French.
Products choose their supported set, default, hrefs and copy. SiteHeader uses the same
order in the pill and compact menu, including the compact menu's language names.
Its required `names` map supplies an autonym for every supported locale; no language names ship
in the component. `preserveState` keeps scroll and page state (`data-sveltekit-reset="false"`);
the lifecycle restores focus after landing. Inside SiteHeader this uses a bound native link ref;
standalone links pass their `bind:ref` to the lifecycle's optional `languageLink` getter.
`reload` asks for a full document load. LanguageToggle registers no router hooks.
`resetFocusAfterNavigation` is the same reset for `goto(url, { reset: false })`.
The [migration note](https://github.com/yesid-dev/yesid.design/blob/v0.52.0/docs/migrations/navigation-lifecycle.md)
covers the copy and integration for Transit and yesid.dev.

## Page sections

`PageSections` and `PageSection` carry the owner's placement rule
([D22](../../DECISIONS.md#d22-section-edges-and-the-footer-edge)): every section ends with the
page's divider at its bottom, except the last section of the page, so a divider never sits before
the footer. A page composes its sections with them and draws no divider itself.

```svelte
<script>
	import { PageSection, PageSections, SiteFooter } from '@yesid/ui/layout';
</script>

<main id="main">
	<PageSections divider="hand-drawn" data-register="expressive">
		<PageSection aria-labelledby="work">...</PageSection>          <!-- ends with the edge -->
		<div class="product-wrapper">
			<PageSection aria-labelledby="services">...</PageSection>  <!-- ends with the edge -->
		</div>
		<PageSection aria-labelledby="contact">...</PageSection>       <!-- last: no edge -->
	</PageSections>
</main>
<SiteFooter edge="hazard" {...footer} />                           <!-- its hazard edge -->
```

`PageSections` renders a `<div>` and `PageSection` a `<section>`; both forward their attributes.
Each `PageSection` registers with the nearest `PageSections` at any depth, so product wrappers do
not matter, and every registered section after the first is preceded by a boundary in the
`page-section-boundary` slot. `divider` picks that divider for the whole
page: `dimension` (the default), `hand-drawn` for the drawn page edge yesid.dev uses, or `hazard`
for the kit tape. The choice lives on `PageSections`, so a change follows immediately without touching the
sections. Hand-drawn page boundaries alternate four and five pen strokes from edge to edge,
with small gaps and a slight wobble. Editorial header edges count in that same document order.
Only the upper half of the 20px canvas paints at the joined edge, leaving zero layout height.
Standalone and card separators draw their full 8px canvas with one stroke. Dimension and hazard
boundaries are rows in the flow.
Every boundary stays outside the sections and as wide as `PageSections` (make that full-bleed
for an edge-to-edge line), above section backgrounds. Order is document order, on the server too; a section that mounts later takes
its place. Plain `<section>`s do not register, and a `PageSection` inside another, or outside
`PageSections`, is a plain section.

A registered section carries `data-page-section-edges`, and `base.css` hides the kit's edge rules
inside it (`data-edge-rule`): Masthead's and ErrorPage's tape and DetailFrame's rule without a
header. The boundary owns the section's edges, so a Masthead that is a whole section gives one
stroke, and the final section leaves nothing before the footer. Internal rules (DetailFrame and
ListingFrame under their header, TerminalPanel and CodeBlock under their title bar) stay.

## Site footer and error page

`SiteFooter` renders a decorative, still edge along its top (D22), the `brand` snippet with a
`tagline`, one labelled
navigation per entry in `groups` (`navLabel` when the accessible name differs from the heading;
`external` links open in a new tab with `rel="noopener noreferrer"`, and `me` adds `rel="me"` for
the owner's own profiles; `after` adds controls inside the group), and a status row with
optional `statusStart`, and, when `statusPrefix` is supplied, a live lamp (`liveLabel` for screen
readers) and today's date. `edge` picks the top edge: `hazard`, the diagonal yellow and black
`Separator variant="hazard"` strip (3px, full width) that every product passes, or `street`, the
default, one dashed road marking whose 20px dashes alternate yellow and white, edge to edge, with a
hairline on the white dashes so they read on the light footer. Groups, links, the status row and
`data-in-view` behave the same either way. Pass `ProductBrand` through `brand` for a product's
"yesid. | Product" mark. The self-made status pair (`statusPrefix` and `liveLabel`) is deprecated;
use `statusStart` with a real source, subject and observation time, or omit both props.
The date describes the visitor's day, not service health. Lamps stay still under the
no-endless-decorative-loops policy. See [the migration](../../docs/migrations/footer-status.md). The status props form an all-or-nothing union: supply both
`statusPrefix` and `liveLabel`, or omit both. This keeps every rendered lamp named for screen
readers. `statusStart` is independent; without it or the status pair, the entire row is omitted.
An empty string still opts into the status. `data-in-view`
reports whether it is on screen.

`ErrorPage` is the error route body: hazard rule, `ErrorIllustration`, `label`, `heading`, `body`,
optional `detail`, `suggestions` in a navigation named `suggestionsLabel`, and a terminal line when
`statusNote` is given. For 404 the scene's sign shows the code; other statuses announce the code
with `role="alert"`. The app keeps its copy and `<svelte:head>`. Every part renders by default and
each can be turned off: `label` is optional (omit it to start with the heading),
`tape={false}` drops the hazard rule (`tape="dimension"` draws the dimension line instead, D22), and `illustration` places the scene: `'large-first'` (the
default, a large scene above the copy), `'small-after'` (a small scene after the heading, body,
destinations and terminal line, so the way back comes first) or `'none'`. The scene's lamps are
still. The suggestions navigation is always named: by `suggestionsLabel`, or by the heading when
the label is missing or empty.

## Data pages

`@yesid/ui/layout` also exports the parts of a data page. `Surface` is the page column with the
page gutter. `Masthead` heads a surface with an optional station `kicker`, a dotted `heading`
(`dot={false}` drops the dot), optional `lede`, `meta` and body, and a hazard tape (`tape={false}`
drops it, `tape="dimension"` draws the dimension line instead, D22); its `cornerMeta` snippet takes a `CornerMeta`. A task page starts with its heading: omit
`kicker`, and drop the tape. The masthead sets no fixed heights, so long French and Spanish
headings wrap. `Breadcrumb` renders `items` (`{ name, href }`) as a navigation named
`label`, with the last item as the current page, and nothing for fewer than two items; build the
trail's JSON-LD with `buildBreadcrumbListJsonLd` from `@yesid/seo-kit/jsonld`. `ControlsRail` is
a card that groups controls under `label`. `DashboardGrid` fits as many `minTile`-wide columns as
the width allows; with `label` (and not `as="ul"` or `as="ol"`) it is a named region.
`SurfaceRail` is a page's controls rail: a landmark that sticks below `--chrome-offset` from 1024px, and below that a pill
(`label`, `summary`, `openAria`, `closeAria`) that opens the same rail in a bottom sheet. The
`rail` snippet receives `closeSheet` and the current `presentation`; pass the rail to
`DetailFrame`'s `rail`. With a TocPill on the same page the two pills stack (see TocPill); put
`.chrome-clearance` on the scrolling element so focused controls stay clear of both.

`@yesid/ui/table` exports `DataTable`. Columns give a `header`, a `cell` snippet and optional
`align`, `numeric` (right-aligned tabular figures), `width` and `rowHeader`. `caption` is
required and names the table. `responsive` stacks each row into label and value pairs below 448px
(`at: 'compact'`) or 1024px (`at: 'tablet'`), or scrolls sideways (`mode: 'scroll'`, with
`minWidth` and `minWidthCompact`); a scrolling table that overflows becomes a focusable region
named by its caption. `frame="card"` draws a rounded card, `headerBand="terminal"` tints the
header, `tableClass` styles the table and other attributes go to the frame.

`@yesid/ui/feedback` exports `StateNotice`, the quiet empty, error and status notice: `title`,
optional `body`, a `glyph` tinted by `tone`, and `meta` and `action` snippets. `tone` is
`neutral` (default), `positive`, `warning` or `error`; the last three use `--success`,
`--accent-text` and `--destructive`, the interface colours, never the transport status tokens. `presentation` is
`responsive` (default), `silo`, `card`, `pill` or `row`; a pill or row without snippets renders
inline. Pass `role` and `aria-live` when the notice reports a change. With a `role`, the title names it.

## Site root and shared state

`@yesid/ui/layout` exports `SiteRoot`, the app root. The expand-all control remembers one origin-wide choice for content sections. On mount SiteRoot adopts the theme the boot script applied and starts Lenis
through `@yesid/motion`; it cleans up on unmount and renders no element of its own. Every in-house
product shows the yesid dot in its browser tab. On load, `SiteRoot` calls `theme.init()`, which
repaints every `link[rel="icon"]` with that mark in `--primary`, replacing the supplied href even
without a theme change; later theme changes repaint it too. Props:

- `smoothScroll` (default `true`): `false` leaves native scrolling.
- `scroller`: `{ wrapper, content }` selectors for an element scroller. `content` must wrap the
  whole scrolling flow. Omit it to scroll the window.
- `lang`: the page's language. The server fills `<html lang>` (for example by replacing `%lang%`
  in `transformPageChunk`); `SiteRoot` keeps it current after client navigation.

The app keeps its own navigation, scroll-restoration, and analytics handling.

`@yesid/ui/state` exports shared state and page actions:

- `theme`: `current`, `isDark`, `set`, `toggle`, `init`. Dark is the default, system preference
  is ignored, the choice persists under `theme`, `data-theme` is set on `<html>`, `meta[name=
  "theme-color"]` follows `--background`, every `link[rel="icon"]` becomes the brand mark in
  `--primary`, and a `themechange` event fires on `document`.
- `sections`: page actions for mounted content sections. `count` counts registered collapsible
  sections. `allCollapsed` is true only when
  all registered sections are closed; `collapseAll()`, `expandAll()` and `toggle()` reach those
  sections only. Filter groups and listing filter panels keep their own independent toggles.
  On pages with a `SectionsToggle` and at least two content sections, the first visit starts
  expanded with a neutral control, except sections opted into `firstVisitClosed`. After Collapse all the control is orange, and `activeEffect`
  defaults to `glow`. Bulk actions write
  `collapsed` or `expanded` to the one localStorage key `sections-choice`. That choice applies
  across pages and browser visits on this origin. Individual toggles and section jumps never
  write it. The TOC, filters, listing panels, static cards and `independent` panels stay outside
  this choice. Below the threshold sections use declared defaults. Malformed values use the
  selective first-visit defaults; blocked storage closes opted sections and otherwise uses declared defaults. No cookie, server or
  CMS state is involved.
- `desktop`: a Svelte `MediaQuery` at the `breakpoint.desktop-min` token (1024px). It is false
  during SSR.

It also exports two helpers that `SiteRoot` doesn't initialize:

- `clock`: one shared wall clock for live timestamps. `now` ticks every second while anything
  holds a subscription (`$effect(() => clock.subscribe())`), every 30 s under reduced motion, and
  pauses in hidden tabs. `noteServerEpochMs(ms)` anchors `serverNow` to a server timestamp such as a
  response's `Date` header; `serverNowContinuousMs()` reads it without stepping back by less
  than 2 s, for animation.
- `createLocaleContext<Locale>(fallback)`: `{ provide(read), get() }`. The root layout calls
  `provide(() => data.locale)` once; components call `get()`, which returns `fallback` where
  nothing provides a locale. One per app: the context key is `Symbol.for('@yesid/ui/locale')`, so a
  component test provides a locale with `context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']])`.
  Formatting and copy typing live in `@yesid/i18n-core`.

`persisted(key, initial)` is not initialized by `SiteRoot`. It returns tab-scoped state in
`sessionStorage` under `persisted:<key>`: it survives reloads and navigation within the tab and
resets in a new tab. `bind:value={state.value}` works directly. Values must be `LocaleFree`
(strings, numbers, booleans, null, and arrays of those), so store ids and flags, never translated
text. During SSR it returns the seed.

The generic store serves search and selection state. Disclosure components and the head boot
script do not use it. `persisted:*` disclosure keys and `quiet-mode` are ignored, not deleted.

## Head

`@yesid/ui/head` exports `SeoHead`, `injectThemeBoot` and `injectAnnouncementBannerBoot`.
See [Site announcement banner](#site-announcement-banner) for the banner's head setup.

`SeoHead` writes a page's head tags from resolved values: `title`, `description`, `siteName`,
`canonical`, `alternates` (`{ hreflang, href }`, x-default included when the app wants one),
`ogLocale` and `ogLocaleAlternates`, `image` (`{ url, alt, width = 1200, height = 630 }`), `type`
(`website`), `noIndex`, `twitter` (`{ site, creator }`), `author`, `themeColor` (the dark
`background` token) and `jsonLd` (one `@graph` script). Without `canonical` it writes no canonical,
`og:url` or hreflang, which suits error pages. The app keeps its locale, URL and copy policy.

`description` also accepts a selected result from `resolveShareCopy` in
`@yesid/seo-kit/share-copy`. Resolve ordered content fields once and pass the selected object to
both `SeoHead.description` and `renderOgPng`'s `title`. Meta, Open Graph and Twitter description
tags use the selection's bounded `description`; the image uses its independent primary `ogLine`.
Handle a `status: 'missing'` result before rendering.
No per-page hard-coded share copy; write it in the content fields. See the
[SEO package examples](../seo-kit/README.md#content-derived-descriptions-and-share-cards).

`injectThemeBoot(html)` replaces `%yesid.themeBoot%` with the boot script. Put the placeholder in
`app.html` before `%sveltekit.head%` and call it from `transformPageChunk`. Before first paint the
script sets `data-theme` from the `theme` key (dark otherwise). It also handles a rejected
cross-document view transition during reload. It also reads `sections-choice` and applies section geometry before paint. Keep this script
in the head before page content and keep the package's component CSS: hydration adopts that
geometry without a flash. The server supplies eligibility on the injected script so the first
section has its initial geometry while later HTML is parsing. The body, header and TOC stay
visible during parsing. Boot exceptions and failed same-origin `/_app/` module scripts or
modulepreloads expose pending content. Optional and cross-origin script load failures preserve
the stored section choice. A five-second recovery also exposes pending content if app startup stalls. Hydration preserves that
readable fallback on those pending cards. Future mounts adopt the stored choice. Startup error
listeners and observations are released when the pending mounts finish. Pending triggers, body
semantics and the bulk accessible name match the visual state. Recovery keeps the control’s
layout space while the inactive control is hidden and disabled.
The server renders complete, open section bodies, including declared-closed
ones, so JavaScript-disabled reading stays available. Interactive closed bodies remain mounted,
clipped, `inert` and `aria-hidden`; browser find-in-page cannot generally search them until opened.
TOC and fragment jumps reveal their targets and enclosing sections. Responsive charts and media
keep their DOM; products must verify their actual measurement/lazy-mount code during adoption.
A hash-based CSP allows it with the source in
`@yesid/ui/boot.json` (`{ "hash": "sha256-…" }`), which Node config files can import. A CSP that
relies on `'unsafe-inline'` must not add the hash, because any hash switches `'unsafe-inline'` off.

### Header brand and empty menus

`SiteHeader.brand?: Snippet` replaces the default Wordmark area. The caller owns the snippet's
links, sizing and motion. For example, compose a still house `Wordmark` beside a product link
reading "login". ThemeToggle and LanguageToggle keep their standard look and behavior.
`wordmarkAutoPlay` defaults to `true`; pass `false` to stop the default Wordmark's mount animation
while preserving its hover effect. It has no effect on a supplied `brand` snippet.

For the house-plus-product identity, pass `ProductBrand` (below) through this snippet.

When the effective menu has no items, the menu button is omitted. `menuGroups` takes precedence
when supplied, including empty groups. With no menu, `compactControls` keeps the controls in the
pill so they stay reachable.
The native compact popover before hydration has an 8px gap below the pill and the same visible
control labels as the hydrated menu and the same toggle artwork. The menu button's
focus outline follows its round corner shape.

### RailTitle (Experimental)

`RailTitle` is a section title on the side rail ([D23](../../DECISIONS.md#d23-rail-titles)), as on
yesid.dev's home and services pages. It is Experimental: an incompatible change waits for a minor
with migration notes.

```svelte
<section aria-labelledby="work-title">
  <RailTitle heading="Selected work" side="left" titleId="work-title">
    <ProjectCards />
  </RailTitle>
</section>
```

With `children`, RailTitle lays out the section: from 1024px a rail on each side (both
`--rail-title-rail` wide, default `clamp(4.5rem, 8vw, 8rem)`, so the content stays centred) and the
content between them; the title sits on its `side` rail (`left`, the default, reads bottom to top;
`right` reads top to bottom). The title is sticky: it holds `--rail-title-top` below the viewport
top (default `--chrome-offset`, else `--nav-clearance`, plus 1rem, clear of the header pill) while
its section scrolls, then leaves with the section's end as the next section's title takes over.
It never overlaps the content, which keeps its own column, and it is never wider than the rail.
After hydration the title fits the room between the clearance and the bottom of the scrollport it
sticks in (the nearest scrolling ancestor, else the viewport): a longer title shrinks, never below
12px; one that would need less reads horizontally above the content instead. It refits when its
words, `dot`, `size`, `horizontalSize` or `level` change, when the scrollport or the title resizes, at the breakpoint
and when the web font loads. As its section scrolls away, the part of the title above the
clearance line is clipped, so it never paints under the header pill. `clipAtHeader` (default
`true`) controls that scroll-applied clip: `false`, as yesid.dev passes, lets the title leave
naturally with its section, with the same sticky placement, scrollport fitting, 12px horizontal
fallback and sizing. Below 1024px it reads
horizontally above the content, in SectionHeading's display type, inset by `--space-page-x`.
`horizontalSize` optionally sets that horizontal font size, including the too-long-to-rotate
desktop fallback. For example, `horizontalSize="2rem"` gives a 32px title at a 16px root and
continues to scale with the visitor's text size. It does not change the rotated `size`.

It is the section's real heading, first in the section's DOM order: `level` (default 2) picks the
element and `titleId` its id. `dot` (default `true`) ends it on the brand's orange dot, drawn as
SectionHeading draws it and hidden from assistive technology. `size` sets the rotated title's
font size, for example one size shared by every title on a page (default
`min(clamp(3.5rem, 7vw, 6rem), 5.5dvh)`), capped at seven eighths of the rail. Without `children`
it draws only the title, for a frame that owns its rail column; `decorative` then draws it as
hidden decoration (no heading), as ListingFrame's edge title does beside its real h1.

### ProductBrand (Experimental)

`ProductBrand` is the product-brand cluster: the still house `Wordmark`, a 2px divider and the
product name as a link, as in "yesid. | Login". It is Experimental: an incompatible change waits
for a minor with migration notes. Pass it through SiteHeader's `brand`
snippet for a narrow product navbar, and through SiteFooter's `brand` snippet.

```svelte
<SiteHeader {navigation} {home} links={[]} {labels} {language}>
  {#snippet brand()}
    <ProductBrand product="Login" href={home} houseHref="https://yesid.dev" houseExternal
      houseLabel="yesid.dev (opens in a new tab)" />
  {/snippet}
</SiteHeader>
```

`product`, `href` and `houseHref` are required; the product owns every word, so the name keeps
the case it is written in. `houseExternal` (default `false`) opens the house link in a new tab
with `rel="noopener noreferrer"`; say so in `houseLabel`, the house link's accessible name.
`current` marks the product link with `aria-current="page"`. Both links keep a 44px target and
the shared 2px focus ring; the product name is the foreground colour at rest and the clickable
orange on hover, without an underline. The divider is `aria-hidden`. Inside `SiteHeader` its split
space is the pill's `--nav-split-space`, the same on both sides as every navbar `|`; elsewhere the
cluster keeps its 0.5em gap. The cluster takes
`--text-nav-brand-desktop` (18px) unless a caller class sets another size, and a long name wraps
between words beside the house mark instead of overflowing. The theme and language toggles keep
their standard look beside it.

`houseStyle`, `productStyle` and `dividerStyle` optionally style the two links and decorative
divider directly. Omit them for the default header and footer sizes. Use `rem` sizes
to follow the visitor's text size; keep both links, their full names, minimum 44px targets and
focus rings. The root `style` controls layout. For example, a footer can retain an
18px house mark and 24px product name, then stack them and hide the divider when its own column
is narrower than 9.5em, including with enlarged text:

```svelte
<div class="brand-space">
  <div class="brand-layout">
    <ProductBrand product="Transit" href={home} houseHref="https://yesid.dev"
      houseStyle="font-size: 1.125rem" productStyle="font-size: 1.5rem"
      dividerStyle="display: var(--brand-divider, block)"
      style="flex-direction: var(--brand-direction, row); align-items: var(--brand-align, center); gap: var(--brand-gap, 0.5em); max-inline-size: 100%" />
  </div>
</div>

<style>
  .brand-space { container-type: inline-size; inline-size: 100%; }
  @container (inline-size < 9.5em) {
    .brand-layout {
      --brand-direction: column;
      --brand-align: flex-start;
      --brand-gap: 0;
      --brand-divider: none;
    }
  }
</style>
```

The wrapper's column supplies the available width. The custom properties above are chosen by
this caller and passed through public styles; no descendant selectors or product-specific
breakpoints ship in ProductBrand.

## Base stylesheet

`@yesid/ui/base.css` is the base layer both products share: resets, the dark variant, selection,
focus ring, text links (a link without a class is underlined in `--primary`; components
style their own), scrollbar, circuit grid, shared keyframes, label styles, `.glass-chrome`, the
`TerminalPanel` and `CodeBlock` classes (`.terminal-*` and `.syn-*`, in the components layer), the
`SiteHeader` geometry (`--nav-top`, `--nav-padding-y`, `--nav-clearance`), the dimension and
hand-drawn lines (`.dimension-line`, `.hand-drawn-line`) and the rule that hides kit edge rules inside a page section, a focus outline under forced
colors and the
View Transitions route crossfade (off under reduced motion; pair it with `onNavigate(viewTransition)`
from `@yesid/motion/utils/viewTransition`). It imports
`tw-animate-css` from its own dependency for Sheet motion, plus `@yesid/tokens/theme.css`,
which provides the Tailwind theme and the semantic color utilities
(`bg-primary`, `text-muted-foreground` and the rest). It uses Tailwind v4 directives, so import it
from the app stylesheet after Tailwind:

```css
@import 'tailwindcss';
@import '@yesid/ui/base.css';
```

Like every package stylesheet, it is opt-in; no JavaScript import loads it.

### Label roles

- `.label-reading`: data and form labels. Inter, sentence case as written, no tracking, 15px,
  weight 600, muted reading ink. "Observation period", "Email address", "Last updated".
- `.label-station`: real signage only (route plates, sign codes, departure boards). Mono, tracked
  uppercase, yellow.
- `.label-section` and `.label-metric` are kept for compatibility; reading and task pages use
  `.label-reading`.

Numbering, hazard tape and artwork carry meaning only when the content has it: number a real
sequence (steps, ordered procedures), use hazard tape for a real caution or the page's signature,
and keep artwork to a signature region. A section starts with its heading, never a label above it.

### Chrome clearance

Opt-in. Put `.chrome-clearance` on the element that scrolls (normally `<html>` in `app.html`):

- `scroll-padding-top` is `--chrome-clearance-top`, else SiteHeader's `--nav-clearance`, so
  backward Tab, fragment links and `scrollIntoView` land below the floating header. Set
  `--chrome-clearance-top` on `:root` when the app's header has another height.
- Below 1024px, with a TocPill or a SurfaceRail pill on the page, `scroll-padding-bottom` is
  `--floating-pill-clearance` (one pill: 20px from the edge, 44px tall, plus 1rem), or
  `--floating-pill-stack-clearance` with both pills, so forward Tab keeps focus above them.
- The section-jump controller subtracts the scroller's `scroll-padding-top`, so contents jumps still
  land on the 25% line the active-section observer reads.

With an element scroller (`SiteRoot` `scroller`), put the class on that wrapper; the pill rules
look for the pills inside it, so set `scroll-padding-bottom` yourself when the pills render outside.

Table headers and cells use `word-break: normal` and `overflow-wrap: break-word`: ordinary
words stay whole, while a single word wider than its cell can wrap. Products with custom table
wrapping rules should check their cascade against it.

## Develop

```sh
bun run --cwd packages/ui test
bun run --cwd packages/ui check
bun run api:check
```

Package tests and the Gallery's browser suite cover the shared behavior. Each product still runs
its own tests, build and browser checks when it takes a release; a pass here does not replace them.

## Labelled field recipe

Compose native labelled fields using the [recipe](../../docs/recipes/labelled-field.md).
The Gallery route /labelled-field demonstrates EN, FR and ES error recovery, busy text
and the input-token boundary. There is no Field component.

### Reading data and search controls

MetricDisplay defaults to `tone="accent"` (yellow) and `layout="stacked"`. Products pass `tone="reading"` for ordinary figures, reserving accent
for the screen's one highlight. Figures use tabular numerals. `layout="phone-row"` places
the label beside the value below 640px; larger screens stack them. `labelBelow` controls source
order. `labelRole="reading"` uses the Inter, sentence-case `.label-reading` role; the default
`labelRole="metric"` is the compact uppercase mono label. Label role and value `tone` are
independent.

Context recipe: put the unit, full period and comparison in `sublabel`; supply an `info`
snippet linking to visible evidence and a method, and `absent` with explicit absence words.
A measured zero stays `value="0"`. Do not substitute zero for missing data. Published
service metrics keep their approved content without adding a date, source or tooltip.

SearchInput forwards native input attributes and events to the input, accepts `bind:ref`
for focus, and composes caller `aria-describedby` with its optional `description`.
`visibleLabel` associates a visible native label; `textSize="body"` opts into body text.
By default the label is visually hidden and the text is small mono.
`label` owns the accessible name. Placeholder remains a hint, never the label.

SegmentedChoice `variant="fit-row"` shares available width among choices and wraps whole
segments when they do not fit.
FilterGroup `selectedStyle="consistent"` gives choices and the All reset the same filled
orange selection, with radio semantics as the non-colour cue; yesid.dev's listings use it.
`legacy` is the default.
Gallery `/reading-record` composes these contracts with comparison, definition-list and
25-person in-row confirmation recipes. This fixture never establishes consumer acceptance.
