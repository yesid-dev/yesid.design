import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	['en', 'fr'].flatMap((lang) => ['refresh', 'quiet'].map((refresh) => ({ lang, refresh })));

export const load: PageLoad = ({ params }) => ({
	lang: params.lang === 'fr' ? 'fr' : 'en',
	refresh: params.refresh === 'refresh',
});
