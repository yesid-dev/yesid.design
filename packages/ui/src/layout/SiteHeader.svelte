<!--
  Floating pill header: wordmark, links, optional search and actions, then the theme, language and
  menu controls. It opens with a skip link to `#main`; the pill is the page's banner. The menu is a
  full-screen metro line on a bits-ui Dialog; the pill renders inside the dialog content so it stays
  reachable and focus-trapped above the open menu.
  `--site-header-inset-end` narrows the header beside a docked panel, animated over
  `--site-header-inset-duration`. Snippets can query the header's width with `@container site-header`.
-->
<script lang="ts" module>
	import type { Component, Snippet } from 'svelte';
	import type { LanguageToggleProps } from '../brand/LanguageToggle.svelte';
	import type { NavigationLifecycle } from '../brand/navigation-lifecycle.js';

	export interface SiteHeaderLink {
		href: string;
		label: string;
		current?: boolean;
		/**
		 * 1 shows from a 375px header, 2 from 600px, 3 from 1024px (or the `linkTiers` widths), and only
		 * while the links fit; links that do not fit leave the pill a whole priority at a time, 3 first.
		 */
		priority?: 1 | 2 | 3;
	}

	/**
	 * Wider header widths from which priority 2 and 3 links show, for a wider brand or more controls.
	 * Named in px at the default 16px font size; the CSS uses em, so they scale with the reader's
	 * font size. The same static CSS applies before and after hydration, so pick a width at which the
	 * full pill fits: links-fit only takes links out, never brings back a tier these widths hide.
	 */
	export interface SiteHeaderLinkTiers {
		/** Defaults to 600px (500px with the deprecated `compactControls`). */
		priority2?: 768 | 1024 | 1280;
		/** Defaults to 1024px. */
		priority3?: 1280 | 1440 | 1600;
	}

	export interface SiteHeaderMenuItem {
		href: string;
		label: string;
		subtitle?: string;
		current?: boolean;
		/** Opens in a new tab with `rel="noopener noreferrer"`. */
		external?: boolean;
		ariaLabel?: string;
		/** A Lucide-style icon component, lit on the current page; without one the item shows a stop. */
		icon?: Component<{ class?: string }>;
	}

	export interface SiteHeaderMenuGroup {
		label: string;
		items: readonly SiteHeaderMenuItem[];
	}

	export interface SiteHeaderLabels {
		openMenu: string;
		closeMenu: string;
		/** The menu dialog's title. */
		menu: string;
		theme: string;
		/** Accessible name of the header's navigation. */
		nav?: string;
		/** An empty string hides the footer. Copy belongs to the consumer. */
		menuFooter: string;
		/** The skip link's text, supplied by the consumer. */
		skipToContent: string;
	}

	export interface SiteHeaderProps {
		/** The persistent app layout's single navigation lifecycle. */
		navigation: NavigationLifecycle;
		home: string;
		wordmark?: string;
		/** Replaces the default wordmark area. The caller owns its links and motion. */
		brand?: Snippet;
		/** Plays the default wordmark once on mount. Defaults to true. */
		wordmarkAutoPlay?: boolean;
		links: readonly SiteHeaderLink[];
		menuItems?: readonly SiteHeaderMenuItem[];
		/** When supplied, replaces menuItems, including when empty. Groups lay out as organized columns from 768px and as one column below it. */
		menuGroups?: readonly SiteHeaderMenuGroup[];
		/** Raises the header width each link priority needs; omitted, the defaults apply. */
		linkTiers?: SiteHeaderLinkTiers;
		/**
		 * Moves theme and language controls into the menu below a 600px header width.
		 * @deprecated Since v0.44.0. The theme and language toggles stay in the pill at every width
		 * (owner decision of 14 November 2026, DECISIONS.md D19). Omit this prop.
		 */
		compactControls?: boolean;
		labels: SiteHeaderLabels;
		language?: Omit<LanguageToggleProps, 'ref' | 'class'>;
		/** Shown from a 1024px header; folds away with the links while the menu is open. */
		search?: Snippet;
		/** Network control after search on desktop and below the pill at compact widths. */
		network?: Snippet;
		/** Rendered before the theme, language and menu controls. */
		actions?: Snippet;
	}
</script>

