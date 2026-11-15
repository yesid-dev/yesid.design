import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { LANGS, type Lang } from '../../reading-surfaces/fixture';

export const entries: EntryGenerator = () => LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params }) => {
	if (!(LANGS as readonly string[]).includes(params.lang)) error(404, 'Unknown language');
	return { lang: params.lang as Lang };
};
