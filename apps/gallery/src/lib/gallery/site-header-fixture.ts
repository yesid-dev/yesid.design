import type { SiteHeaderLabels, SiteHeaderLink, SiteHeaderMenuGroup, SiteHeaderMenuItem } from '@yesid/ui/layout';

/** The Gallery header's data, shared by its route and its browser spec. */
export const HOME = '/site-header';
export const LOCALES = ['en', 'fr'] as const;
export const LANGUAGE_NAMES = { en: 'English', fr: 'Français', es: 'Español' };
export const LANGUAGE_LABEL = 'Language';
export const SEARCH_LABEL = 'Search';
export const LINKS: readonly SiteHeaderLink[] = [
	{ href: HOME, label: 'Header', current: true },
	{ href: '/listing-frame', label: 'List', priority: 2 },
	{ href: '/detail-frame', label: 'Detail', priority: 3 },
];
/** Long labels keep every priority tier: one long priority-1 label shows on phones too. */
export const LONG_LINKS: readonly SiteHeaderLink[] = [
	{ href: HOME, label: 'Accueil et tableau de bord', current: true },
	{ href: '/listing-frame', label: 'Toutes les réalisations', priority: 2 },
	{ href: '/detail-frame', label: 'Études de cas et détails', priority: 3 },
];
export const MENU_ITEMS: readonly SiteHeaderMenuItem[] = [
	{ href: HOME, label: 'Header', subtitle: 'This page', current: true },
	{ href: '/listing-frame', label: 'Listing', subtitle: 'Listing frame' },
	{ href: '/detail-frame', label: 'Detail', subtitle: 'Detail frame' },
	{ href: 'https://example.com', label: 'Elsewhere', external: true, ariaLabel: 'Elsewhere (opens in a new tab)' },
];
export const LONG_MENU_LABELS = {
	en: ['Network', 'Worst trips and vehicles', 'Methods', 'Open data'],
	fr: ['Réseau', 'Trajets les moins fiables', 'Méthode', 'Données brutes'],
} as const;

/**
 * Group headings for the grouped menu fixtures: two groups (the compact shell) and four groups (the
 * organized-column layout), in English and in longer French copy. Items are dealt from MENU_ITEMS in
 * order, so every destination appears once and group order is the reading order.
 */
export const MENU_GROUP_LABELS = {
	en: {
		2: ['Explore routes', 'More destinations'],
		4: ['Explore every route', 'Read the listing', 'Inspect a detail', 'Follow the work elsewhere'],
	},
	fr: {
		2: ['Parcourir les routes', 'Autres destinations'],
		4: [
			'Parcourir chaque route et destination',
			'Lire la liste et ses filtres',
			'Examiner une fiche ou une étude de cas',
			'Suivre le travail ailleurs',
		],
	},
} as const;

export function menuGroupsFor(count: 2 | 4, locale: string): SiteHeaderMenuGroup[] {
	const labels = MENU_GROUP_LABELS[locale === 'fr' ? 'fr' : 'en'][count];
	const size = Math.ceil(MENU_ITEMS.length / count);
	return labels.map((label, index) => ({
		label,
		items: MENU_ITEMS.slice(index * size, (index + 1) * size),
	}));
}
export const LABELS = {
	skipToContent: 'Skip to content',
	openMenu: 'Open menu',
	closeMenu: 'Close menu',
	menu: 'Site menu',
	menuFooter: 'Navigation · All routes',
	theme: 'Dark theme',
	nav: 'Primary',
} satisfies SiteHeaderLabels;
export const languageHref = (locale: string) => `${HOME}?lang=${locale}`;
