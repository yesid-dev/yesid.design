import type { SiteHeaderLink } from '@yesid/ui/layout';

/**
 * A Transit-shaped header for /site-header-wide, after Transit's NavPill: a "yesid. | Transit"
 * brand, three priority 3 links, search at clamp(11rem, 22cqi, 20rem) from 1024px, a compact
 * search link below that, refresh at every width and a provider choice that moves under the pill
 * below 600px. It raises priority 3 to 1280px with `linkTiers`.
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
