import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { expectBeside, expectStacked, rowsGeometry } from './rows-layout.js';

test.describe('D1 responsive record parts', { tag: '@theme' }, () => {
	test('half-width cards keep a sentence beside the answer only when there is room', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/d1-record');
		await page.evaluate(() => document.fonts.ready);
		const cards = page.getByTestId('d1-record').locator('.answer-example');
		const setContentWidth = (width: number) => cards.evaluateAll((elements, px) => {
			for (const element of elements as HTMLElement[]) {
				element.style.inlineSize = `min(100%, calc(${px}px + 2rem + 4px))`;
			}
		}, width);
		const examples = [
			{ name: 'des arrêts prévus ont été desservis à l’heure.', figure: '.answer-value' },
			{ name: 'Les données du dimanche restent inconnues.', figure: '.answer-absent' },
		];
		await setContentWidth(416);
		for (const { name, figure } of examples) {
			const region = page.getByRole('region', { name });
			const bounds = (await region.boundingBox())!;
			const left = (await region.locator(figure).boundingBox())!;
			const sentence = (await region.getByText(name, { exact: true }).boundingBox())!;
			expect(bounds.width).toBeCloseTo(416, 0);
			expect(left.x + left.width).toBeLessThan(sentence.x);
			expect(sentence.y).toBeLessThan(left.y + left.height);
			expect(sentence.width).toBeGreaterThanOrEqual(192);
			expect(left.width).toBeLessThanOrEqual(bounds.width * 0.55);
		}

		await setContentWidth(604);
		const absent = page.getByRole('region', { name: examples[1].name });
		const absentWidth = (await absent.locator(examples[1].figure).boundingBox())!.width;
		expect(absentWidth).toBeLessThanOrEqual((await absent.boundingBox())!.width * 0.55);

		await page.setViewportSize({ width: 1280, height: 900 });
		for (const [width, textSize] of [[396, 100], [416, 200]] as const) {
			await page.evaluate((size) => { document.documentElement.style.fontSize = `${size}%`; }, textSize);
			await setContentWidth(width);
			for (const { name, figure } of examples) {
				const region = page.getByRole('region', { name });
				const above = (await region.locator(figure).boundingBox())!;
				const sentence = (await region.getByText(name, { exact: true }).boundingBox())!;
				expect((await region.boundingBox())!.width).toBeCloseTo(width, 0);
				expect(sentence.x).toBe(above.x);
				expect(sentence.y).toBeGreaterThan(above.y + above.height);
			}
		}
		await expectNoHorizontalOverflow(page);
		await expectAccessible(page, { include: '[data-testid="d1-record"]' });
	});

	test('each answer region reads its figure, or what stands in for it, once and before the sentence', async ({ page }) => {
		await page.goto('/d1-record');
		const regions = page.getByTestId('d1-record').locator('[data-slot="answer-lead"]');
		await expect(regions).toHaveCount(5);
		await expect(regions.and(page.locator('[data-layout="fit"]'))).toHaveCount(2);
		for (const region of await regions.all()) {
			const figure = (await region.locator('.answer-value, .answer-absent').innerText()).trim();
			const sentence = await region.locator('.answer-sentence').innerText();
			await expect(region).toHaveAccessibleName(`${figure} ${sentence}`);
			await expect(region.getByText(figure, { exact: true })).toHaveCount(1);
		}
		const tree = async (name: string) => page.getByRole('region', { name, exact: true }).ariaSnapshot();
		expect(await tree('0 trajet annulé dans le secteur du Lac.')).toBe([
			'- region "0 trajet annulé dans le secteur du Lac.":',
			'  - paragraph: "0"',
			'  - paragraph: trajet annulé dans le secteur du Lac.',
		].join('\n'));
		const absent = 'Aucun signalement ne permet de confirmer le service livré ce jour-là.';
		expect(await tree(`${absent} Les données du dimanche restent inconnues.`)).toBe([
			`- region "${absent} Les données du dimanche restent inconnues.":`,
			`  - paragraph: ${absent}`,
			'  - paragraph: Les données du dimanche restent inconnues.',
		].join('\n'));
		await expectAccessible(page, { include: '[data-testid="d1-record"]' });
	});

	test('the fit layout keeps a short figure beside its sentence and breaks a long range between numbers', async ({ page }) => {
		await page.goto('/d1-record');
		await page.evaluate(() => document.fonts.ready);
		const scope = page.getByTestId('answer-fit');
		const short = scope.getByRole('region', { name: 'des correspondances ont été manquées cette semaine.' });
		const long = scope.getByRole('region', { name: 'validations de titres par mois sur le réseau.' });
		for (const width of [320, 396]) {
			await page.setViewportSize({ width, height: 900 });
			await expect(short).toHaveAttribute('data-layout', 'fit');
			const figure = (await short.locator('.answer-value').boundingBox())!;
			const sentence = (await short.locator('.answer-sentence').boundingBox())!;
			expect(figure.x + figure.width, `${width}px`).toBeLessThan(sentence.x);
			expect(sentence.y, `${width}px`).toBeLessThan(figure.y + figure.height);

			// Each number is one Range line box; the whole range wraps between them.
			const lines = await long.locator('.metric-value').evaluate((value) => {
				const text = value.firstChild as Text;
				const range = document.createRange();
				const count = (start: number, end: number) => {
					range.setStart(text, start);
					range.setEnd(text, end);
					return range.getClientRects().length;
				};
				let offset = 0;
				const numbers = text.data.split(' – ').map((token) => {
					const start = text.data.indexOf(token, offset);
					offset = start + token.length;
					return count(start, offset);
				});
				return { whole: count(0, text.data.length), numbers };
			});
			expect(lines.whole, `${width}px`).toBeGreaterThan(1);
			expect(lines.numbers, `${width}px`).toEqual([1, 1]);
			const range = (await long.locator('.answer-value').boundingBox())!;
			expect((await long.locator('.answer-sentence').boundingBox())!.y).toBeGreaterThanOrEqual(range.y + range.height);
		}
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		for (const width of [320, 396]) {
			await page.setViewportSize({ width, height: 900 });
			await expectNoHorizontalOverflow(page, ['[data-testid="answer-fit"] :is(.answer-value, .answer-sentence)']);
		}
	});

	test('sector rows keep the value beside the name at 14.75rem and stack it below at 200% text', async ({ page }) => {
		const table = page.getByRole('table', { name: 'Résultats par secteur' });
		for (const width of [320, 390]) {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/d1-record');
			await page.locator('html[data-gallery-ready]').waitFor();
			await page.evaluate(() => document.fonts.ready);
			const beside = await rowsGeometry(table);
			expect(beside.frameRem, `${width}px and 100% text`).toBeGreaterThan(14);
			beside.rows.forEach((row, index) => expectBeside(row, 8, `${width}px and 100% text, row ${index + 1}`));
			await page.locator('html').evaluate((html) => { html.style.fontSize = '200%'; });
			const stacked = await rowsGeometry(table);
			stacked.rows.forEach((row, index) => expectStacked(row, `${width}px and 200% text, row ${index + 1}`));
			await expectNoHorizontalOverflow(page);
		}
	});

	test('short day figures and stacked table pairs stay on the same row at 200% text', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 900 });
		await page.goto('/d1-record');
		await page.addStyleTag({ content: 'html { font-size: 200%; }' });
		const days = page.getByRole('list', { name: 'Relevé sur deux jours' }).getByRole('listitem');
		const first = (await days.nth(0).boundingBox())!;
		const second = (await days.nth(1).boundingBox())!;
		expect(first.y).toBe(second.y);
		expect(first.x).toBeLessThan(second.x);

		const table = page.getByRole('table', { name: 'Détails des signalements' });
		const cell = table.getByRole('cell', { name: '31' });
		const label = (await cell.locator('.data-table-stack-label').boundingBox())!;
		const value = (await cell.locator('.data-table-cell-content').boundingBox())!;
		expect(label.y).toBe(value.y);
		expect(label.x + label.width).toBeLessThan(value.x);
		await expectNoHorizontalOverflow(page);
	});

	for (const [width, textSize] of [[320, 100], [320, 200], [390, 200], [1440, 100], [1440, 200]]) {
		test(`${width}px and ${textSize}% text`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/d1-record');
			await page.addStyleTag({ content: `html { font-size: ${textSize}%; }` });
			const scope = page.getByTestId('d1-record');
			await expect(scope.getByRole('region', { name: 'Les données du dimanche restent inconnues.' })).toContainText('Aucun signalement');
			await expect(scope.getByRole('region', { name: 'trajet annulé dans le secteur du Lac.' })).toContainText('0');
			await expect(scope.locator('[data-slot="stamp"][data-late="true"]')).toHaveText('En direct · interrompu depuis 14 h');
			const figures = scope.getByRole('list', { name: 'Signalements par jour' }).locator('.day-strip-value');
			await expect(figures).toHaveCount(6);
			const lineCounts = await figures.evaluateAll((values) => values.map((value) => {
				const range = document.createRange();
				range.selectNodeContents(value);
				return range.getClientRects().length;
			}));
			expect(lineCounts).toEqual(Array(6).fill(1));
			const download = scope.getByRole('link', { name: 'Télécharger les signalements d’arrivées' });
			const buttonBox = (await download.boundingBox())!;
			const cardBox = (await download.locator('..').boundingBox())!;
			expect(buttonBox.height).toBeGreaterThanOrEqual(44);
			expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
			await expectNoHorizontalOverflow(page);
			await expectAccessible(page, { include: '[data-testid="d1-record"]' });
		});
	}
});

