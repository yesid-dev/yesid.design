/**
 * The /dividers route in three languages (D22): the dimension line between sections, the
 * last-section rule and the footer's street edge. Each language is its own prerendered path.
 */
export const DIVIDER_LANGS = ['en', 'fr', 'es'] as const;
export type DividerLang = (typeof DIVIDER_LANGS)[number];

export const isDividerLang = (value: string): value is DividerLang =>
	(DIVIDER_LANGS as readonly string[]).includes(value);

export interface DividerSectionCopy {
	id: string;
	heading: string;
	body: string;
}

export interface DividerCopy {
	title: string;
	lead: string;
	sections: readonly DividerSectionCopy[];
	manual: string;
	terminalTitle: string;
	terminalBody: string;
	tagline: string;
	footerGroup: string;
	footerLinks: readonly { id: string; label: string }[];
	languages: string;
}

export const DIVIDER_COPY: Record<DividerLang, DividerCopy> = {
	en: {
		title: 'Dividers',
		lead: 'One divider in every product: a drafting dimension line in the blueprint ink, edge to edge, with a scale tick every 80 px. It is decorative and never moves.',
		sections: [
			{ id: 'line', heading: 'The dimension line', body: 'Every section ends with it at its bottom edge. Put the section-dividers class on the element that holds the page’s sections and the kit draws it; the page draws nothing.' },
			{ id: 'placement', heading: 'Every section but the last', body: 'The last section ends without one, so a divider never sits before the footer.' },
			{ id: 'panels', heading: 'In the kit’s frames and panels', body: 'Frames, mastheads and terminal panels draw the same line with their rule option, in place of hazard tape.' },
			{ id: 'street', heading: 'The street edge', body: 'The footer’s top edge is a road marking: one dashed line whose dashes alternate yellow and white, edge to edge, on the footer’s own colours.' },
		],
		manual: 'By hand, for a break inside a section: Separator with the dimension variant.',
		terminalTitle: 'Terminal panel',
		terminalBody: 'rule="dimension" draws the line under the title bar.',
		tagline: 'A yesid product',
		footerGroup: 'On this page',
		footerLinks: [
			{ id: 'line', label: 'The dimension line' },
			{ id: 'street', label: 'The street edge' },
		],
		languages: 'Languages',
	},
	fr: {
		title: 'Séparateurs',
		lead: 'Un seul séparateur dans tous les produits : une ligne de cote tracée à l’encre du plan, d’un bord à l’autre, avec une graduation tous les 80 px. Elle est décorative et ne bouge jamais.',
		sections: [
			{ id: 'line', heading: 'La ligne de cote', body: 'Chaque section se termine par cette ligne, sur son bord inférieur. Ajoutez la classe section-dividers à l’élément qui contient les sections de la page et la trousse la dessine ; la page ne dessine rien.' },
			{ id: 'placement', heading: 'Toutes les sections sauf la dernière', body: 'La dernière section se termine sans séparateur, pour qu’aucun séparateur ne précède jamais le pied de page.' },
			{ id: 'panels', heading: 'Dans les cadres et les panneaux de la trousse', body: 'Les cadres, les en-têtes et les panneaux de terminal tracent la même ligne avec leur option de filet, à la place du ruban de danger.' },
			{ id: 'street', heading: 'La bordure de rue', body: 'Le bord supérieur du pied de page est un marquage routier : une seule ligne pointillée dont les tirets alternent le jaune et le blanc, d’un bord à l’autre, sur les couleurs propres du pied de page.' },
		],
		manual: 'À la main, pour une coupure à l’intérieur d’une section : Separator avec la variante dimension.',
		terminalTitle: 'Panneau de terminal',
		terminalBody: 'rule="dimension" trace la ligne sous la barre de titre.',
		tagline: 'Un produit yesid',
		footerGroup: 'Sur cette page',
		footerLinks: [
			{ id: 'line', label: 'La ligne de cote' },
			{ id: 'street', label: 'La bordure de rue' },
		],
		languages: 'Langues',
	},
	es: {
		title: 'Divisores',
		lead: 'Un solo divisor en todos los productos: una línea de cota trazada con la tinta del plano, de borde a borde, con una marca de escala cada 80 px. Es decorativa y nunca se mueve.',
		sections: [
			{ id: 'line', heading: 'La línea de cota', body: 'Cada sección termina con esta línea en su borde inferior. Agregue la clase section-dividers al elemento que contiene las secciones de la página y el kit la dibuja; la página no dibuja nada.' },
			{ id: 'placement', heading: 'Todas las secciones menos la última', body: 'La última sección termina sin divisor, para que nunca haya un divisor justo antes del pie de página.' },
			{ id: 'panels', heading: 'En los marcos y paneles del kit', body: 'Los marcos, los encabezados y los paneles de terminal trazan la misma línea con su opción de filete, en lugar de la cinta de peligro.' },
			{ id: 'street', heading: 'El borde de la calle', body: 'El borde superior del pie de página es una señalización vial: una sola línea discontinua cuyos trazos alternan amarillo y blanco, de borde a borde, sobre los colores propios del pie de página.' },
		],
		manual: 'A mano, para una pausa dentro de una sección: Separator con la variante dimension.',
		terminalTitle: 'Panel de terminal',
		terminalBody: 'rule="dimension" traza la línea bajo la barra de título.',
		tagline: 'Un producto de yesid',
		footerGroup: 'En esta página',
		footerLinks: [
			{ id: 'line', label: 'La línea de cota' },
			{ id: 'street', label: 'El borde de la calle' },
		],
		languages: 'Idiomas',
	},
};