<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { magnetic } from '@yesid/motion/actions';
	import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
	import { getLenis } from '@yesid/motion/utils/lenis';
	import { orderLanguages } from '../brand/language-order.js';
	import LanguageToggle from '../brand/LanguageToggle.svelte';
	import ThemeToggle from '../brand/ThemeToggle.svelte';
	import Wordmark from '../brand/Wordmark.svelte';
	import { linksFit } from './links-fit.js';

	let { navigation, home, wordmark, brand, wordmarkAutoPlay = true, links, menuItems = [], menuGroups, linkTiers, compactControls = false, labels, language, search, network, actions }: SiteHeaderProps =
		$props();

	const hasMenu = $derived(menuGroups !== undefined
		? menuGroups.some(group => group.items.length > 0) : menuItems.length > 0);
	const compactMenuControls = $derived(compactControls && hasMenu);
	const contentId = $props.id();
	const linksFrom = $derived(Math.min(...links.map((link) => link.priority ?? 1)));
	// The header width (px at the default font size) from which each priority shows; the CSS tiers
	// below use the same widths in em. Compact mode keeps priority 1 at every width.
	const tierFloors = $derived({
		1: compactMenuControls ? 0 : 375,
		2: linkTiers?.priority2 ?? (compactMenuControls ? 500 : 600),
		3: linkTiers?.priority3 ?? 1024,
	});
	const rowFrom = $derived(links.length ? Math.min(...links.map((link) => tierFloors[link.priority ?? 1])) : 0);
	const menuFooter = $derived(labels.menuFooter);
	const skipToContent = $derived(labels.skipToContent);

	const indexedGroups = $derived.by(() => {
		let offset = 0;
		return menuGroups?.map(group => {
			const indexed = { ...group, offset };
			offset += group.items.length;
			return indexed;
		});
	});
	const menuLanguageLabel = $derived(language
		? `${language.label}: ${orderLanguages(language.locales).map(locale => language.names[locale]).join(' / ')}`
		: '');

	let narrow = $state(false);
	let hydrated = $state(false);
	let fallbackMenu = $state<HTMLDivElement>();
	let fallbackFocusIndex = -1;
	let headerElement: HTMLElement;
	let networkElement = $state<HTMLDivElement>();
	let trailingControls = $state<HTMLDivElement>();

	// CSS owns placement. Move the same node to match keyboard order on mount and resize.
	function orderNetwork() {
		const control = networkElement;
		const trailing = trailingControls;
		const pill = control?.parentElement as (HTMLElement & {
			moveBefore?: (node: Node, before: Node | null) => void;
		}) | null | undefined;
		if (!control || !trailing || !pill) return;

		const below = getComputedStyle(control).position === 'absolute';
		control.toggleAttribute('data-network-below', below);
		const before = below ? null : trailing;
		if (control.nextElementSibling === before) return;
		if (typeof pill.moveBefore === 'function') {
			pill.moveBefore(control, before);
		} else {
			const focused = control.ownerDocument.activeElement;
			pill.insertBefore(control, before);
			if ((focused instanceof HTMLElement || focused instanceof SVGElement) && control.contains(focused)) {
				focused.focus({ preventScroll: true });
			}
		}
	}
	$effect(orderNetwork);

	onMount(() => {
		if (compactMenuControls) {
			// Match the CSS container before relocating the pill controls.
			narrow = headerElement.getBoundingClientRect().width - parseFloat(getComputedStyle(headerElement).paddingInlineEnd) < 600;
		}
		if (typeof fallbackMenu?.hidePopover === 'function' && fallbackMenu.matches(':popover-open')) {
			const focused = fallbackMenu.ownerDocument.activeElement;
			fallbackFocusIndex = Array.from(fallbackMenu.querySelectorAll('nav a')).findIndex((link) => link === focused);
			fallbackMenu.hidePopover();
			dismissVersion = navigation.version;
			menuOpen = active = true;
		}
		hydrated = true;
	});
	const controlsInMenu = $derived(compactMenuControls && narrow);
	let pillLanguageLink = $state<HTMLAnchorElement | null>(null);
	function measureHeader(node: HTMLElement) {
		const observer = new ResizeObserver(([entry]) => {
			narrow = entry.contentRect.width < 600;
			orderNetwork();
		});
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}
	function followPageScroll(node: HTMLElement) {
		if (CSS.supports('(animation-timeline: scroll(root block)) and (animation-range: 0px 100dvh)')) return;
		const view = node.ownerDocument.defaultView!;
		let previous = -1;
		const update = () => {
			const scroll = Math.min(view.innerHeight, Math.max(0, view.scrollY));
			if (scroll === previous) return;
			previous = scroll;
			node.style.setProperty('--site-header-network-scroll', `${scroll}px`);
		};
		view.addEventListener('scroll', update, { passive: true });
		view.addEventListener('resize', update);
		update();
		return { destroy() {
			view.removeEventListener('scroll', update);
			view.removeEventListener('resize', update);
		} };
	}
	let languageLink = $state<HTMLAnchorElement | null>(null);
	let menuToggle = $state<HTMLButtonElement>();
	let overlay: HTMLElement | undefined = $state();

	let menuOpen = $state(false);
	// True while the menu is visible, including its close animation; the pill's compact state follows this.
	let active = $state(false);
	let closing = $state(false);

	let dismissVersion = 0;

	function toggleMenu() {
		if (navigation.pending) return;
		dismissVersion = navigation.version;
		menuOpen = !menuOpen;
		if (menuOpen) {
			active = true;
		}
	}

	// svelte-ignore state_referenced_locally
	onDestroy(navigation.attachMenu({
		get open() { return menuOpen; },
		get active() { return active; },
		close: () => { menuOpen = false; },
		languageLink: () => controlsInMenu ? languageLink : pillLanguageLink,
	}));

	$effect(() => {
		if (active) return;
		navigation.menuClosed();
	});

	$effect(() => {
		if (menuOpen) {
			active = true;
			closing = false;
		} else if (active && !closing) {
			closing = true;
			if (isPrefersReducedMotion()) finishClose();
		}
	});

	// Close anyway if transitionend never fires.
	$effect(() => {
		if (!closing) return;
		const timer = setTimeout(finishClose, 500);
		return () => clearTimeout(timer);
	});

	function finishClose() {
		if (!active || menuOpen || !closing) return;
		active = false;
		closing = false;
	}

	function close() {
		if (menuOpen) dismissVersion = navigation.version;
		menuOpen = false;
	}

	async function restoreTrigger(event: Event) {
		event.preventDefault();
		const version = dismissVersion;
		await tick();
		if (!active && !menuOpen && version === navigation.version) menuToggle?.focus({ preventScroll: true });
	}

	async function focusMenu(event: Event) {
		// Cancel in-flight page momentum; bits-ui owns the scroll lock.
		const lenis = getLenis();
		lenis?.scrollTo(lenis.scroll, { immediate: true });
		event.preventDefault();
		const index = fallbackFocusIndex;
		fallbackFocusIndex = -1;
		if (index >= 0) {
			await tick();
			if (!menuOpen) return;
			const link = overlay?.querySelectorAll<HTMLAnchorElement>('a.menu-item')[index];
			if (link) {
				link.focus();
				return;
			}
		}
		menuToggle?.focus({ preventScroll: true });
	}
