import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const NAMES = [
	'Link to this section: Safety first',
	'Link to this section: Opening hours',
	'Link to this section: Service levels',
	'Lien vers cette section: Accès aux stations',
	'Link to this section: Method',
	'Link to this section: Results over the complete observation period',
	'Link to this section: Sources',
];

async function open(page: Page): Promise<void> {
	await page.goto('/article-body');
	await page.locator('html[data-gallery-ready]').waitFor();
	await page.evaluate(() => document.fonts.ready);
}

/** Chromium's own accessibility tree, which is what a screen reader is given. */
async function chromiumNames(page: Page, role: 'link' | 'heading'): Promise<string[]> {
	const session = await page.context().newCDPSession(page);
	const { nodes } = await session.send('Accessibility.getFullAXTree');
	await session.detach();
	return nodes
		.filter((node) => !node.ignored && node.role?.value === role)
		.map((node) => String(node.name?.value ?? ''));
}

const permalink = (page: Page, name: string) => page.getByRole('link', { name, exact: true });

/** Tabs from the top of the page, so the link takes focus the way a keyboard reader gives it. */
async function tabTo(page: Page, link: Locator): Promise<void> {
	await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
	for (let step = 0; step < 40; step++) {
		await page.keyboard.press('Tab');
		if (await link.evaluate((element) => element === document.activeElement)) return;
	}
	throw new Error('Tab never reached the permalink');
}

test('Chromium names each permalink by its label and heading, and keeps heading names clean', async ({ page }) => {
	await open(page);
	const links = await chromiumNames(page, 'link');
	expect(links.filter((name) => /^(Link to|Lien vers)/.test(name)).sort()).toEqual([...NAMES].sort());
	const headings = await chromiumNames(page, 'heading');
	for (const name of ['Safety first', 'Opening hours', 'Service levels', 'Accès aux stations', 'Method', 'Sources']) {
		expect(headings).toContain(name);
	}
	expect(headings.filter((name) => /Link to|Lien vers/.test(name))).toEqual([]);
	for (const name of NAMES) await expect(permalink(page, name)).toHaveCount(1);
});

test('a permalink shows when its heading is hovered or it takes keyboard focus @theme', async ({ page }, testInfo) => {
	await open(page);
	await expect(page.locator('html')).toHaveAttribute('data-theme', testInfo.project.name);
	for (const [name, heading] of [
		['Link to this section: Opening hours', page.locator('#hours-text')],
		['Link to this section: Method', page.locator('[data-toc="method"] [data-section-trigger]')],
		['Link to this section: Results over the complete observation period', page.locator('#results .section-title')],
		['Link to this section: Sources', page.locator('#sources')],
	] as const) {
		const link = permalink(page, name);
		await page.mouse.move(0, 0);
		await expect(link).toHaveCSS('opacity', '0');
		await heading.hover();
		await expect(link).toHaveCSS('opacity', '0.6');
		await page.mouse.move(0, 0);
		await expect(link).toHaveCSS('opacity', '0');
	}

	for (const [name, heading] of [
		['Link to this section: Opening hours', page.locator('#hours-text')],
		['Link to this section: Method', page.locator('[data-toc="method"] [data-section-trigger]')],
	] as const) {
		const link = permalink(page, name);
		await page.mouse.move(0, 0);
		await tabTo(page, link);
		await expect(link).toHaveCSS('opacity', '1');
		await expect(link).toHaveCSS('outline-style', 'solid');
		await expectAccessible(page);
		// Hovering the heading never dims a focused link.
		await heading.hover();
		await expect(link).toHaveCSS('opacity', '1');
	}
});

