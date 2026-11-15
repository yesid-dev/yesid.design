import { cleanup, render } from '@testing-library/svelte';
import { afterEach, expect, it, vi } from 'vitest';
import SiteHeader from './SiteHeader.svelte';
import { mountLifecycle } from '../brand/test-fixtures/mount-lifecycle.js';
import { fakeRouter } from '../brand/test-fixtures/fake-router.js';
const calls = vi.hoisted(() => vi.fn(() => ({ destroy() {} })));
vi.mock('@yesid/motion/actions', async original => ({ ...await original<object>(), wordmarkHover: calls }));
afterEach(() => { cleanup(); calls.mockClear(); });
const labels = { openMenu: 'Open menu', closeMenu: 'Close menu', menu: 'Menu', theme: 'Theme', menuFooter: '', skipToContent: 'Skip' };
it.each([undefined, [], [{ label: 'Empty', items: [] }]])('omits an empty menu and keeps compact controls reachable: %j', menuGroups => {
 const navigation = mountLifecycle(fakeRouter().router).lifecycle;
 const view = render(SiteHeader, { navigation, home: '/', links: [], menuItems: menuGroups ? [{ href: '/old', label: 'Old' }] : [], menuGroups, compactControls: true, labels });
 expect(view.queryByRole('button', { name: 'Open menu' })).toBeNull();
 expect(view.getByRole('switch', { name: 'Theme' })).toBeInTheDocument();
});
it.each([true, false])('forwards wordmark autoplay %s', wordmarkAutoPlay => {
 const navigation = mountLifecycle(fakeRouter().router).lifecycle;
 render(SiteHeader, { navigation, home: '/', links: [], labels, wordmarkAutoPlay });
 expect(calls).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ autoPlay: wordmarkAutoPlay }));
});
it('retains wordmark autoplay by default', () => {
 const navigation = mountLifecycle(fakeRouter().router).lifecycle;
 render(SiteHeader, { navigation, home: '/', links: [], labels });
 expect(calls).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ autoPlay: true }));
});
it('marks caller link tiers on the pill and leaves the defaults unmarked', () => {
 const navigation = mountLifecycle(fakeRouter().router).lifecycle;
 const links = [{ href: '/a', label: 'A', priority: 3 as const }];
 const tiered = render(SiteHeader, { navigation, home: '/', links, labels, linkTiers: { priority2: 768, priority3: 1280 } });
 const pill = tiered.getByTestId('nav-pill');
 expect([pill.dataset.priority2From, pill.dataset.priority3From, pill.dataset.linksFrom]).toEqual(['768', '1280', '3']);
 cleanup();
 const plain = render(SiteHeader, { navigation: mountLifecycle(fakeRouter().router).lifecycle, home: '/', links, labels });
 const defaults = plain.getByTestId('nav-pill');
 expect([defaults.hasAttribute('data-priority2-from'), defaults.hasAttribute('data-priority3-from')]).toEqual([false, false]);
});
it.each([
 { priorities: [1, 2, 3], tiers: undefined, rowFrom: '375' },
 { priorities: [3], tiers: undefined, rowFrom: '1024' },
 { priorities: [3], tiers: { priority3: 1280 }, rowFrom: '1280' },
 { priorities: [2, 3], tiers: { priority2: 1280 }, rowFrom: '1024' },
 { priorities: [2, 3], tiers: { priority2: 1024, priority3: 1600 }, rowFrom: '1024' },
 { priorities: [2], tiers: undefined, rowFrom: '600' },
] as const)('hides the links row only below the lowest tier present: $priorities $tiers', ({ priorities, tiers, rowFrom }) => {
 const navigation = mountLifecycle(fakeRouter().router).lifecycle;
 const links = priorities.map((priority) => ({ href: `/${priority}`, label: `P${priority}`, priority }));
 const view = render(SiteHeader, { navigation, home: '/', links, labels, linkTiers: tiers });
 expect(view.getByTestId('nav-pill').dataset.rowFrom).toBe(rowFrom);
});
