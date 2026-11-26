import { expect, test, type Locator, type Page } from '@playwright/test';

import { HOME } from '../../src/lib/gallery/site-header-fixture.js';

// LanguageToggle keeps its name in a 1px clipped box. Products measure every element box against the
// viewport, and the header puts the toggle near the right edge, so no box inside the link may run
// past it. Each case sets its own viewport and text size, so one project runs it.
test.beforeEach(({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets every width and text size');
});

const NBSP = '\u00a0';

const PAGES = [
	{ path: HOME, toggles: [{ name: 'Language: Français (EN FR)', next: 'fr', destination: 'Français' }] },
	// French puts a no-break space before the colon, whatever the label's own language.
	{ path: `${HOME}?lang=fr`, toggles: [{ name: `Language${NBSP}: English (EN FR)`, next: 'en', destination: 'English' }] },
	{ path: `${HOME}?scrambled&lang=es`, toggles: [{ name: 'Language: English (EN FR ES)', next: 'en', destination: 'English' }] },
	{
		path: '/',
		toggles: [
			{ name: 'Language: Français (EN FR)', next: 'fr', destination: 'Français' },
			{ name: `Langue${NBSP}: Español (EN FR ES)`, next: 'es', destination: 'Español' },
		],
	},
];

/** Boxes in the link that cross the viewport edge, or hidden-name boxes over 1px that leave the link. */
function strayBoxes(link: Locator): Promise<string[]> {
	return link.evaluate((link) => {
		const own = link.getBoundingClientRect();
		const viewport = document.documentElement.clientWidth;
		return [link, ...link.querySelectorAll('*')].flatMap((element) => [...element.getClientRects()].flatMap((box) => {
			const where = `<${element.localName}${element.hasAttribute('lang') ? ` lang="${element.getAttribute('lang')}"` : ''}> `
				+ `at x ${box.left.toFixed(1)} to ${box.right.toFixed(1)}, y ${box.top.toFixed(1)} to ${box.bottom.toFixed(1)}`;
			if (box.left < 0 || box.right > viewport) return [`${where} crosses the ${viewport}px viewport`];
			// The aria-hidden signpost is the visible artwork; a three-board post bleeds past the link by design.
			if (element.closest('svg') || (box.width <= 1 && box.height <= 1)) return [];
			const inside = box.left >= own.left && box.right <= own.right && box.top >= own.top && box.bottom <= own.bottom;
			return inside ? [] : [`${where} leaves the link at x ${own.left.toFixed(1)} to ${own.right.toFixed(1)}`];
		}));
	});
}

/** The language links' names in Chromium's own accessibility tree, in document order. */
async function chromiumNames(page: Page): Promise<string[]> {
	const cdp = await page.context().newCDPSession(page);
	try {
		const { nodes } = await cdp.send('Accessibility.getFullAXTree');
		return nodes
			.filter((node) => !node.ignored && node.role?.value === 'link')
			.map((node) => String(node.name?.value ?? ''))
			.filter((name) => /^Lang(?:uage|ue)\b/.test(name));
	} finally {
		await cdp.detach();
	}
}

for (const [width, text] of [[390, '200%'], [1440, '100%']] as const) {
	test(`the hidden name stays inside the link at ${width}px and ${text} text`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		for (const { path, toggles } of PAGES) {
			await page.goto(path);
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			await page.evaluate(() => document.fonts.ready);
			await page.locator('html').evaluate((node, size) => { node.style.fontSize = size; }, text);
			const links = page.getByTestId('language-toggle');
			await expect(links).toHaveCount(toggles.length);
			for (const [index, { next, destination }] of toggles.entries()) {
				const link = links.nth(index);
				await expect(link, `${path} toggle ${index}`).toBeVisible();
				expect(await strayBoxes(link), `${path} toggle ${index}`).toEqual([]);
				await expect(link.locator(`[lang="${next}"]`)).toHaveText(destination);
			}
			expect(await chromiumNames(page), path).toEqual(toggles.map(({ name }) => name));
		}
	});
}
