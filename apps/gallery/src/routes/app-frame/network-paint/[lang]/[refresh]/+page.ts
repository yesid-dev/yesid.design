import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	['en', 'fr'].flatMap((lang) => ['refresh', 'quiet', 'announcement', 'long'].map((refresh) => ({ lang, refresh })));

export const load: PageLoad = ({ params }) => ({
	lang: params.lang === 'fr' ? 'fr' : 'en',
	variant: ['announcement', 'refresh', 'long'].includes(params.refresh) ? params.refresh : 'quiet',
});
