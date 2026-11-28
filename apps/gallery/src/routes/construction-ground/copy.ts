export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export const COPY = {
	en: {
		title: 'Construction ground reveal',
		intro: 'Scroll down toward the footer to reveal the ground and construction props without shifting content in view.',
		toggleTheme: 'Toggle theme',
		skipToFooter: 'Jump to footer note',
		sections: [
			{
				id: 'corridor-summary',
				heading: 'Corridor summary',
				body: 'Measured service runs across seven days from scheduled departures and reported vehicle arrivals. Every figure keeps its observation window and sample count visible alongside the statement.',
			},
			{
				id: 'peak-headways',
				heading: 'Peak headways',
				body: 'Morning and afternoon peaks group consecutive vehicles along the trunk corridor so bunching and long gaps appear next to the published headway.',
			},
			{
				id: 'stop-coverage',
				heading: 'Stop coverage',
				body: 'Stops with fewer than twenty observed events stay listed without a punctuality rating so thin samples never masquerade as stable service.',
			},
			{
				id: 'fleet-reporting',
				heading: 'Fleet reporting',
				body: 'Active vehicles are counted only when they report a position on a scheduled trip. Vehicles without public identifiers are noted separately.',
			},
			{
				id: 'method-notes',
				heading: 'Method notes',
				body: 'Arrivals within one minute early and five minutes late count as on time. Missing feeds are recorded as unknown rather than interpolated.',
			},
			{
				id: 'publication-log',
				heading: 'Publication log',
				body: 'Completed weekly records are archived once the final service day closes and remain readable with the same URL and citation.',
			},
		],
		footer: {
			tagline: 'Shared design standard for public-data and product surfaces.',
			groups: [
				{
					label: 'Sections',
					links: [
						{ href: '#corridor-summary', label: 'Corridor summary' },
						{ href: '#peak-headways', label: 'Peak headways' },
						{ href: '#stop-coverage', label: 'Stop coverage' },
					],
				},
				{
					label: 'Reference',
					links: [
						{ href: '#fleet-reporting', label: 'Fleet reporting' },
						{ href: '#method-notes', label: 'Method notes' },
						{ href: '#publication-log', label: 'Publication log' },
					],
				},
			],
			statusStart: 'Gallery fixture · Nov 4–10, 2026',
		},
	},
	fr: {
		title: 'Sol de chantier révélé au défilement',
		intro: 'Faites défiler vers le pied de page pour révéler le sol et les éléments de chantier sans déplacer le contenu visible.',
		toggleTheme: 'Changer le thème',
		skipToFooter: 'Aller au pied de page',
		sections: [
			{
				id: 'corridor-summary',
				heading: 'Synthèse du corridor',
				body: 'Le service mesuré couvre sept jours à partir des départs prévus et des passages signalés. Chaque chiffre conserve sa période d’observation et son échantillon.',
			},
			{
				id: 'peak-headways',
				heading: 'Fréquences de pointe',
				body: 'Les pointes du matin et de l’après-midi regroupent les véhicules consécutifs afin de montrer les trains de bus et les écarts prolongés.',
			},
			{
				id: 'stop-coverage',
				heading: 'Couverture des arrêts',
				body: 'Les arrêts comptant moins de vingt passages observés restent affichés sans note de ponctualité afin d’éviter toute conclusion hâtive.',
			},
			{
				id: 'fleet-reporting',
				heading: 'Signalements du parc',
				body: 'Les véhicules actifs ne sont comptés que lorsqu’ils transmettent une position pendant un trajet prévu. Les véhicules sans numéro public sont indiqués à part.',
			},
			{
				id: 'method-notes',
				heading: 'Notes de méthode',
				body: 'Un passage entre une minute d’avance et cinq minutes de retard compte à l’heure. Les données manquantes restent inconnues plutôt qu’estimées.',
			},
			{
				id: 'publication-log',
				heading: 'Journal de publication',
				body: 'Les relevés hebdomadaires terminés sont archivés dès la fin du dernier jour de service et conservent la même adresse de citation.',
			},
		],
		footer: {
			tagline: 'Norme de conception partagée pour les produits et données publiques.',
			groups: [
				{
					label: 'Sections',
					links: [
						{ href: '#corridor-summary', label: 'Synthèse du corridor' },
						{ href: '#peak-headways', label: 'Fréquences de pointe' },
						{ href: '#stop-coverage', label: 'Couverture des arrêts' },
					],
				},
				{
					label: 'Référence',
					links: [
						{ href: '#fleet-reporting', label: 'Signalements du parc' },
						{ href: '#method-notes', label: 'Notes de méthode' },
						{ href: '#publication-log', label: 'Journal de publication' },
					],
				},
			],
			statusStart: 'Gabarit de galerie · du 4 au 10 nov. 2026',
		},
	},
} as const;
