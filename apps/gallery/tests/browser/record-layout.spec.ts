import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const path = (lang: string) => `/app-frame/record-parts/${lang}`;
const footerWidths = [320, 640, 768, 900, 1024, 1440] as const;
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
			await footer.evaluate((el) => { el.style.inlineSize = 'calc(100% - 15px)'; });
			expect(await footerColumns.locator(':scope > *').evaluateAll(
				(elements) => new Set(elements.map((el) => el.getBoundingClientRect().top)).size,
			)).toBe(1);
			await footer.evaluate((el) => { el.style.inlineSize = ''; });
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
				await expect(footerColumns).toHaveCSS('padding-top', '8px');
				expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
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

		test(`${lang}: compact search stays out of the open site menu`, async ({ page }) => {
			const openMenu = lang === 'fr' ? 'Ouvrir le menu' : 'Open menu';
			await page.setViewportSize({ width: 320, height: 900 });
			await page.goto(path(lang));
			await expect(page.locator('html[data-gallery-ready]')).toBeAttached();
			const trigger = page.locator('[data-slot="nav-compact-search"]');
			await expect(trigger).toBeVisible();
			await page.getByRole('button', { name: openMenu, exact: true }).press('Enter');
			await expect(page.getByRole('dialog')).toBeVisible();
			await expect(trigger).toBeHidden();
			await page.keyboard.press('Escape');
			await expect(trigger).toBeVisible();

			for (const width of [1206, 1280]) {
				await page.setViewportSize({ width, height: 900 });
				await expect(page.getByRole('searchbox', { name: c.search })).toBeVisible();
				await expect(trigger).toBeHidden();
				await page.getByRole('button', { name: openMenu, exact: true }).press('Enter');
				await expect(page.getByRole('dialog')).toBeVisible();
				await expect(trigger).toBeHidden();
				await page.keyboard.press('Escape');
				await expect(page.getByRole('dialog')).toHaveCount(0);
			}
		});

		test(`${lang}: the standalone footer keeps four or five blocks on balanced rows`, async ({ page }, info) => {
			await page.goto(path(lang));
			await expect(page.locator('html[data-gallery-ready]')).toBeAttached();
			await page.evaluate(() => document.fonts.ready);
			const footer = page.getByRole('contentinfo');
			const measurements = [];
			for (const scale of [100, 200]) {
				await page.locator('html').evaluate((html, scale) => {
					html.style.fontSize = `${scale}%`;
				}, scale);
				for (const blocks of [4, 5]) {
					await page.getByTestId('footer-group-count').selectOption(String(blocks - 1));
					await expect(footer.getByRole('navigation')).toHaveCount(blocks - 1);
					for (const width of footerWidths) {
						await page.setViewportSize({ width, height: 900 });
						const layout = await footer.evaluate((el) => {
							const rowCounts = new Map<number, number>();
							const children = el.querySelectorAll('.footer-columns > *');
							for (const child of children) {
								const row = Math.round(child.getBoundingClientRect().top);
								rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
							}
							return {
								rows: [...rowCounts.values()],
								height: Math.round(el.getBoundingClientRect().height),
							};
						});
						const rem = width / (16 * scale / 100);
						const minimum = blocks === 4 ? 34 : 39;
						expect(layout.rows, `${blocks} blocks at ${width}px and ${scale}% text`).toEqual(
							rem >= 63 ? [blocks] : rem >= minimum
								? (blocks === 4 ? [2, 2] : [3, 2])
								: Array.from({ length: blocks }, () => 1),
						);
						await expectNoHorizontalOverflow(page);
						measurements.push({ blocks, width, scale, ...layout });
					}
				}
			}
			await info.attach('footer-balance-heights', {
				body: JSON.stringify(measurements),
				contentType: 'application/json',
			});
		});

		test(`${lang}: the phone footer pairs groups when their text fits`, async ({ page }) => {
			await page.setViewportSize({ width: 390, height: 900 });
			await page.goto(path(lang));
			await expect(page.locator('html[data-gallery-ready]')).toBeAttached();
			await page.evaluate(() => document.fonts.ready);
			const footer = page.getByRole('contentinfo');
			const groups = footer.getByRole('navigation');
			const rows = () => groups.evaluateAll((elements) => {
				const counts = new Map<number, number>();
				for (const element of elements) {
					const y = Math.round(element.getBoundingClientRect().top);
					counts.set(y, (counts.get(y) ?? 0) + 1);
				}
				return [...counts.values()];
			});
			for (const count of [3, 4, 5]) {
				await page.getByTestId('footer-group-count').selectOption(String(count));
				await expect(groups).toHaveCount(count);
				for (const width of [390, 480, 639]) {
					await page.setViewportSize({ width, height: 900 });
					expect(await rows(), `${count} groups at ${width}px`).toEqual(
						count === 3 ? [2, 1] : count === 4 ? [2, 2] : [2, 2, 1],
					);
					const firstGroup = (await groups.first().boundingBox())!;
					const brand = (await footer.locator('.footer-brand').boundingBox())!;
					const lastGroup = (await groups.last().boundingBox())!;
					expect(brand.y + brand.height).toBeLessThan(firstGroup.y);
					if (count % 2) expect(lastGroup.width).toBeCloseTo(brand.width, 0);
					await expectNoHorizontalOverflow(page);
				}
			}
			await page.setViewportSize({ width: 320, height: 900 });
			expect(await rows()).toEqual([1, 1, 1, 1, 1]);
			await page.setViewportSize({ width: 390, height: 900 });
			const links = groups.getByRole('link');
			await links.first().focus();
			for (let i = 0; i < 5; i++) {
				const link = links.nth(i);
				await expect(link).toBeFocused();
				const box = (await link.boundingBox())!;
				expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
				if (i < 4) await page.keyboard.press('Tab');
			}
			await expectAccessible(page);
			const firstLabel = groups.first().locator('[data-slot="footer-group-label"]');
			const label = await firstLabel.textContent();
			await firstLabel.evaluate((element) => { element.textContent = 'Intergouvernementalisation'; });
			expect(await rows()).toEqual([1, 2, 2]);
			await expectNoHorizontalOverflow(page);
			await firstLabel.evaluate((element, text) => { element.textContent = text; }, label);
			await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			expect(await rows()).toEqual([1, 1, 1, 1, 1]);
			await page.setViewportSize({ width: 320, height: 900 });
			expect(await rows()).toEqual([1, 1, 1, 1, 1]);
			await expectNoHorizontalOverflow(page);
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

	test('the French stop ladder preserves words in the reading and header at 200% text', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto(path('fr'));
		await page.locator('html').evaluate((el) => { el.style.fontSize = '200%'; });
		await page.evaluate(() => document.fonts.ready);
		const ladder = page.locator('[data-slot="stop-ladder"]');
		await ladder.evaluate((el) => { (el as HTMLElement).style.inlineSize = '7rem'; });
		const reading = ladder.getByText('5,3 min de retard', { exact: true });
		const header = ladder.getByText('Retard médian', { exact: true });
		for (const [label, word] of [[reading, 'retard'], [header, 'médian']] as const) {
			await expect(label).toBeVisible();
			const wordRects = await label.evaluate((el, word) => {
				const text = el.firstChild!;
				const start = text.textContent!.lastIndexOf(word);
				const range = document.createRange();
				range.setStart(text, start);
				range.setEnd(text, start + word.length);
				return range.getClientRects().length;
			}, word);
			expect(wordRects).toBe(1);
		}
		const first = ladder.getByRole('listitem').first();
		const name = (await first.getByRole('link').boundingBox())!;
		const value = (await reading.boundingBox())!;
		expect(name.x + name.width).toBeLessThanOrEqual(value.x);
		await expectNoHorizontalOverflow(page);
	});

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