test('a compact table sorts and pages by keyboard, including the final row', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 900 });
	await page.goto('/d1-record');
	await page.locator('html[data-gallery-ready]').waitFor();
	const table = page.getByRole('table', { name: 'Résultats par secteur' });
	const card = table.locator('xpath=../..');
	const header = table.getByRole('columnheader', { name: 'Part à l’heure' });
	await header.getByRole('button').press('Enter');
	await expect(header).toHaveAttribute('aria-sort', 'ascending');
	await expect(table.locator('tbody tr')).toHaveCount(2);
	await expect(table.getByRole('rowheader').first().getByRole('link')).toHaveText('Carrefour');
	await card.getByRole('button', { name: 'Afficher 2 de plus' }).press('Enter');
	await expect(table.locator('tbody tr').nth(2)).toBeFocused();
	await expect(card.getByRole('status')).toHaveText('4 sur 5');
	await card.getByRole('button', { name: 'Afficher 1 de plus' }).press('Enter');
	await expect(table.locator('tbody tr').last()).toBeFocused();
	await expect(card.getByRole('status')).toHaveText('5 sur 5');
	await expect(card.getByRole('button', { name: /Afficher/ })).toHaveCount(0);
	await header.getByRole('button').press('Enter');
	await expect(header).toHaveAttribute('aria-sort', 'descending');
	await expect(table.locator('tbody tr')).toHaveCount(2);
	await expect(table.getByRole('rowheader').first().getByRole('link')).toHaveText('Rivière');
});

test('live stamp updates from the shared clock without a live announcement', async ({ page }) => {
	await page.goto('/d1-record');
	await page.locator('html[data-gallery-ready]').waitFor();
	await page.getByRole('button', { name: 'Actualiser l’heure' }).click();
	const stamp = page.locator('[data-slot="stamp"][data-kind="live"][data-late="false"]');
	await expect(stamp).toHaveText(/En direct · il y a \d+ s/);
	await expect(stamp).not.toHaveAttribute('aria-live');
});