</script>

{#snippet fallbackItems(items: readonly SiteHeaderMenuItem[], heading?: string)}
	<ul aria-labelledby={heading}>
		{#each items as item (item.href)}
			<li>
				<a
					href={item.href}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener noreferrer' : undefined}
					aria-label={item.ariaLabel}
					aria-current={item.current ? 'page' : undefined}
				>{item.label}</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet menuItem(item: SiteHeaderMenuItem, i: number, items: readonly SiteHeaderMenuItem[], offset = 0)}
	<a
		href={item.href}
		target={item.external ? '_blank' : undefined}
		rel={item.external ? 'noopener noreferrer' : undefined}
		aria-label={item.ariaLabel}
		class="menu-item"
		class:menu-item-active={item.current}
		aria-current={item.current ? 'page' : undefined}
		onclick={close}
		style="--item-index: {offset + i}"
	>
		{#if item.icon}
			<item.icon class="menu-icon" />
		{:else}
			<span class="menu-stop" class:menu-stop-active={item.current}>
				{#if item.current}<span class="menu-stop-fill"></span>{/if}
			</span>
		{/if}
		{#if i < items.length - 1}
			<span class="menu-line" class:menu-line-active={item.current}></span>
		{/if}
		<span class="menu-text">
			<span class="menu-label">{item.label}</span>
			<span class="menu-subtitle">{item.subtitle ?? ''}</span>
		</span>
	</a>
{/snippet}

<a class="skip-link" href="#main">{skipToContent}</a>

<!-- Bound to `active` so the focus trap and scroll lock last through the close animation. -->
<Dialog.Root open={active} onOpenChange={(open) => !open && close()}>
	<Dialog.Content
		forceMount
		id={contentId}
		onCloseAutoFocus={restoreTrigger}
		onEscapeKeydown={(event) => {
			event.preventDefault();
			close();
		}}
		onInteractOutside={(event) => {
			event.preventDefault();
			close();
		}}
		onOpenAutoFocus={focusMenu}
	>
		{#snippet child({ props })}
			<div
				{...props}
				class="menu-dialog"
				class:menu-dialog-active={active}
				role={active ? 'dialog' : undefined}
				aria-modal={active ? 'true' : undefined}
				{...(active ? {} : { 'aria-labelledby': undefined, 'aria-describedby': undefined, tabindex: undefined })}
				style:pointer-events={active ? 'auto' : 'none'}
				style:contain="none"
				data-lenis-prevent={active ? true : undefined}
			>
				<header
					data-testid="nav"
					data-slot="site-header"
					bind:this={headerElement}
					use:measureHeader
					class="nav-root pointer-events-none fixed left-0 right-0 flex flex-col items-center"
					style:z-index={active ? 'var(--z-nav)' : 'var(--z-sheet)'}
				>
					<nav
						data-testid="nav-pill"
						data-links-from={linksFrom}
						data-priority2-from={linkTiers?.priority2}
						data-priority3-from={linkTiers?.priority3}
						data-row-from={rowFrom || undefined}
						aria-label={labels.nav}
						class="nav-pill pointer-events-auto flex items-center"
						class:nav-pill-compact={active}
						class:nav-pill-compact-controls={compactMenuControls}
						class:nav-pill-network={!!network}
						class:nav-hydrated={hydrated}
						use:linksFit={{ paused: active, links }}
					>
						{#if brand}{@render brand()}{:else}
							<Wordmark href={home} text={wordmark} autoPlay={wordmarkAutoPlay} class="nav-wordmark" />
						{/if}

						{#if links.length}
							<span class="nav-divider nav-collapsible nav-links-part" class:nav-collapsed={active} aria-hidden="true"
							></span>
							<div inert={active} class="nav-links nav-collapsible nav-links-part" class:nav-collapsed={active}>
								{#each links as link (link.href)}
									<span data-priority={link.priority ?? 1} use:magnetic={{ strength: 6, radius: 50 }}>
										<a
											href={link.href}
											class="nav-pill-link inline-flex min-h-11 min-w-11 items-center justify-center px-1 transition-[color,text-shadow] {link.current
												? 'nav-link-active text-primary'
												: 'text-secondary-foreground hover:text-primary active:text-primary'}"
											aria-current={link.current ? 'page' : undefined}>{link.label}</a
										>
									</span>
								{/each}
							</div>
						{/if}

						{#if search}
							<div inert={active} class="nav-search nav-collapsible" class:nav-collapsed={active}>
								<span class="nav-divider" aria-hidden="true"></span>
								{@render search()}
							</div>
						{/if}
						<div class="nav-trailing" bind:this={trailingControls}>
							<span class="nav-divider" aria-hidden="true"></span>
							{@render actions?.()}
							{#if !controlsInMenu}
								<span class="pill-controls" class:compact-controls={compactMenuControls}>
									<ThemeToggle label={labels.theme} />
									{#if language}<LanguageToggle {...language} bind:ref={pillLanguageLink} />{/if}
								</span>
							{/if}
							{#if hasMenu}
								<button
									bind:this={menuToggle}
									type="button"
									data-testid="nav-menu-toggle"
									class="menu-toggle"
									class:menu-toggle-open={active}
									aria-label={active ? labels.closeMenu : labels.openMenu}
									aria-expanded={hydrated ? menuOpen : undefined}
									popovertarget={hydrated ? undefined : `${contentId}-fallback`}
									aria-controls={hydrated ? contentId : `${contentId}-fallback`}
									onclick={hydrated ? toggleMenu : undefined}
								>
									<span class="menu-toggle-line menu-toggle-top"></span>
									<span class="menu-toggle-line menu-toggle-bottom"></span>
								</button>
							{/if}
						</div>
						{#if network}
							<div bind:this={networkElement} use:followPageScroll inert={active} class="nav-network nav-collapsible" class:nav-collapsed={active} data-slot="site-header-network">
								{@render network()}
							</div>
						{/if}
						<span class="nav-pill-end" hidden></span>
					</nav>
					{#if !hydrated && hasMenu}
						<div bind:this={fallbackMenu} id="{contentId}-fallback" popover="auto" class="fallback-menu">
							<nav aria-label={labels.menu}>
								{#if menuGroups !== undefined}
									{#each menuGroups as group, index}
										<h2 id="{contentId}-fallback-group-{index}">{group.label}</h2>
										{@render fallbackItems(group.items, `${contentId}-fallback-group-${index}`)}
									{/each}
								{:else}
									{@render fallbackItems(menuItems)}
								{/if}
							</nav>
							{#if compactMenuControls}
								<div class="fallback-menu-controls">
									<div><span aria-hidden="true">{labels.theme}</span><ThemeToggle label={labels.theme} /></div>
									{#if language && language.locales.length >= 2}
										<div>
											<span aria-hidden="true">{menuLanguageLabel}</span>
											<LanguageToggle {...language} label={menuLanguageLabel} />
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</header>

				{#if active}
					<div
						bind:this={overlay}
						class="menu-overlay"
						class:closing
						ontransitionend={(event) => {
							if (closing && event.target === overlay && event.propertyName === 'transform') finishClose();
						}}
					>
						<Dialog.Title class="sr-only">{labels.menu}</Dialog.Title>
						<nav
							class="menu-content"
							class:menu-content-grouped={indexedGroups !== undefined}
							aria-label={labels.menu}
						>
							{#if indexedGroups !== undefined}
								{#each indexedGroups as group, groupIndex}
									<div class="menu-group" data-slot="menu-group">
										<h3 class="menu-group-heading" id="{contentId}-group-{groupIndex}">{group.label}</h3>
										<ul aria-labelledby="{contentId}-group-{groupIndex}">
											{#each group.items as item, i (item.href)}
												<li>{@render menuItem(item, i, group.items, group.offset)}</li>
											{/each}
										</ul>
									</div>
								{/each}
							{:else}
								{#each menuItems as item, i (item.href)}{@render menuItem(item, i, menuItems)}{/each}
							{/if}
						</nav>
						{#if controlsInMenu}
							<div class="menu-controls">
								<div><span aria-hidden="true">{labels.theme}</span><ThemeToggle label={labels.theme} /></div>
								{#if language && language.locales.length >= 2}
									<div>
										<span aria-hidden="true">{menuLanguageLabel}</span>
										<LanguageToggle {...language} label={menuLanguageLabel} bind:ref={languageLink} />
									</div>
								{/if}
							</div>
						{/if}
						{#if menuFooter}
							<div class="menu-footer">
								<span class="menu-footer-line"></span>
								<span class="menu-footer-label">{menuFooter}</span>
								<span class="menu-footer-line"></span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/snippet}
	</Dialog.Content>
</Dialog.Root>

<style>
	.pill-controls { display: contents; }
	.fallback-menu, .fallback-menu-controls { display: none; }
	.fallback-menu:popover-open {
		--fallback-menu-top: calc(var(--app-frame-header-height, var(--nav-clearance)) + 0.5rem);
		display: block;
		position: fixed;
		inset: var(--fallback-menu-top) 0 auto;
		margin: 0 auto;
		inline-size: min(var(--measure-lede), calc(100% - 2rem));
		max-block-size: calc(100dvh - var(--fallback-menu-top) - 1rem);
		padding: 1rem;
		border: 1px solid var(--border-brand);
		border-radius: var(--radius-lg);
		background: var(--background);
		color: var(--foreground);
		box-shadow: var(--shadow-nav);
		font-family: var(--font-body);
		overflow: auto;
		overscroll-behavior: contain;
		pointer-events: auto;
	}
	.fallback-menu h2 {
		margin-block: 0.75rem 0.25rem;
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}
	.fallback-menu h2:first-child { margin-block-start: 0; }
	.fallback-menu ul { list-style: none; padding: 0; margin: 0; }
	.fallback-menu li a {
		display: flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		padding-inline: 0.5rem;
		overflow-wrap: anywhere;
	}
	.fallback-menu li a:is(:hover, [aria-current='page']) { color: var(--primary); }
	@container site-header (width < 600px) {
		.pill-controls.compact-controls { display: none; }
		.fallback-menu-controls {
			display: grid;
			gap: 0.25rem;
			margin-block-start: 0.75rem;
			padding-block-start: 0.75rem;
			border-block-start: 1px solid var(--border);
		}
		.fallback-menu-controls > div { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	}
	.menu-group-heading {
		margin-top: 24px;
		font-family: var(--font-body);
		font-size: var(--text-small);
		color: var(--muted-foreground);
	}
	.menu-content ul { list-style: none; padding: 0; margin: 0; }
	.menu-controls { padding-top: 24px; font-family: var(--font-body); }
	.menu-controls > div { display: flex; align-items: center; gap: 16px; }
	/* Off screen until focused, then above the header. */
	.skip-link {
		position: fixed;
		top: var(--nav-top);
		left: -9999px;
		z-index: var(--z-overlay);
		display: inline-flex;
		align-items: center;
		min-block-size: var(--size-tap-min);
		padding-inline: 1rem;
		border-radius: var(--radius-pill);
		background: var(--primary);
		color: var(--background);
		font-family: var(--font-body);
		font-weight: 600;
	}
	.skip-link:focus {
		left: 1rem;
	}

	/* ── Pill ── */
	.nav-root {
		top: var(--nav-top);
		padding-inline-end: var(--site-header-inset-end, 0px);
		container: site-header / inline-size;
		transition: padding-inline-end var(--site-header-inset-duration, var(--duration-normal)) var(--ease-default);
	}
	.nav-pill {
		/* The one inline space every vertical divider in the navbar uses, on both sides: the kit's
		   own dividers and ProductBrand's inside the pill (owner live QA, 16 November 2026). The
		   compaction tiers below only change this value, never the 44px targets. */
		--nav-split-space: 20px;
		--nav-surface: color-mix(in srgb, var(--background) 92%, transparent);
		background: var(--nav-surface);
		-webkit-backdrop-filter: blur(var(--glass-blur));
		backdrop-filter: blur(var(--glass-blur));
		border: var(--nav-border) solid var(--border-brand);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-nav);
		padding: var(--nav-padding-y) 28px;
	}
	/* The parser can stop inside the pill while the HTML streams. The pill is centred, so each
	   control that arrives later would widen it from both sides. Keep it invisible until its last
	   element is parsed. */
	.nav-pill:not(:has(> .nav-pill-end)) { visibility: hidden; }
	/* Layout transitions serve the menu's fold, which needs the app script. Before hydration they
	   would animate the pill whenever its styles apply late, moving the toggles. */
	.nav-pill.nav-hydrated {
		transition:
			padding var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default);
	}
	.nav-pill-compact {
		padding: var(--nav-padding-y) 20px;
		box-shadow: none;
		border-color: var(--border-brand-active);
	}

	/* Sized here so the compaction tiers can shrink it; the wordmark never wraps. */
	.nav-pill :global(.nav-wordmark) {
		font-size: var(--text-nav-brand-desktop);
	}
	.nav-pill-link {
		position: relative;
		font-size: var(--text-nav-link-desktop);
		font-weight: 500;
		white-space: nowrap;
	}
	.nav-link-active {
		text-shadow:
			0 0 8px color-mix(in srgb, var(--glow) 50%, transparent),
			0 0 16px color-mix(in srgb, var(--glow) 20%, transparent);
	}
	/* "You are here" lamp: an amber dot, absolutely placed so it never shifts layout. */
	.nav-pill-link[aria-current='page']::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: 4px;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		transform: translateX(-50%);
		background: var(--accent);
	}

	.nav-divider {
		display: inline-block;
		width: 2px;
		height: 18px;
		background: var(--border-brand);
		margin-inline: var(--nav-split-space);
		flex-shrink: 0;
	}
	.nav-links {
		display: flex;
		align-items: center;
		gap: 28px;
	}
	.nav-search {
		display: flex;
		align-items: center;
		min-width: 0;
	}
	/* A product can supply its compact search control in the actions snippet. */
	:global([data-slot='app-frame'][data-rail-layout='compact'])
		.nav-pill:has(:global([data-slot='nav-compact-search'])) .nav-search {
		display: none;
	}
	:global([data-slot='app-frame'][data-rail-layout='compact'])
		.nav-trailing :global([data-slot='nav-compact-search']:not([role='dialog'][aria-modal='true'] *)) {
		display: inline-flex;
	}
	.nav-network {
		--network-picker-background: transparent;
		--network-picker-border-width: 0px;
		--network-picker-name-display: none;
		--network-picker-code-display: inline;
		display: flex;
		align-items: center;
		min-inline-size: 0;
	}
	.nav-network:has(> :global(*))::before {
		content: '';
		inline-size: 2px;
		block-size: 18px;
		background: var(--border-brand);
		margin-inline: var(--nav-split-space);
		flex-shrink: 0;
	}
	.nav-network :global([data-slot='network-picker']) {
		font-weight: 500;
		line-height: 1.2;
		white-space: nowrap;
	}
	.nav-trailing { display: contents; }
	/* Allow extra room for enlarged text at the desktop step. */
	@container site-header (width >= max(1024px, calc(824px + 12.5em))) {
		.nav-pill-network {
			/* Leave room for wider fallback text when the desktop links first appear. */
			--nav-split-space: clamp(12px, calc(5cqi - 50px), 20px);
		}
		.nav-pill-network > .nav-network { order: 1; }
		.nav-pill-network > .nav-trailing {
			display: flex;
			flex: none;
			align-items: center;
			order: 2;
		}
	}
	@container site-header (width >= max(1120px, calc(800px + 20em))) {
		.nav-network {
			--network-picker-name-display: inline;
			--network-picker-code-display: none;
		}
	}

	/* Link tiers. Widths are in em, so they follow the reader's font size: 64em is 1024px at the
	   default 16px and 1280px at 20px. They are static rules, so they decide the same before
	   hydration, after it and without JavaScript; links that do not fit then leave (links-fit). */
	@container site-header (width < 23.4375em) {
		.nav-links [data-priority='2'],
		.nav-links [data-priority='3'] {
			display: none;
		}
	}
	@container site-header (width < 31.25em) {
		.nav-links [data-priority='2'] {
			display: none;
		}
	}
	/* The theme and language controls sit in the pill, so priority 2 waits for room beside them. */
	@container site-header (width < 37.5em) {
		.nav-pill:not(.nav-pill-compact-controls) .nav-links [data-priority='2'] {
			display: none;
		}
	}
	@container site-header (width < 64em) {
		.nav-links [data-priority='3'] {
			display: none;
		}
	}
	/* Search stays in px: products pair their own compact search with this 1024px step. */
	@container site-header (width < 1024px) {
		.nav-search {
			display: none;
		}
	}
	@container site-header (width < max(1024px, calc(824px + 12.5em))) {
		.nav-pill:has(.nav-network > :global(*)) {
			position: relative;
			margin-block-end: var(--nav-network-clearance);
		}
		.nav-network {
			--network-picker-background: var(--nav-surface);
			--network-picker-border-width: var(--nav-border);
			--network-picker-border-color: var(--border-brand);
			--network-picker-shadow: var(--shadow-nav);
			position: absolute;
			inset-block-start: calc(100% + 0.5rem);
			inset-inline-start: 50%;
			translate: -50% 0;
			margin-inline: 0;
			inline-size: max-content;
			max-inline-size: calc(100vw - 1rem);
		}
		.nav-network:has(> :global(*))::before { display: none; }
		.nav-network :global([data-slot='network-picker']) {
			-webkit-backdrop-filter: blur(var(--glass-blur));
			backdrop-filter: blur(var(--glass-blur));
		}
		/* Clip the departing row at the pill edge. Keyboard focus brings the same control back. */
		.nav-network:not(.nav-collapsed, :global(.app-frame-chrome.tall-chrome *)):not(:has(:focus-visible)) {
			--network-scroll: var(--site-header-network-scroll, 0px);
			translate: -50% calc(-1 * var(--network-scroll));
			clip-path: inset(calc(var(--network-scroll) - 0.5rem + var(--nav-border)) -32px -32px);
			@supports (animation-timeline: scroll(root block)) and (animation-range: 0px 100dvh) {
				animation: scroll-compact-network auto linear both;
				animation-timeline: scroll(root block);
				animation-range: 0px 100dvh;
			}
		}
	}
	@property --site-header-network-scroll {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}
	@keyframes scroll-compact-network {
		to { --site-header-network-scroll: 100dvh; }
	}
	/* linkTiers: caller widths for a wider brand, named in px at the default 16px font size. */
	@container site-header (width < 48em) {
		.nav-pill[data-priority2-from='768'] .nav-links [data-priority='2'] {
			display: none;
		}
	}
	@container site-header (width < 64em) {
		.nav-pill[data-priority2-from='1024'] .nav-links [data-priority='2'] {
			display: none;
		}
	}
	@container site-header (width < 80em) {
		.nav-pill[data-priority2-from='1280'] .nav-links [data-priority='2'],
		.nav-pill[data-priority3-from='1280'] .nav-links [data-priority='3'] {
			display: none;
		}
	}
	@container site-header (width < 90em) {
		.nav-pill[data-priority3-from='1440'] .nav-links [data-priority='3'] {
			display: none;
		}
	}
	@container site-header (width < 100em) {
		.nav-pill[data-priority3-from='1600'] .nav-links [data-priority='3'] {
			display: none;
		}
	}
	/* The links row and its divider leave only below the smallest width at which any of the
	   supplied links shows (data-row-from), so a raised tier never hides a lower one. */
	@container site-header (width < 23.4375em) {
		.nav-pill[data-row-from='375'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 31.25em) {
		.nav-pill[data-row-from='500'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 37.5em) {
		.nav-pill[data-row-from='600'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 48em) {
		.nav-pill[data-row-from='768'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 64em) {
		.nav-pill[data-row-from='1024'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 80em) {
		.nav-pill[data-row-from='1280'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 90em) {
		.nav-pill[data-row-from='1440'] .nav-links-part {
			display: none;
		}
	}
	@container site-header (width < 100em) {
		.nav-pill[data-row-from='1600'] .nav-links-part {
			display: none;
		}
	}

	/* Compaction tiers squeeze decorative spacing, never the 44px hit areas. */
	@media (max-width: 767px) {
		.nav-pill {
			--nav-split-space: 10px;
			padding: var(--nav-padding-y) 16px;
		}
		.nav-pill-compact {
			padding: var(--nav-padding-y) 14px;
		}
		.nav-pill :global(.nav-wordmark) {
			font-size: var(--text-nav-brand-mobile);
		}
		.nav-links {
			gap: 18px;
		}
		.nav-pill-link {
			font-size: var(--text-nav-link-mobile);
		}
	}
	@media (max-width: 479px) {
		.nav-pill,
		.nav-pill-compact {
			padding: var(--nav-padding-y) 8px;
		}
		.nav-pill {
			--nav-split-space: 4px;
		}
		.nav-pill :global(.nav-wordmark) {
			font-size: var(--text-nav-brand-compact);
		}
		.nav-links {
			gap: 7px;
		}
		.nav-pill-link {
			font-size: var(--text-nav-link-compact);
		}
	}
	@media (max-width: 359px) {
		.nav-pill,
		.nav-pill-compact {
			padding: var(--nav-padding-y) 4px;
		}
		.nav-pill {
			--nav-split-space: 2px;
		}
		/* At the 320px floor the wordmark-to-links divider stays and the controls' divider leaves while
		   links show. Without a links row, the controls' divider keeps the brand off the first control. */
		.nav-search > .nav-divider,
		.nav-pill:has(.nav-links-part):not([data-row-from], [data-links-overflow]) .nav-trailing > .nav-divider {
			display: none;
		}
		.nav-links {
			gap: 2px;
		}
		.nav-pill-link {
			padding-inline: 2px;
		}
	}

	/* At enlarged text sizes the brand gets a full first row before its words have to break. */
	@container site-header (width < 16em) {
		.nav-pill:has(:global([data-slot='product-brand'])) {
			flex-wrap: wrap;
			justify-content: center;
			max-inline-size: calc(100% - 0.5rem);
			border-radius: var(--radius-xl);
		}
		.nav-pill :global([data-slot='product-brand']) {
			flex: 0 1 100%;
			justify-content: center;
		}
		.nav-pill:has(:global([data-slot='product-brand'])) > .nav-divider,
		.nav-pill:has(:global([data-slot='product-brand'])) > .nav-trailing > .nav-divider {
			display: none;
		}
	}

	/* The links (and search) fold away while the menu is open. */
	.nav-collapsible {
		overflow: visible;
		max-width: 300px;
		opacity: 1;
	}
	.nav-hydrated .nav-collapsible {
		transition:
			max-width var(--duration-slow) var(--ease-default),
			opacity var(--duration-normal) var(--ease-default),
			margin var(--duration-slow) var(--ease-default);
	}
	/* Network placement changes in one layout pass. The menu still fades its picker. */
	.nav-hydrated .nav-network { transition-property: opacity; }
	.nav-search.nav-collapsible {
		max-width: 40rem;
	}
	.nav-collapsible.nav-collapsed {
		overflow: hidden;
		max-width: 0;
		/* Folded labels can wrap as their width shrinks. Keep them within the control row. */
		max-block-size: var(--nav-control);
		opacity: 0;
		margin-inline: 0;
	}

	/* Hamburger morphing to ✕. */
	.menu-toggle {
		border-radius: var(--radius-pill);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 4px;
		min-height: 44px;
		min-width: 44px;
		cursor: pointer;
		background: none;
		border: none;
	}
	.menu-toggle-line {
		display: block;
		height: 1.5px;
		border-radius: var(--radius-pill);
		background: var(--secondary-foreground);
		transform-origin: center;
		transition:
			transform var(--duration-normal) var(--ease-default),
			width var(--duration-normal) var(--ease-default),
			background var(--duration-fast);
	}
	.menu-toggle-top {
		width: 16px;
	}
	.menu-toggle-bottom {
		width: 11px;
	}
	.menu-toggle:hover .menu-toggle-line {
		background: var(--foreground);
	}
	.menu-toggle-open {
		position: relative;
		z-index: var(--z-nav);
	}
	.menu-toggle-open .menu-toggle-top {
		width: 16px;
		transform: translateY(3.25px) rotate(45deg);
	}
	.menu-toggle-open .menu-toggle-bottom {
		width: 16px;
		transform: translateY(-3.25px) rotate(-45deg);
	}

	/* ── Menu ── */
	.menu-dialog {
		position: fixed;
		inset: 0;
		z-index: var(--z-sheet);
	}
	/* A preceding announcement supplies the initial in-flow offset, including before hydration. */
	:global([data-slot='announcement-banner']) ~ .menu-dialog:not(.menu-dialog-active, :global([data-slot='app-frame-header'] *)) {
		position: sticky;
		inset: 0 auto auto;
	}
	:global([data-slot='announcement-banner']) ~ .menu-dialog:not(.menu-dialog-active, :global([data-slot='app-frame-header'] *)) .nav-root {
		position: absolute;
	}
	.menu-dialog-active {
		z-index: var(--z-menu);
		background: var(--background);
		background-image: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--glow) 4%, transparent) 0%, transparent 60%);
	}
	/* Light primary is muted, so the cast-from-above glow needs a stronger mix to read the same. */
	:global([data-theme='light']) .menu-dialog-active {
		background-image: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--glow) 16%, transparent) 0%, transparent 58%);
	}

	/* AppFrame reserves the in-flow pill and controls together, even before hydration. */
	:global([data-slot='app-frame-header']) .menu-dialog {
		position: relative;
		inset: auto;
	}
	:global([data-slot='app-frame-header']) .menu-dialog .nav-root {
		position: relative;
		inset: auto;
		padding-block-start: var(--nav-top);
	}
	:global([data-slot='app-frame-header']) .menu-dialog-active::before {
		content: '';
		position: fixed;
		inset: 0;
		background: inherit;
	}

	/* Starts below the pill. Auto margins on the list and footer centre them as a group but collapse to
	   zero when the group is taller than the overlay, so the first item never rides under the pill. */
	.menu-overlay {
		position: fixed;
		inset: 0;
		top: calc(var(--app-frame-header-height, var(--chrome-offset, var(--nav-clearance))) + 1rem);
		z-index: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		padding: 0 24px calc(24px + env(safe-area-inset-bottom, 0px));
		overflow-y: auto;
		overscroll-behavior: contain;
		touch-action: pan-y;
		opacity: 1;
		transform: scaleY(1);
		transform-origin: top center;
		transition:
			opacity var(--duration-fast) var(--ease-default),
			transform var(--duration-fast) cubic-bezier(0.33, 1, 0.68, 1);
	}
	/* The reveal starts from these as soon as the menu is inserted, with no timer in between, so the
	   whole menu lands within 200ms of the tap. Without support the menu simply appears. */
	@starting-style {
		.menu-overlay {
			opacity: 0;
			transform: scaleY(0);
		}
	}
	.menu-overlay.closing {
		opacity: 0;
		transform: scaleY(0);
		transition:
			opacity var(--duration-normal) ease-in,
			transform var(--duration-normal) cubic-bezier(0.32, 0, 0.67, 0);
	}

	.menu-content {
		position: relative;
		display: flex;
		flex-direction: column;
		width: fit-content;
		max-width: 100%;
		margin-top: auto;
	}
	/* Without a footer the list balances its own top margin. */
	.menu-content:last-child {
		margin-bottom: auto;
	}

	/* Each group keeps its heading and list together in reading and tab order. */
	.menu-content-grouped {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		row-gap: 1.5rem;
		width: 100%;
		max-width: 40rem;
	}
	.menu-content-grouped .menu-group {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.menu-content-grouped .menu-group-heading {
		margin-top: 0;
	}
	@media (min-width: 768px) {
		.menu-content-grouped {
			--menu-column-gap: 1.5rem;
			display: flex;
			flex-flow: row wrap;
			justify-content: center;
			gap: 2rem var(--menu-column-gap);
			inline-size: fit-content;
			/* Allow space for the three gaps in a four-column menu. */
			max-inline-size: min(100%, calc(var(--container-wide) + 3 * var(--menu-column-gap)));
		}
		.menu-content-grouped .menu-group {
			max-inline-size: 100%;
			overflow-wrap: anywhere;
		}
		.menu-content-grouped:has(> .menu-group:nth-child(4)) {
			--menu-grouped-label-size: var(--text-menu-label-mobile);
		}
	}
	.menu-item {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: 20px;
		--menu-pad: 14px;
		padding-block: var(--menu-pad);
		font-size: var(--text-menu-label-mobile);
		text-decoration: none;
		opacity: 1;
		transform: translateY(0);
		/* No per-item entrance: the panel's 150ms reveal shows the items with it. */
		transition: color var(--duration-fast);
	}
	.menu-overlay.closing .menu-item {
		opacity: 0;
		transform: translateY(-8px);
		transition:
			opacity 0.12s ease-in min(calc(var(--item-index) * 10ms), 50ms),
			transform 0.12s ease-in min(calc(var(--item-index) * 10ms), 50ms);
	}

	.menu-stop {
		position: relative;
		flex-shrink: 0;
		width: 14px;
		height: 14px;
		margin-top: 5px;
		border: 2px solid var(--border-subtle);
		border-radius: 50%;
		transition: border-color var(--duration-fast);
	}
	.menu-stop-active,
	.menu-item:hover .menu-stop {
		border-color: var(--primary);
	}
	.menu-stop-active {
		box-shadow: 0 0 12px color-mix(in srgb, var(--glow) 40%, transparent);
	}
	.menu-stop-fill {
		position: absolute;
		inset: 2px;
		border-radius: 50%;
		background: var(--primary);
	}
	/* Centred on the label's first line (line-height 1.5). */
	.menu-item :global(.menu-icon) {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		margin-top: calc(0.75em - 12px);
		color: var(--muted-foreground);
		stroke-width: 1.75;
		transition:
			color var(--duration-fast),
			fill var(--duration-fast);
	}
	.menu-item:hover :global(.menu-icon) {
		color: var(--primary);
	}
	.menu-item-active :global(.menu-icon) {
		color: var(--primary);
		fill: color-mix(in srgb, var(--primary) 25%, transparent);
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--glow) 50%, transparent));
	}
	.menu-line {
		position: absolute;
		left: 6px;
		top: calc(var(--menu-pad) + 19px);
		bottom: calc(-1 * var(--menu-pad));
		width: 2px;
		background: color-mix(in srgb, var(--foreground) 6%, transparent);
	}
	.menu-item:has(> :global(.menu-icon)) .menu-line {
		left: 11px;
		top: calc(var(--menu-pad) + 0.75em + 12px);
		bottom: calc(12px - 0.75em - var(--menu-pad));
	}
	.menu-line-active {
		background: linear-gradient(
			to bottom,
			color-mix(in srgb, var(--primary) 40%, transparent),
			color-mix(in srgb, var(--foreground) 6%, transparent)
		);
	}

	.menu-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.menu-label {
		font-family: var(--font-heading);
		font-weight: 600;
		line-height: 1.5;
		color: var(--secondary-foreground);
		transition:
			color var(--duration-fast),
			text-shadow var(--duration-fast);
	}
	@media (min-width: 768px) {
		.menu-item {
			font-size: var(--menu-grouped-label-size, var(--text-menu-label-desktop));
		}
	}
	.menu-item-active .menu-label {
		color: var(--primary);
		text-shadow: 0 0 8px color-mix(in srgb, var(--glow) 50%, transparent);
	}
	/* Hover recolours the label; it never adds a halo (owner ruling, 15 November 2026). */
	.menu-item:hover .menu-label {
		color: var(--primary);
	}
	.menu-subtitle {
		font-family: var(--font-mono);
		font-size: var(--text-menu-subtitle);
		color: var(--muted-foreground);
		letter-spacing: 0;
	}

	/* In flow, so it never overlaps the last item. */
	.menu-footer {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 16px;
		margin-bottom: auto;
		padding-top: 24px;
	}
	.menu-footer-line {
		width: 40px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.menu-footer-label {
		font-family: var(--font-mono);
		font-size: var(--text-menu-subtitle);
		letter-spacing: 0;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--primary) 85%, transparent);
		white-space: nowrap;
	}

	@media (max-height: 720px) {
		.menu-item {
			min-height: 44px;
			--menu-pad: 10px;
			font-size: clamp(1.5rem, 2vw, 1.75rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-root,
		.nav-pill.nav-hydrated,
		.nav-hydrated .nav-collapsible,
		.menu-toggle-line,
		.menu-overlay,
		.menu-item,
		.menu-item :global(.menu-icon) {
			transition: none;
		}
	}
</style>
