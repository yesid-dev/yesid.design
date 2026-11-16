import { cleanup, render } from '@testing-library/svelte';
import { compile } from 'svelte/compiler';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductBrand from './ProductBrand.svelte';

const css = compile(readFileSync(resolve('src/brand/ProductBrand.svelte'), 'utf8'), {
	filename: 'ProductBrand.svelte',
	css: 'external',
}).css!.code;

const hover = vi.hoisted(() => vi.fn(() => ({ destroy() {} })));
vi.mock('@yesid/motion/actions', async (original) => ({ ...(await original<object>()), wordmarkHover: hover }));
afterEach(() => {
	cleanup();
	hover.mockClear();
});

describe('ProductBrand', () => {
	it('renders the still house wordmark, a hidden divider and the product link in that order', () => {
		const view = render(ProductBrand, { props: { product: 'Login', href: '/?lang=en', houseHref: 'https://yesid.dev' } });
		const links = view.getAllByRole('link');
		expect(links.map((link) => link.getAttribute('href'))).toEqual(['https://yesid.dev', '/?lang=en']);
		expect(links[0]).toBe(view.getByRole('link', { name: /^yesid\s*\.$/ }));
		expect(links[1]).toBe(view.getByRole('link', { name: 'Login' }));
		expect(links[0].hasAttribute('target')).toBe(false);
		expect(links[1].hasAttribute('aria-current')).toBe(false);
		const divider = view.container.querySelector('.product-brand-divider');
		expect(divider?.getAttribute('aria-hidden')).toBe('true');
		expect(divider?.previousElementSibling).toBe(links[0]);
		expect(divider?.nextElementSibling).toBe(links[1]);
		expect(hover).not.toHaveBeenCalled();
	});

	it('takes the pill divider space inside SiteHeader and keeps its own elsewhere', () => {
		expect(css).toMatch(/\.product-brand(?:\.[\w-]+)*\s*\{[^}]*gap:\s*var\(--nav-split-space,\s*0\.5em\)/);
	});

	it('takes the product copy as written, without changing its case', () => {
		const view = render(ProductBrand, { props: { product: 'transit', href: '/', houseHref: 'https://yesid.dev' } });
		expect(view.getByRole('link', { name: 'transit' })).toBeInTheDocument();
	});

	it('opens the house link in a new tab with the caller label and marks the current product page', () => {
		const view = render(ProductBrand, {
			props: {
				product: 'Transit',
				href: '/',
				houseHref: 'https://yesid.dev',
				houseExternal: true,
				houseLabel: 'yesid.dev (opens in a new tab)',
				current: true,
				class: 'text-2xl',
				'data-testid': 'footer-brand',
			},
		});
		const house = view.getByRole('link', { name: 'yesid.dev (opens in a new tab)' });
		expect(house.getAttribute('target')).toBe('_blank');
		expect(house.getAttribute('rel')).toBe('noopener noreferrer');
		expect(view.getByRole('link', { name: 'Transit' }).getAttribute('aria-current')).toBe('page');
		const root = view.getByTestId('footer-brand');
		expect(root.dataset.slot).toBe('product-brand');
		expect([...root.classList]).toEqual(expect.arrayContaining(['product-brand', 'text-2xl']));
	});
});
