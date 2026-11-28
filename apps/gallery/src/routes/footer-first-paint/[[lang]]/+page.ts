import type { EntryGenerator, PageLoad } from './$types';

// The bare path is the English fixture, so the route sweep (accessibility.spec) can open it.
export const entries: EntryGenerator = () => [{}, { lang: 'en' }, { lang: 'fr' }];
export const load: PageLoad = ({ params }) => ({ lang: params.lang === 'fr' ? 'fr' as const : 'en' as const });
