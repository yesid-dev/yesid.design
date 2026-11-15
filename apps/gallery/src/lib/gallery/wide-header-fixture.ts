import type { SiteHeaderLink } from '@yesid/ui/layout';

/**
 * A Transit-shaped header for /site-header-wide: a "yesid. | Transit" brand, priority 3 links, a
 * search field, a refresh button and a provider choice. Its full pill fits from about 1230px (EN) or 1250px (FR), so
 * it raises priority 3 to 1280px with `linkTiers`.
 */
export const WIDE_LANGS = ['en', 'fr'] as const;
export type WideLang = (typeof WIDE_LANGS)[number];
export const isWideLang = (value: string): value is WideLang => (WIDE_LANGS as readonly string[]).includes(value);

const LINKS: Record<WideLang, readonly [string, string][]> = {
	en: [['map', 'Map'], ['lines', 'Lines'], ['stops', 'Stops']],
	fr: [['map', 'Carte'], ['lines', 'Lignes'], ['stops', 'Arrêts']],
};

export const WIDE_COPY = {
	en: { search: 'Search stops and lines', refresh: 'Refresh data', provider: 'Transit agency', title: 'Wide product header' },
	fr: { search: 'Rechercher des arrêts et des lignes', refresh: 'Actualiser les données', provider: 'Société de transport', title: 'En-tête de produit large' },
} satisfies Record<WideLang, Record<string, string>>;

export function wideLinks(lang: WideLang): SiteHeaderLink[] {
	return LINKS[lang].map(([path, label]) => ({ href: `/site-header-wide/${lang}#${path}`, label, priority: 3 }));
}
