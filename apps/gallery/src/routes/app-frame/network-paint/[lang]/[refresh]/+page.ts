import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	['en', 'fr'].flatMap((lang) => ['refresh', 'quiet', 'announcement'].map((refresh) => ({ lang, refresh })));

export const load: PageLoad = ({ params }) => ({
	lang: params.lang === 'fr' ? 'fr' : 'en',
	variant: params.refresh === 'announcement' || params.refresh === 'refresh' ? params.refresh : 'quiet',
});
