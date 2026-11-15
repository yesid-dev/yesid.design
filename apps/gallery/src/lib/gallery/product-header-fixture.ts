import type { SiteHeaderLabels, SiteHeaderLink } from '@yesid/ui/layout';

/**
 * Product headers in three languages, shared by the /site-header-pill and /product-brand routes
 * and their browser specs. Each language is its own prerendered path, so the copy is in the first
 * markup and the specs can read it without JavaScript.
 */
export const PRODUCT_LANGS = ['en', 'fr', 'es'] as const;
export type ProductLang = (typeof PRODUCT_LANGS)[number];

export const isProductLang = (value: string): value is ProductLang =>
	(PRODUCT_LANGS as readonly string[]).includes(value);

export const PRODUCT_LANGUAGE_NAMES = { en: 'English', fr: 'Français', es: 'Español' };

export interface ProductHeaderCopy {
	labels: SiteHeaderLabels;
	language: string;
	/** A three-link product header: two priority 2 links, then the priority 1 call to action. */
	links: readonly { path: string; label: string; priority: 1 | 2 }[];
	title: string;
	lead: string;
	houseLabel: string;
	tagline: string;
	longProduct: string;
}

export const PRODUCT_COPY: Record<ProductLang, ProductHeaderCopy> = {
	en: {
		labels: { skipToContent: 'Skip to content', openMenu: 'Open menu', closeMenu: 'Close menu', menu: 'Site menu', menuFooter: '', theme: 'Dark theme', nav: 'Primary' },
		language: 'Language',
		links: [
			{ path: 'services', label: 'Services', priority: 2 },
			{ path: 'projects', label: 'Projects', priority: 2 },
			{ path: 'contact', label: 'Contact', priority: 1 },
		],
		title: 'Product header',
		lead: 'The theme and language toggles sit in the pill at every width. Priority 2 links show from a 600px header, and links that do not fit leave a whole priority at a time.',
		houseLabel: 'yesid.dev (opens in a new tab)',
		tagline: 'A yesid product',
		longProduct: 'Connections dashboard',
	},
	fr: {
		labels: { skipToContent: 'Aller au contenu', openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu', menu: 'Menu du site', menuFooter: '', theme: 'Thème sombre', nav: 'Principale' },
		language: 'Langue',
		links: [
			{ path: 'services', label: 'Services', priority: 2 },
			{ path: 'projects', label: 'Projets', priority: 2 },
			{ path: 'contact', label: 'Contact', priority: 1 },
		],
		title: 'En-tête de produit',
		lead: 'Les boutons du thème et de la langue restent dans la pastille à toutes les largeurs. Les liens de priorité 2 apparaissent à partir de 600 px, et ceux qui ne tiennent pas partent par priorité entière.',
		houseLabel: 'yesid.dev (s’ouvre dans un nouvel onglet)',
		tagline: 'Un produit yesid',
		longProduct: 'Tableau de bord des correspondances',
	},
	es: {
		labels: { skipToContent: 'Saltar al contenido', openMenu: 'Abrir el menú', closeMenu: 'Cerrar el menú', menu: 'Menú del sitio', menuFooter: '', theme: 'Tema oscuro', nav: 'Principal' },
		language: 'Idioma',
		links: [
			{ path: 'services', label: 'Servicios', priority: 2 },
			{ path: 'projects', label: 'Proyectos', priority: 2 },
			{ path: 'contact', label: 'Contacto', priority: 1 },
		],
		title: 'Encabezado de producto',
		lead: 'Los botones de tema e idioma se quedan en la píldora en todos los anchos. Los enlaces de prioridad 2 aparecen desde 600 px, y los que no caben salen por prioridad completa.',
		houseLabel: 'yesid.dev (se abre en una pestaña nueva)',
		tagline: 'Un producto de yesid',
		longProduct: 'Panel de correspondencias del sistema',
	},
};

export function productLinks(base: string, lang: ProductLang): SiteHeaderLink[] {
	return PRODUCT_COPY[lang].links.map((link) => ({ href: `${base}/${lang}#${link.path}`, label: link.label, priority: link.priority }));
}
