export const LANGS = ['en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export const FIXTURES = ['lines', 'stops', 'vehicles', 'empty', 'loading', 'minimal'] as const;
export type FixtureKind = (typeof FIXTURES)[number];

export interface LineRow {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly onTime: number;
	readonly late: number;
	readonly trips: number;
	readonly events: number;
}

export interface StopRow {
	readonly code: string;
	readonly name: string;
	readonly lines: readonly string[];
	readonly onTime: number;
	readonly events: number;
}

export interface VehicleRow {
	readonly id: string;
	readonly days: number;
	readonly hours: number;
	readonly lines: number;
	readonly trips: number;
}

export const LINE_ROWS: readonly LineRow[] = [
	{ id: '18', code: '18', name: 'Beaubien', onTime: 86, late: 9, trips: 1420, events: 42600 },
	{ id: '24', code: '24', name: 'Sherbrooke', onTime: 79, late: 15, trips: 1680, events: 53760 },
	{ id: '51', code: '51', name: 'Édouard-Montpetit', onTime: 83, late: 11, trips: 1310, events: 39300 },
	{ id: '55', code: '55', name: 'Boulevard Saint-Laurent', onTime: 74, late: 19, trips: 1540, events: 49280 },
	{ id: '80', code: '80', name: 'Avenue du Parc', onTime: 81, late: 13, trips: 1890, events: 60480 },
	{ id: '165', code: '165', name: 'Côte-des-Neiges', onTime: 77, late: 17, trips: 2010, events: 66330 },
];

export const STOP_ROWS: readonly StopRow[] = [
	{ code: '52847', name: 'Station Laurier', lines: ['51', '27'], onTime: 84, events: 9420 },
	{ code: '52110', name: 'Saint-Laurent / Beaubien', lines: ['18', '55'], onTime: 78, events: 8140 },
	{ code: '51402', name: 'Du Parc / Mont-Royal', lines: ['80', '97'], onTime: 81, events: 11250 },
	{ code: '53019', name: 'Sherbrooke / Berri', lines: ['24', '30'], onTime: 76, events: 7890 },
	{ code: '54208', name: 'Côte-des-Neiges / Queen-Mary', lines: ['51', '165'], onTime: 80, events: 10310 },
];

export const VEHICLE_ROWS: readonly VehicleRow[] = [
	{ id: '31-104', days: 7, hours: 94, lines: 4, trips: 118 },
	{ id: '31-218', days: 6, hours: 81, lines: 3, trips: 102 },
	{ id: '38-042', days: 7, hours: 98, lines: 5, trips: 126 },
	{ id: '40-519', days: 5, hours: 66, lines: 2, trips: 84 },
	{ id: '42-803', days: 7, hours: 91, lines: 4, trips: 115 },
];

export const COPY = {
	en: {
		locale: 'en-CA',
		pageTitle: 'Listing body fixtures',
		pageIntro: 'Embedded listing results cards mirroring Lines, Stops, Vehicles, empty and loading states.',
		stampRecord: 'Record · Nov 4–10, 2026',
		clearFilters: 'Clear filters',
		showMore: (count: number) => `Show ${count} more`,
		showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
		lines: {
			title: 'Every measured line',
			searchLabel: 'Line number or name',
			searchPlaceholder: 'Line number or name',
			breakdown: '6 lines listed here: 4 measured, 1 without live data, 1 that cannot be judged on these dates.',
			countLabel: { singular: '{count} line', plural: '{count} lines' },
			sortLabel: 'Sort lines by',
			sortOptions: [
				{ key: 'code', label: 'Line' },
				{ key: 'onTime', label: 'On time' },
				{ key: 'late', label: 'Late' },
				{ key: 'trips', label: 'Trips' },
			] as const,
			ascending: 'Ascending',
			descending: 'Descending',
			directionLabel: 'Sort direction',
			caption: 'Measured lines for Nov 4–10, 2026',
			columns: { line: 'Line', onTime: 'On time', late: 'Late', trips: 'Trips', events: 'Stop events' },
			detail: (late: string, trips: string, events: string) => `${late} late · ${trips} trips · ${events} stop events`,
		},
		stops: {
			title: 'Find a stop',
			searchLabel: 'Name, code or line',
			searchPlaceholder: 'Laurier, 52847 or 51',
			nearMe: 'Near me',
			nearClear: 'Clear nearby',
			nearAddress: 'Search by address',
			nearStatus: 'Showing stops within 500 m.',
			countLabel: { singular: '{count} stop', plural: '{count} stops' },
			caption: 'Measured stops for Nov 4–10, 2026',
			columns: { code: 'Code', stop: 'Stop', lines: 'Lines', onTime: 'On time', events: 'Stop events' },
			detail: (code: string, lines: string, events: string) => `Code ${code} · Lines ${lines} · ${events} stop events`,
		},
		vehicles: {
			title: 'Find a vehicle',
			searchLabel: 'Vehicle number',
			searchPlaceholder: 'Vehicle number',
			searchDescription: 'The number painted on the vehicle.',
			countLabel: { singular: '{count} vehicle', plural: '{count} vehicles' },
			caption: 'Reported vehicles for Nov 4–10, 2026',
			columns: { vehicle: 'Vehicle', days: 'Days', hours: 'Hours', lines: 'Lines', trips: 'Trips' },
			detail: (hours: string, lines: string, trips: string) => `${hours} h · ${lines} lines · ${trips} trips`,
		},
		empty: {
			title: 'Every measured line',
			searchLabel: 'Line number or name',
			searchPlaceholder: 'Line number or name',
			initialQuery: '999',
			noticeTitle: 'No lines match “999”.',
			noticeBody: 'Check the line number or clear the search to see every measured line.',
			clearAction: 'Clear search',
			restoredNote: 'Search cleared. All measured lines are available.',
		},
		loading: {
			title: 'Every measured line',
			searchLabel: 'Line number or name',
			searchPlaceholder: 'Line number or name',
			caption: 'Loading measured lines',
		},
		minimal: {
			heading: 'Minimal listing body',
			items: ['18 Beaubien', '24 Sherbrooke', '51 Édouard-Montpetit'],
		},
	},
	fr: {
		locale: 'fr-CA',
		pageTitle: 'Gabarits de corps de liste',
		pageIntro: 'Cartes de résultats intégrées reflétant les listes Lignes, Arrêts, Véhicules, état vide et chargement.',
		stampRecord: 'Relevé · du 4 au 10 nov. 2026',
		clearFilters: 'Effacer les filtres',
		showMore: (count: number) => `Afficher ${count} de plus`,
		showing: (shown: number, total: number) => `${shown} sur ${total} affichés`,
		lines: {
			title: 'Chaque ligne mesurée',
			searchLabel: 'Numéro ou nom de ligne',
			searchPlaceholder: 'Numéro ou nom de ligne',
			breakdown: '6 lignes figurent ici\u00a0: 4 avec des mesures, 1 sans données en direct, 1 qu’on ne peut pas juger à ces dates.',
			countLabel: { singular: '{count} ligne', plural: '{count} lignes' },
			sortLabel: 'Trier les lignes par',
			sortOptions: [
				{ key: 'code', label: 'Ligne' },
				{ key: 'onTime', label: 'À l’heure' },
				{ key: 'late', label: 'En retard' },
				{ key: 'trips', label: 'Trajets' },
			] as const,
			ascending: 'Croissant',
			descending: 'Décroissant',
			directionLabel: 'Sens du tri',
			caption: 'Lignes mesurées du 4 au 10 nov. 2026',
			columns: { line: 'Ligne', onTime: 'À l’heure', late: 'En retard', trips: 'Trajets', events: 'Passages' },
			detail: (late: string, trips: string, events: string) => `${late} en retard · ${trips} trajets · ${events} passages`,
		},
		stops: {
			title: 'Trouver un arrêt',
			searchLabel: 'Nom, code ou ligne',
			searchPlaceholder: 'Laurier, 52847 ou 51',
			nearMe: 'Près de moi',
			nearClear: 'Effacer la proximité',
			nearAddress: 'Chercher par adresse',
			nearStatus: 'Arrêts à moins de 500 m.',
			countLabel: { singular: '{count} arrêt', plural: '{count} arrêts' },
			caption: 'Arrêts mesurés du 4 au 10 nov. 2026',
			columns: { code: 'Code', stop: 'Arrêt', lines: 'Lignes', onTime: 'À l’heure', events: 'Passages' },
			detail: (code: string, lines: string, events: string) => `Code ${code} · Lignes ${lines} · ${events} passages`,
		},
		vehicles: {
			title: 'Trouver un véhicule',
			searchLabel: 'Numéro de véhicule',
			searchPlaceholder: 'Numéro de véhicule',
			searchDescription: 'Le numéro inscrit sur le véhicule.',
			countLabel: { singular: '{count} véhicule', plural: '{count} véhicules' },
			caption: 'Véhicules signalés du 4 au 10 nov. 2026',
			columns: { vehicle: 'Véhicule', days: 'Jours', hours: 'Heures', lines: 'Lignes', trips: 'Trajets' },
			detail: (hours: string, lines: string, trips: string) => `${hours} h · ${lines} lignes · ${trips} trajets`,
		},
		empty: {
			title: 'Chaque ligne mesurée',
			searchLabel: 'Numéro ou nom de ligne',
			searchPlaceholder: 'Numéro ou nom de ligne',
			initialQuery: '999',
			noticeTitle: 'Aucune ligne ne correspond à «\u00a0999\u00a0».',
			noticeBody: 'Vérifiez le numéro de ligne ou effacez la recherche pour voir toutes les lignes mesurées.',
			clearAction: 'Effacer la recherche',
			restoredNote: 'Recherche effacée. Toutes les lignes mesurées sont disponibles.',
		},
		loading: {
			title: 'Chaque ligne mesurée',
			searchLabel: 'Numéro ou nom de ligne',
			searchPlaceholder: 'Numéro ou nom de ligne',
			caption: 'Chargement des lignes mesurées',
		},
		minimal: {
			heading: 'Corps de liste minimal',
			items: ['18 Beaubien', '24 Sherbrooke', '51 Édouard-Montpetit'],
		},
	},
} as const;
