import { error } from '@sveltejs/kit';
import { DIVIDER_LANGS, isDividerLang } from '#lib/gallery/dividers-fixture.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => DIVIDER_LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params }) => {
	if (!isDividerLang(params.lang)) error(404, 'Unknown language');
	return { lang: params.lang };
};
