import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const path = (lang: string) => `/app-frame/record-parts/${lang}`;
const copy = {
	en: { details: 'Lines without measurements', onTime: 'On time', trips: 'Trips that ran', events: 'Stop events', late: 'Late',
		compact: 'Open search', search: 'Find a line, stop or vehicle', footerLink: 'Accessibility', scale: 'Late share, in percent:',
		few: 'Too few trips', none: 'No service', unmeasured: 'Unmeasured' },
	fr: { details: 'Lignes sans mesure', onTime: 'À l’heure', trips: 'Trajets effectués', events: 'Événements aux arrêts', late: 'En retard',
		compact: 'Ouvrir la recherche', search: 'Chercher une ligne, un arrêt ou un véhicule', footerLink: 'Télécharger', scale: 'Part en retard, en pourcentage :',
		few: 'Peu de trajets', none: 'Aucun service', unmeasured: 'Non mesuré' },
};

test.describe('Record parts reflow', { tag: '@theme' }, () => {
	for (const lang of ['en', 'fr'] as const) {
		const c = copy[lang];
		test(`${lang}: rows use the table width and keep sortable, labelled cells`, async ({ page }) => {
			await page.setViewportSize({ width: 390, height: 900 });
			await page.goto(path(lang));
			await expect(page.locator('html[data-gallery-ready]')).toBeAttached();
			const host = page.getByTestId('record-table');
			const table = host.getByRole('table');
			const rows = table.locator('tbody').getByRole('row');
			await expect(rows).toHaveCount(20);
			const first = rows.first();
			const primary = first.getByRole('rowheader');
			const value = first.getByRole('cell', { name: '73.2%', exact: true });
			const late = first.getByRole('cell', { name: '19%', exact: true });
			const trips = first.locator('[data-column="trips"]');
			const headersId = await table.getByRole('columnheader', { name: c.late }).getAttribute('id');
			const rowHeaderId = await primary.getAttribute('id');
			expect(headersId).toBeTruthy();
			expect(rowHeaderId).toBeTruthy();
			await expect(late).toHaveAttribute('headers', `${headersId} ${rowHeaderId}`);
			expect(await first.ariaSnapshot()).toContain('cell "19%"');
			expect(await first.ariaSnapshot()).toContain('rowheader');
			const p = (await primary.boundingBox())!;
			const v = (await value.boundingBox())!;
			const detail = (await late.boundingBox())!;
			expect(p.width).toBeGreaterThan(v.width);
			expect(p.x + p.width).toBeLessThan(v.x);
			expect(detail.y).toBeGreaterThan(v.y);
			const tripsBox = (await trips.boundingBox())!;
			if (lang === 'en') expect(tripsBox.y).toBeCloseTo(detail.y, 0);
			else expect(tripsBox.y).toBeGreaterThanOrEqual(detail.y);
			expect(tripsBox.x + tripsBox.width).toBeLessThanOrEqual(p.x + p.width + v.width + 8);
			await expect(trips.getByText(c.trips, { exact: true })).toBeVisible();
			await expect(trips.getByText(c.trips, { exact: true })).toHaveCSS('text-transform', 'none');
			const noValue = page.getByRole('table', { name: c.details }).getByRole('rowheader');
			expect((await noValue.boundingBox())!.width).toBeGreaterThan(p.width);

			const buttons = table.locator('thead').getByRole('button');
			const boxes = await Promise.all((await buttons.all()).map((button) => button.boundingBox()));
			expect(boxes).toHaveLength(4);
			expect(new Set(boxes.map((box) => box!.y)).size).toBeLessThan(4);
			for (const box of boxes) expect(box!.height).toBeGreaterThanOrEqual(44);
			await buttons.first().focus();
			await page.keyboard.press('Tab');
			await expect(buttons.nth(1)).toBeFocused();
			await page.keyboard.press('Enter');
			await expect(table.getByRole('columnheader', { name: c.onTime })).toHaveAttribute('aria-sort', 'ascending');
			await expect(buttons.nth(1)).toBeFocused();

			await page.setViewportSize({ width: 1280, height: 900 });
			await expect(table).toHaveCSS('display', 'block');
			await host.evaluate((el) => { (el as HTMLElement).style.inlineSize = '100%'; });
			await expect(table).toHaveCSS('display', 'table');
			const sorted = table.getByRole('columnheader', { name: c.onTime });
			const plain = table.getByRole('columnheader', { name: c.events });
			await expect(sorted).toHaveCSS('vertical-align', 'middle');
			await expect(plain).toHaveCSS('vertical-align', 'middle');
			await expect(plain).toHaveCSS('text-transform', 'none');
			await expect(sorted.getByRole('button')).toHaveCSS('text-transform', 'none');
			await expect(sorted.getByRole('button')).toHaveCSS('font-family', await plain.evaluate((el) => getComputedStyle(el).fontFamily));

			await page.setViewportSize({ width: 320, height: 900 });
			await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			await expect(table).toHaveCSS('display', 'block');
			await expect(table.getByRole('columnheader', { name: c.onTime })).toHaveCSS('word-break', 'normal');
			await expectNoHorizontalOverflow(page);
			await expectAccessible(page);
			await page.emulateMedia({ forcedColors: 'active' });
			await expect(table.getByRole('columnheader', { name: c.onTime })).toHaveAttribute('aria-sort', 'ascending');
			await expect(first.getByRole('rowheader').getByRole('link')).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});

		test(`${lang}: text scaling chooses compact search and wraps footer columns`, async ({ page }) => {
			await page.setViewportSize({ width: 1440, height: 900 });
			await page.goto(path(lang));
			await expect(page.locator('html[data-gallery-ready]')).toBeAttached();
			await expect(page.getByRole('searchbox', { name: c.search })).toBeVisible();
			await expect(page.getByRole('button', { name: c.compact })).toHaveCount(0);
			const footer = page.getByRole('contentinfo');
			const groups = footer.getByRole('navigation');
			await expect(groups).toHaveCount(5);
			const footerColumns = footer.locator('.footer-columns');
			await page.setViewportSize({ width: 1024, height: 900 });
			await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute('data-rail-layout', 'paired');
			const desktopRows = await footerColumns.locator(':scope > *').evaluateAll(
				(elements) => new Set(elements.map((el) => el.getBoundingClientRect().top)).size,
			);
			expect(desktopRows).toBe(1);
			const desktopColumns = await groups.evaluateAll((elements) => new Set(elements.map((el) => el.getBoundingClientRect().x)).size);
			await page.setViewportSize({ width: 320, height: 900 });
			await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute('data-rail-layout', 'compact');
			await expect(footerColumns).toHaveCSS('padding-top', '16px');
			await expect(footerColumns).toHaveCSS('padding-bottom', lang === 'fr' ? '8px' : '16px');
			await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			for (const width of [1440, 1280, 1024]) {
				await page.setViewportSize({ width, height: 900 });
				await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute('data-rail-layout', 'compact');
				await expect(page.getByRole('button', { name: c.compact })).toBeVisible();
				await expect(page.getByRole('searchbox', { name: c.search })).toHaveCount(0);
				const columns = await groups.evaluateAll((elements) => new Set(elements.map((el) => el.getBoundingClientRect().x)).size);
				expect(columns).toBeLessThan(desktopColumns);
				const link = footer.getByRole('link', { name: c.footerLink });
				expect(await link.evaluate((el) => {
					const range = document.createRange();
					range.selectNodeContents(el);
					return range.getClientRects().length;
				})).toBe(1);
				await expectNoHorizontalOverflow(page);
			}
			const button = page.getByRole('button', { name: c.compact });
			await button.press('Enter');
			await expect(button).toHaveAttribute('aria-expanded', 'true');
			await expect(page.getByRole('main').getByRole('searchbox', { name: c.search })).toBeVisible();
			await expectAccessible(page);
		});

		test(`${lang}: HourGrid keys distinguish the rendered states in forced colors`, async ({ page }) => {
			await page.goto(path(lang));
			const mixed = page.getByTestId('mixed-hour-grid');
			const legend = mixed.getByRole('list', { name: c.scale });
			await expect(mixed.getByText(c.scale, { exact: true })).toBeVisible();
			const filtered = page.getByTestId('measured-hour-grid').getByRole('list', { name: c.scale });
			for (const name of [c.few, c.none, c.unmeasured]) {
				await expect(legend.getByText(name, { exact: true })).toBeVisible();
				await expect(filtered.getByText(name, { exact: true })).toHaveCount(0);
			}
			const noUnmeasured = page.getByTestId('no-unmeasured-hour-grid').getByRole('list', { name: c.scale });
			await expect(noUnmeasured.getByText(c.few, { exact: true })).toBeVisible();
			await expect(noUnmeasured.getByText(c.none, { exact: true })).toHaveCount(0);
			await expect(noUnmeasured.getByText(c.unmeasured, { exact: true })).toHaveCount(0);
			const noneOnly = page.getByTestId('none-only-hour-grid').getByRole('list', { name: c.scale });
			await expect(noneOnly.getByText(c.none, { exact: true })).toBeVisible();
			await expect(noneOnly.getByText(c.few, { exact: true })).toHaveCount(0);
			await expect(noneOnly.getByText(c.unmeasured, { exact: true })).toHaveCount(0);
			for (const forcedColors of ['none', 'active'] as const) {
				await page.emulateMedia({ forcedColors });
				for (const marker of await mixed.locator('[data-state="few"]').all()) {
					await expect(marker).not.toHaveCSS('background-image', 'none');
					await expect(marker).toHaveCSS('border-top-style', 'solid');
				}
				for (const marker of await mixed.locator('[data-state="none"]').all()) {
					await expect(marker).toHaveCSS('background-image', 'none');
					await expect(marker).toHaveCSS('border-top-style', 'solid');
				}
				for (const marker of await mixed.locator('[data-state="unmeasured"]').all()) {
					await expect(marker).toHaveCSS('border-top-style', 'dashed');
				}
			}
		});
	}

	test('the answer range and linked ladder occupy one line at wide width', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(path('en'));
		await page.evaluate(() => document.fonts.ready);
		const answers = page.getByTestId('answer-part');
		const answer = answers.locator('[data-slot="answer-lead"] .metric-value');
		await expect(answer).toHaveCSS('font-size', '46px');
		await expect(answer).toHaveCSS('font-weight', '800');
		await expect(answers.locator('[data-slot="metric-display"] .metric-value')).toHaveCSS('font-size', '34px');
		expect(await answer.evaluate((el) => {
			const range = document.createRange();
			range.selectNodeContents(el);
			return range.getClientRects().length;
		})).toBe(1);
		const absent = page.getByTestId('absent-answer');
		expect(await absent.evaluate((el) => {
			const figure = el.querySelector('.answer-absent')!;
			return figure.getBoundingClientRect().width / figure.parentElement!.getBoundingClientRect().width;
		})).toBeLessThanOrEqual(0.56);

		const ladder = page.getByRole('list', { name: 'Stops in travel order' });
		const first = ladder.getByRole('listitem').first();
		const link = first.getByRole('link', { name: 'Gare Montréal-Ouest' });
		await expect(link).toHaveCSS('text-decoration-line', 'underline');
		const code = first.getByText('50110');
		const value = first.getByText('0.2 min');
		await expect(value).toHaveCSS('font-weight', '700');
		const linkBox = (await link.boundingBox())!;
		const codeBox = (await code.boundingBox())!;
		expect(linkBox.height).toBeGreaterThanOrEqual(44);
		expect((await first.boundingBox())!.height).toBeCloseTo(44, 0);
		expect(codeBox.x).toBeGreaterThan(linkBox.x + linkBox.width);
		expect(codeBox.y).toBeLessThan(linkBox.y + linkBox.height);
		await expect(page.getByText('Late from 5 min')).toBeVisible();
		const threshold = await ladder.evaluate((el) => {
			const line = getComputedStyle(el, '::after');
			return { position: line.position, width: line.borderInlineStartWidth, start: line.insetBlockStart, end: line.insetBlockEnd };
		});
		expect(threshold).toEqual({ position: 'absolute', width: '1px', start: '0px', end: '0px' });
		await expect(ladder.getByText('Delay widens here')).toHaveCount(1);
		const timing = ladder.locator('[data-timing-point="true"] .point');
		const ordinary = ladder.locator('li:not([data-timing-point]) .point').first();
		expect((await timing.boundingBox())!.width).toBeGreaterThan((await ordinary.boundingBox())!.width);
		await link.focus();
		await expect(link).toBeFocused();

		await page.setViewportSize({ width: 390, height: 900 });
		await expect(answer).toHaveCSS('font-size', '36px');
		expect((await first.locator('.track').boundingBox())!.y).toBeGreaterThan((await link.boundingBox())!.y);
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		await expect(answers.locator('.answer-statement').first()).toHaveCSS('display', 'grid');
		await expectNoHorizontalOverflow(page);
		await page.emulateMedia({ forcedColors: 'active' });
		await expect(link).toHaveCSS('text-decoration-line', 'underline');
		await expect(ladder.locator('[data-highlighted]').first()).toHaveCSS('outline-style', 'dashed');
	});
});
