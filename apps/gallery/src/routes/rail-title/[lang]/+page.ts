import { error } from '@sveltejs/kit';
import { RAIL_LANGS, isRailLang } from '#lib/gallery/rail-title-fixture.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => RAIL_LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params }) => {
	if (!isRailLang(params.lang)) error(404, 'Unknown language');
	return { lang: params.lang };
};