test('permalinks hang beside their titles without moving them or widening the page', async ({ page }) => {
	await open(page);
	await expectNoHorizontalOverflow(page);
	// In prose the "#" hangs wholly left of its heading's text.
	const article = permalink(page, 'Link to this section: Safety first');
	await article.focus();
	const hanging = (await article.boundingBox())!;
	expect(hanging.x + hanging.width).toBeLessThanOrEqual((await page.locator('#safety-text').boundingBox())!.x);
	// In a section card it stays in the side inset, clear of the title, with a 24px by 44px target.
	const section = permalink(page, 'Link to this section: Method');
	await section.focus();
	const inset = (await section.boundingBox())!;
	const card = (await page.locator('[data-toc="method"]').boundingBox())!;
	expect(inset.x).toBeGreaterThanOrEqual(card.x);
	expect(inset.x + inset.width).toBeLessThanOrEqual((await page.locator('#method').boundingBox())!.x);
	expect(inset.height).toBeGreaterThanOrEqual(44);
	const reached = await section.evaluate((element) => {
		const { x, y, height } = element.getBoundingClientRect();
		return element.contains(document.elementFromPoint(x + 23, y + height / 2));
	});
	expect(reached).toBe(true);
	const linked = (await page.locator('[data-toc="method"] .section-title').boundingBox())!;
	const plain = (await page.locator('[data-toc="method-plain"] .section-title').boundingBox())!;
	expect([linked.x, linked.height]).toEqual([plain.x, plain.height]);
});

test('following a section permalink sets the fragment and leaves the section open', async ({ page }) => {
	await open(page);
	const card = page.locator('[data-toc="method"]');
	await card.locator('[data-section-trigger]').hover();
	await permalink(page, 'Link to this section: Method').click();
	await expect(page).toHaveURL(/#method$/);
	await expect(card.locator('[data-section-trigger]')).toHaveAttribute('aria-expanded', 'true');
});

test('reduced motion keeps a permalink still; otherwise it slides in', async ({ page }) => {
	await open(page);
	const link = permalink(page, 'Link to this section: Safety first');
	await expect(link).toHaveCSS('transform', 'none');
	await expect(link).toHaveCSS('transition-property', 'opacity');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await expect(link).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -4, 0)');
});

test('article-body.css sets the reading sizes at each width, the measure and scrolling tables', async ({ page }) => {
	await open(page);
	const desktop = page.viewportSize()!.width >= 1024;
	const body = page.getByTestId('article-body');
	await expect(body.locator('p').first()).toHaveCSS('font-size', desktop ? '20px' : '19px');
	await expect(body.locator('pre')).toHaveCSS('font-size', desktop ? '17px' : '16px');
	await expect(page.locator('.reading-support p')).toHaveCSS('font-size', '18px');
	await expect(body.locator('table')).toHaveCSS('display', 'block');
	const measure = await body.evaluate((element) => {
		const probe = element.appendChild(document.createElement('div'));
		probe.style.width = '70ch';
		const limit = probe.getBoundingClientRect().width;
		probe.remove();
		return { limit, actual: element.getBoundingClientRect().width };
	});
	expect(measure.actual).toBeLessThanOrEqual(measure.limit + 0.5);
});

test('light theme alone fills inline code with the muted surface and the strong edge colour @theme', async ({ page }, testInfo) => {
	await open(page);
	await expect(page.locator('html')).toHaveAttribute('data-theme', testInfo.project.name);
	const colors = await page.getByTestId('article-body').locator('p code').evaluate((element) => {
		const probe = document.body.appendChild(document.createElement('div'));
		probe.style.cssText = 'background: var(--muted); border-top: 1px solid var(--border-strong)';
		const expected = getComputedStyle(probe);
		const actual = getComputedStyle(element);
		const result = {
			actual: [actual.backgroundColor, actual.borderTopColor],
			light: [expected.backgroundColor, expected.borderTopColor],
		};
		probe.remove();
		return result;
	});
	if (testInfo.project.name === 'light') expect(colors.actual).toEqual(colors.light);
	else expect(colors.actual[0]).toBe('rgba(0, 0, 0, 0)');
});
