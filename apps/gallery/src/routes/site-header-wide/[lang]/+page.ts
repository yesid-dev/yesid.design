import { error } from '@sveltejs/kit';
import { WIDE_LANGS, isWideLang } from '#lib/gallery/wide-header-fixture.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => WIDE_LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params }) => {
	if (!isWideLang(params.lang)) error(404, 'Unknown language');
	return { lang: params.lang };
};
