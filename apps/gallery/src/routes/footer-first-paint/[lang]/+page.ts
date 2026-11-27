import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => [{ lang: 'en' }, { lang: 'fr' }];
export const load: PageLoad = ({ params }) => ({ lang: params.lang === 'fr' ? 'fr' as const : 'en' as const });
