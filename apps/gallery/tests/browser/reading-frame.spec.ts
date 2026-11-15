import { expect, test, type Page } from '@playwright/test';

const LANGS = ['en', 'fr', 'es'] as const;

async function open(page: Page, lang: string, theme = 'dark'): Promise<void> {
	await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
	await page.goto(`/reading-frame/${lang}`);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

/** Characters per rendered line of a paragraph, averaged over its full lines. */
async function charactersPerLine(page: Page): Promise<number> {
	return page.locator('[data-slot="reading-frame-body"] p').first().evaluate((paragraph) => {
		const text = paragraph.firstChild as Text;
		const range = document.createRange();
		const lines = new Map<number, number>();
		for (let index = 0; index < text.length; index += 1) {
			range.setStart(text, index);
			range.setEnd(text, index + 1);
			const top = Math.round(range.getBoundingClientRect().top);
			lines.set(top, (lines.get(top) ?? 0) + 1);
		}
		const counts = [...lines.values()].slice(0, -1);
		return counts.reduce((sum, count) => sum + count, 0) / counts.length;
	});
}

test('section ids match across languages and every contents link reaches its section', async ({ page }) => {
	const idsByLang: Record<string, string[]> = {};
	for (const lang of LANGS) {
		await open(page, lang);
		const links = page.locator('[data-slot="reading-frame-contents"] a');
		const hrefs = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute('href')!));
		const headings = await page
			.locator('[data-slot="reading-frame-body"] h2[id]')
			.evaluateAll((elements) => elements.map((element) => `#${element.id}`));
		expect(hrefs).toEqual(headings);
		idsByLang[lang] = hrefs;
		await links.last().click();
		await expect(page).toHaveURL(new RegExp(`${hrefs.at(-1)}$`));
		const top = await page.locator(hrefs.at(-1)!).evaluate((element) => element.getBoundingClientRect().top);
		expect(top).toBeGreaterThanOrEqual(0);
	}
	expect(idsByLang.fr).toEqual(idsByLang.en);
	expect(idsByLang.es).toEqual(idsByLang.en);
});

for (const lang of LANGS) {
	test(`the ${lang} frame is calm: Inter title in sentence case, the real date, no decoration`, async ({ page }) => {
		await open(page, lang);
		const title = page.locator('[data-slot="reading-frame"] h1');
		await expect(title).toHaveCSS('text-transform', 'none');
		expect(await title.evaluate((element) => getComputedStyle(element).fontFamily)).toMatch(/Inter/);
		await expect(page.locator('[data-slot="reading-frame-updated"] time')).toHaveAttribute('datetime', '2026-11-02');
		const contentsName = await page.locator('nav[data-slot="reading-frame-contents"]').evaluate((element) =>
			document.getElementById(element.getAttribute('aria-labelledby')!)?.textContent,
		);
		expect(contentsName).toBeTruthy();
		const frame = page.locator('[data-slot="reading-frame"]');
		expect(await frame.evaluate((element) => getComputedStyle(element).boxShadow)).toBe('none');
		expect(await frame.locator('.font-mono, .label-station, [class*="hazard"]').count()).toBe(0);
		await expect(page.locator('[data-slot="reading-frame-contents"] a').first()).toHaveCSS('text-decoration-line', 'underline');
	});
}

for (const lang of LANGS) {
	test(`the ${lang} contents are an unnumbered list of 44px link targets at 390px`, async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await open(page, lang);
		const list = page.locator('[data-slot="reading-frame-contents"] ul');
		await expect(list).toHaveAttribute('role', 'list');
		for (const item of await list.locator('li').all()) {
			await expect(item).toHaveCSS('list-style-type', 'none');
			expect(await item.evaluate((element) => getComputedStyle(element, '::marker').content)).not.toMatch(/\d/);
		}
		const links = await list.locator('a').all();
		expect(links.length).toBe(4);
		for (const link of links) {
			await expect(link).toHaveCSS('text-decoration-line', 'underline');
			await expect(link).toHaveCSS('color', await link.evaluate(() => {
				const probe = document.createElement('span');
				probe.style.color = 'var(--primary)';
				document.body.append(probe);
				const color = getComputedStyle(probe).color;
				probe.remove();
				return color;
			}));
			await link.scrollIntoViewIfNeeded();
			const box = (await link.boundingBox())!;
			expect(box.width, await link.textContent() ?? '').toBeGreaterThanOrEqual(44);
			expect(box.height, await link.textContent() ?? '').toBeGreaterThanOrEqual(44);
			// The whole box is the link's hit area: its corners and centre resolve to the link.
			const hits = await link.evaluate((element) => {
				const rect = element.getBoundingClientRect();
				const points = [
					[rect.left + 1, rect.top + 1],
					[rect.right - 1, rect.bottom - 1],
					[rect.left + rect.width / 2, rect.top + rect.height / 2],
				];
				return points.map(([x, y]) => element.contains(document.elementFromPoint(x, y)));
			});
			expect(hits).toEqual([true, true, true]);
		}
	});
}

for (const width of [1024, 1440]) {
	test(`the measure holds about 65 to 70 characters at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await open(page, 'en');
		const perLine = await charactersPerLine(page);
		expect(perLine).toBeGreaterThanOrEqual(60);
		expect(perLine).toBeLessThanOrEqual(75);
	});
}

for (const theme of ['dark', 'light']) {
	for (const width of [320, 390, 768, 1024, 1440]) {
		test(`reading frames fit ${width}px in ${theme} with reduced motion and long FR and ES copy`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			for (const lang of LANGS) {
				await open(page, lang, theme);
				await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
				expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), lang).toBe(true);
				await expect(page.locator('[data-slot="reading-frame"] h1')).toBeVisible();
				const body = (await page.locator('[data-slot="reading-frame-body"]').boundingBox())!;
				expect(body.x).toBeGreaterThanOrEqual(0);
				expect(body.x + body.width).toBeLessThanOrEqual(width);
			}
		});
	}
}
