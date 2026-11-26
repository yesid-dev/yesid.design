import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import LanguageToggle from './LanguageToggle.svelte';

const href = (locale: string) => `/${locale}/page?q=1#h`;
const names = { en: 'English', fr: 'Français', es: 'Español' };
const NBSP = '\u00a0';

describe('LanguageToggle', () => {
	it('renders nothing with fewer than two locales', () => {
		const { queryByRole } = render(LanguageToggle, { props: { locale: 'en', locales: ['en'], href, names, label: 'Language' } });
		expect(queryByRole('link')).toBeNull();
	});

	it('links to the next locale and is named by it', () => {
		const { getByRole } = render(LanguageToggle, {
			props: { locale: 'fr', locales: ['en', 'fr', 'es'], href, names, label: 'Langue' },
		});
		const link = getByRole('link', { name: `Langue${NBSP}: Español (EN FR ES)` });
		expect(link.getAttribute('href')).toBe('/es/page?q=1#h');
		expect(link.textContent).toContain('EN');
		expect(link.textContent).toContain('ES');
		expect(link.hasAttribute('data-sveltekit-reset')).toBe(false);
		expect(link.hasAttribute('data-sveltekit-reload')).toBe(false);
	});

	it('asks for a full load or a state-preserving switch', () => {
		const reload = render(LanguageToggle, {
			props: { locale: 'en', locales: ['en', 'fr'], href, names, label: 'Language', reload: true },
		});
		expect(reload.getByRole('link', { name: 'Language: Français (EN FR)' }).hasAttribute('data-sveltekit-reload')).toBe(true);
		reload.unmount();

		const kept = render(LanguageToggle, {
			props: { locale: 'en', locales: ['en', 'fr'], href, names, label: 'Language', preserveState: true },
		});
		expect(kept.getByRole('link', { name: 'Language: Français (EN FR)' }).getAttribute('data-sveltekit-reset')).toBe('false');
	});

	// Each page names the link by the page it leads to, in that page's language, and announces nothing.
	it.each([
		{ locale: 'en', label: 'Language', next: 'fr', name: 'Language: Français (EN FR ES)' },
		{ locale: 'fr', label: 'Langue', next: 'es', name: `Langue${NBSP}: Español (EN FR ES)` },
		{ locale: 'es', label: 'Idioma', next: 'en', name: 'Idioma: English (EN FR ES)' },
	])('names the $locale page link by its $next destination', ({ locale, label, next, name }) => {
		const { getByRole } = render(LanguageToggle, { props: { locale, locales: ['en', 'fr', 'es'], href, names, label } });
		const link = getByRole('link', { name });
		expect(link.getAttribute('href')).toBe(href(next));
		expect(link.getAttribute('hreflang')).toBe(next);
		expect(link.hasAttribute('aria-label')).toBe(false);
		const destination = link.querySelector('[lang]')!;
		expect(destination.getAttribute('lang')).toBe(next);
		expect(destination.textContent).toBe(names[next as keyof typeof names]);
		expect(link.querySelectorAll('[lang]')).toHaveLength(1);
		expect(link.querySelector('[aria-live], [role="status"], [role="alert"]')).toBeNull();
	});

	it('renames the same link by its new destination after a state-preserving switch', async () => {
		const view = render(LanguageToggle, { props: { locale: 'en', locales: ['en', 'fr'], href, names, label: 'Language', preserveState: true } });
		const link = view.getByRole('link', { name: 'Language: Français (EN FR)' });
		await view.rerender({ locale: 'fr', locales: ['en', 'fr'], href, names, label: 'Langue', preserveState: true });
		expect(view.getByRole('link', { name: `Langue${NBSP}: English (EN FR)` })).toBe(link);
		expect(link.getAttribute('hreflang')).toBe('en');
		expect(link.querySelector('[lang]')!.getAttribute('lang')).toBe('en');
	});

	// French typography puts a no-break space before the colon; other languages keep a plain ": ".
	it.each([
		{ locale: 'en', locales: ['en', 'fr'], label: 'Language', next: 'fr', name: 'Language: Français (EN FR)' },
		{ locale: 'fr', locales: ['en', 'fr'], label: 'Langue', next: 'en', name: `Langue${NBSP}: English (EN FR)` },
		{ locale: 'fr-CA', locales: ['en', 'fr-CA'], label: 'Langue', next: 'en', name: `Langue${NBSP}: English (EN FR)` },
		{ locale: 'es', locales: ['en', 'fr', 'es'], label: 'Idioma', next: 'en', name: 'Idioma: English (EN FR ES)' },
	])('separates the $locale label as French typography asks', ({ locale, locales, label, next, name }) => {
		const { getByRole, queryByRole } = render(LanguageToggle, { props: { locale, locales, href, names, label } });
		expect(getByRole('link', { name }).getAttribute('href')).toBe(href(next));
		if (name.includes(NBSP)) expect(queryByRole('link', { name: name.replace(NBSP, ' ') })).toBeNull();
	});

});

// Product order must not determine the brand signpost or cycle.
it.each([
    { locales: ['fr', 'en', 'es'], locale: 'en', next: 'fr', codes: ['EN', 'FR', 'ES'] },
    { locales: ['fr', 'en', 'es'], locale: 'es', next: 'en', codes: ['EN', 'FR', 'ES'] },
    { locales: ['fr', 'en'], locale: 'en', next: 'fr', codes: ['EN', 'FR'] },
    { locales: ['en', 'fr'], locale: 'fr', next: 'en', codes: ['EN', 'FR'] },
    { locales: ['de', 'fr', 'it', 'es', 'en'], locale: 'es', next: 'de', codes: ['EN', 'FR', 'ES', 'DE', 'IT'] },
])('orders boards and cycles from $locale to $next with $locales', ({ locales, locale, next, codes }) => {
    const supplied = [...locales];
    const view = render(LanguageToggle, { props: { locale, locales, href, names, label: 'Language' } });
    const link = view.getByRole('link');
    expect(link.getAttribute('href')).toBe(href(next));
    expect([...link.querySelectorAll('svg text')].map(node => node.textContent)).toEqual(codes);
    expect(locales).toEqual(supplied);
});
