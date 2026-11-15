import { expect, test, type Page } from '@playwright/test';

/** One editorial header case from /article-header, measured in viewport coordinates. */
const measure = (page: Page, id: string) =>
	page.getByTestId(`case-${id}`).evaluate((section) => {
		const rect = (selector: string) => {
			const element = section.querySelector(selector);
			if (!element) return null;
			const { top, bottom, left, right, height } = element.getBoundingClientRect();
			return { top, bottom, left, right, height };
		};
		const header = section.querySelector<HTMLElement>('[data-slot="article-header"]')!;
		const probe = document.createElement('span');
		probe.style.fontSize = 'var(--text-title)';
		header.append(probe);
		const tokenSize = getComputedStyle(probe).fontSize;
		probe.remove();
		return {
			tokenSize,
			header: rect('[data-slot="article-header"]')!,
			content: rect('.header__content')!,
			back: rect('.header__back')!,
			title: rect('h1')!,
			actions: rect('[data-slot="article-header-actions"]'),
			controls: rect('[data-slot="article-header-controls"]')!,
			clipped: Math.max(
				section.querySelector('.header__content')!.getBoundingClientRect().bottom - header.getBoundingClientRect().bottom,
				section.querySelector('.header__content')!.scrollHeight - section.querySelector('.header__content')!.clientHeight,
			),
			titleOverflow: section.querySelector('h1')!.scrollWidth - section.querySelector('h1')!.clientWidth,
			titleSize: getComputedStyle(section.querySelector('h1')!).fontSize,
		};
	});

const open = async (page: Page, only: string) => {
	await page.goto(`/article-header?only=${only}`);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
};

test('the editorial header band is compact: links and Collapse all share a row, the title keeps its size', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets its own widths');
	for (const width of [390, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await open(page, 'case-study-expressive');
		const band = await measure(page, 'case-study-expressive');
		const where = `${width}px`;
		const actions = band.actions!;
		const floor = width >= 1024 ? 16 : 12;
		expect(band.back.top - band.content.top, `${where}: nothing above the back link`).toBeLessThanOrEqual(1);
		expect(band.title.top - band.back.bottom, `${where}: the title right under the back link`).toBeLessThanOrEqual(1);
		expect(actions.top - band.title.bottom, `${where}: the links right under the title`).toBeLessThanOrEqual(4 + 1);
		const lastRow = Math.max(actions.bottom, band.controls.bottom);
		expect(band.header.bottom - lastRow, `${where}: a short floor under the last row`).toBeLessThanOrEqual(floor + 1);
		if (width >= 1024) {
			expect(Math.abs(band.controls.top - actions.top), `${where}: links and Collapse all on one row`).toBeLessThanOrEqual(1);
		}
		expect(band.titleSize, `${where}: the title keeps --text-title`).toBe(band.tokenSize);
		testInfo.annotations.push({ type: 'header band height', description: `${where}: ${Math.round(band.header.height)}px` });
	}
});

test('long French and Spanish titles are never cropped by the compact band at 320px and 200% text', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets its own widths');
	const cases = ['case-study-expressive-fr', 'case-study-expressive-es', 'long-fr', 'long-es', 'case-study'];
	for (const width of [320, 390]) {
		for (const zoom of ['100%', '200%']) {
			await page.setViewportSize({ width, height: 900 });
			for (const id of cases) {
				await open(page, id);
				await page.evaluate((zoom) => { document.documentElement.style.fontSize = zoom; }, zoom);
				await page.evaluate(() => new Promise(requestAnimationFrame));
				const band = await measure(page, id);
				const where = `${id} at ${width}px, ${zoom} text`;
				expect(band.clipped, `${where}: nothing clipped below`).toBeLessThanOrEqual(1);
				expect(band.titleOverflow, `${where}: the title fits its column`).toBeLessThanOrEqual(1);
				for (const part of [band.back, band.title, band.controls, ...(band.actions ? [band.actions] : [])]) {
					expect(part.top, where).toBeGreaterThanOrEqual(band.header.top - 0.5);
					expect(part.bottom, where).toBeLessThanOrEqual(band.header.bottom + 0.5);
					expect(part.left, where).toBeGreaterThanOrEqual(-0.5);
					expect(part.right, where).toBeLessThanOrEqual(width + 0.5);
				}
			}
		}
	}
});
