import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';
import { FIXTURES, LANGS, type FixtureKind, type Lang } from '../../copy';

export const entries: EntryGenerator = () =>
	LANGS.flatMap((lang) => FIXTURES.map((fixture) => ({ lang, fixture })));

export const load: PageLoad = ({ params }) => {
	if (!(LANGS as readonly string[]).includes(params.lang)) error(404, 'Unknown language');
	if (!(FIXTURES as readonly string[]).includes(params.fixture)) error(404, 'Unknown fixture');
	return { lang: params.lang as Lang, fixture: params.fixture as FixtureKind };
};
