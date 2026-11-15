/**
 * Rail titles in three languages for the /rail-title route and its spec: sections of different
 * lengths on alternating rails, so the sticky hand-off from one title to the next shows. The French
 * and Spanish titles are the long ones.
 */
export const RAIL_LANGS = ['en', 'fr', 'es'] as const;
export type RailLang = (typeof RAIL_LANGS)[number];

export const isRailLang = (value: string): value is RailLang => (RAIL_LANGS as readonly string[]).includes(value);

export interface RailSection {
	id: string;
	side: 'left' | 'right';
	heading: string;
	/** Paragraph count: the section's length. */
	paragraphs: number;
}

export interface RailCopy {
	title: string;
	lead: string;
	paragraph: string;
	sections: readonly RailSection[];
}

export const RAIL_COPY: Record<RailLang, RailCopy> = {
	en: {
		title: 'Rail titles',
		lead: 'Each section title sits on a side rail outside the centred content, stays in view while its section scrolls, then hands over to the next one. Below 1024px it reads horizontally.',
		paragraph:
			'Every route starts with a question about who is waiting and where. The answer becomes a small, honest tool that people can use on the platform, on a phone, in either language.',
		sections: [
			{ id: 'services', side: 'right', heading: 'Services', paragraphs: 2 },
			{ id: 'work', side: 'left', heading: 'Selected work', paragraphs: 14 },
			{ id: 'about', side: 'right', heading: 'About', paragraphs: 5 },
			{ id: 'next', side: 'left', heading: 'Next stop', paragraphs: 9 },
		],
	},
	fr: {
		title: 'Titres de rail',
		lead: 'Chaque titre de section se place sur un rail latéral, hors du contenu centré, reste visible pendant que sa section défile, puis passe le relais au suivant. Sous 1024 px, il se lit à l’horizontale.',
		paragraph:
			'Chaque trajet commence par une question sur qui attend, et où. La réponse devient un petit outil honnête, utilisable sur le quai, sur un téléphone, dans l’une ou l’autre langue.',
		sections: [
			{ id: 'services', side: 'right', heading: 'Services', paragraphs: 2 },
			{ id: 'work', side: 'left', heading: 'Réalisations sélectionnées', paragraphs: 14 },
			{ id: 'about', side: 'right', heading: 'À propos', paragraphs: 5 },
			{ id: 'next', side: 'left', heading: 'Prochain arrêt : votre projet', paragraphs: 9 },
		],
	},
	es: {
		title: 'Títulos de riel',
		lead: 'Cada título de sección se coloca en un riel lateral, fuera del contenido centrado, sigue a la vista mientras su sección se desplaza y luego cede el paso al siguiente. Por debajo de 1024 px se lee en horizontal.',
		paragraph:
			'Cada ruta empieza con una pregunta sobre quién espera y dónde. La respuesta se convierte en una herramienta pequeña y honesta, que se usa en el andén, en un teléfono, en cualquiera de los dos idiomas.',
		sections: [
			{ id: 'services', side: 'right', heading: 'Servicios', paragraphs: 2 },
			{ id: 'work', side: 'left', heading: 'Proyectos seleccionados', paragraphs: 14 },
			{ id: 'about', side: 'right', heading: 'Acerca de', paragraphs: 5 },
			{ id: 'next', side: 'left', heading: 'Próxima parada: tu proyecto con responsabilidades', paragraphs: 9 },
		],
	},
};
