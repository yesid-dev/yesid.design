import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

const LANGS = ['en', 'fr'] as const;

export const entries: EntryGenerator = () => LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params }) => {
	const lang = LANGS.find((known) => known === params.lang);
	if (!lang) error(404, 'Unknown language');
	return { lang };
};
