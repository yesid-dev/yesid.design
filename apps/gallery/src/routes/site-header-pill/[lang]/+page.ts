import { error } from '@sveltejs/kit';
import { PRODUCT_LANGS, isProductLang } from '#lib/gallery/product-header-fixture.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => PRODUCT_LANGS.map((lang) => ({ lang }));

export const load: PageLoad = ({ params }) => {
	if (!isProductLang(params.lang)) error(404, 'Unknown language');
	return { lang: params.lang };
};
