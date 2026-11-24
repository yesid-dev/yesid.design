import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const path = '/app-frame/controls-rail';

test.describe('Header network keyboard order', { tag: '@theme' }, () => {
	const copy = {
		en: { search: 'Search reports', find: 'Find', network: 'Network', theme: 'Dark theme', language: /^Language:/, menu: 'Open menu' },
		fr: { search: 'Chercher des rapports', find: 'Chercher', network: 'Réseau', theme: 'Thème sombre', language: /^Langue\s*:/, menu: 'Ouvrir le menu' },
	};
	for (const locale of ['en', 'fr'] as const) {
		for (const width of [390, 768, 1023, 1024, 1440]) {
			test(`${locale}: network is in visual Tab order at ${width}px`, async ({ page }) => {
				await page.setViewportSize({ width, height: 850 });
				await page.goto(`${path}?lang=${locale}`);
				await page.locator('html[data-gallery-ready]').waitFor();
				const label = copy[locale];
				const header = page.getByTestId('nav');
				const search = header.getByRole('searchbox', { name: label.search });
				const find = header.getByRole('link', { name: label.find, exact: true });
				const network = header.getByRole('combobox', { name: label.network });
				const theme = header.getByRole('switch', { name: label.theme });
				const language = header.getByRole('link', { name: label.language });
				const menu = header.getByRole('button', { name: label.menu });

				const desktop = width >= 1024;
				await expect(search).toBeVisible({ visible: desktop });
				const [first, ...remaining] = desktop
					? [search, network, find, theme, language, menu]
					: [find, theme, language, menu, network];
				await first.focus();
				for (const control of remaining) {
					await page.keyboard.press('Tab');
					await expect(control).toBeFocused();
				}
			});
		}
	}

	for (const fallback of [false, true]) {
		test(`resize preserves network identity, selection and focus (${fallback ? 'fallback' : 'native move'})`, async ({ page }) => {
			if (fallback) await page.addInitScript(() => {
				Object.defineProperty(Element.prototype, 'moveBefore', { value: undefined, configurable: true });
			});
			await page.setViewportSize({ width: 390, height: 850 });
			await page.goto(path);
			await page.locator('html[data-gallery-ready]').waitFor();
			const network = page.getByRole('combobox', { name: 'Network' });
			const node = await network.elementHandle();
			await network.selectOption('ott');
			await network.focus();

			for (const width of [1024, 390]) {
				await page.setViewportSize({ width, height: 850 });
				await expect.poll(() => network.evaluate((control) => {
					const menu = control.closest('nav')?.querySelector('[data-testid="nav-menu-toggle"]');
					return !!(menu && control.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING);
				})).toBe(width >= 1024);
				await expect(network).toBeFocused();
				await expect(network).toHaveValue('ott');
				expect(await network.evaluate((control, original) => control === original, node)).toBe(true);
			}
		});
	}
});

test.describe('Header network hit area and fit', { tag: '@theme' }, () => {
	for (const width of [320, 390, 1440]) {
		test(`the native select opens at all four border edges at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 850 });
			await page.goto(path);
			await page.locator('html[data-gallery-ready]').waitFor();
			const select = page.getByRole('combobox', { name: 'Network' });
			const label = select.locator('..');
			const { x, y, width: inline, height: block } = (await label.boundingBox())!;
			const edges = [
				[x + 0.5, y + block / 2],
				[x + inline - 0.5, y + block / 2],
				[x + inline / 2, y + 0.5],
				[x + inline / 2, y + block - 0.5],
			];
			for (const [edgeX, edgeY] of edges) {
				expect(await select.evaluate((element, point) =>
					document.elementFromPoint(point[0], point[1]) === element, [edgeX, edgeY])).toBe(true);
				await page.mouse.click(edgeX, edgeY);
				await expect.poll(() => select.evaluate((element) => element.matches(':open'))).toBe(true);
				await page.keyboard.press('Escape');
				await expect.poll(() => select.evaluate((element) => element.matches(':open'))).toBe(false);
			}
		});
	}

	for (const locale of ['en', 'fr'] as const) {
		for (const width of [1024, 1100, 1280]) {
			for (const refresh of [false, true]) {
				test(`${locale}: header fits at ${width}px and 200% text ${refresh ? 'with' : 'without'} Refresh`, async ({ page }) => {
					const french = locale === 'fr';
					await page.setViewportSize({ width, height: 850 });
					await page.goto(`${path}?dense&lang=${locale}${refresh ? '&refresh' : ''}`);
					await page.locator('html[data-gallery-ready]').waitFor();
					await page.addStyleTag({ content: 'html { font-size: 200%; }' });
					await page.evaluate(() => document.fonts.ready);
					const header = page.getByTestId('nav');
					const pill = header.getByTestId('nav-pill');
					const select = header.getByRole('combobox', { name: french ? 'Réseau' : 'Network' });
					const picker = select.locator('..');
					const search = header.getByRole('searchbox');
					await expect(search).toBeVisible();
					await expect.poll(async () => {
						const box = (await pill.boundingBox())!;
						return box.x >= 0 && box.x + box.width <= width;
					}).toBe(true);
					await expectNoHorizontalOverflow(page);
					const pillBox = (await pill.boundingBox())!;
					const pickerBox = (await picker.boundingBox())!;
					const below = pickerBox.y >= pillBox.y + pillBox.height;
					if (width === 1024) expect(below).toBe(true);
					if (below) {
						await expect(picker.getByText('STM', { exact: true })).toBeVisible();
						const root = page.locator('html');
						const clearance = await root.evaluate((element) =>
							getComputedStyle(element).getPropertyValue('--nav-network-clearance').trim());
						await expect(root).toHaveCSS('--nav-extra-clearance', clearance);
					}
					const trailing = [
						...(refresh ? [header.getByRole('button', { name: french ? 'Actualiser les données' : 'Refresh data' })] : []),
						header.getByRole('switch', { name: french ? 'Thème sombre' : 'Dark theme' }),
						header.getByRole('link', { name: french ? /^Langue\s*:/ : /^Language:/ }),
						header.getByRole('button', { name: french ? 'Ouvrir le menu' : 'Open menu' }),
					];
					await search.focus();
					for (const control of below ? [...trailing, select] : [select, ...trailing]) {
						await page.keyboard.press('Tab');
						await expect(control).toBeFocused();
					}
				});
			}
		}
	}
});

test.describe('Compact network labels', { tag: '@theme' }, () => {
	for (const locale of ['en', 'fr'] as const) {
		for (const width of [320, 390]) {
			test(`${locale}: keeps each picker word whole at ${width}px and 200% text`, async ({ page }) => {
				await page.setViewportSize({ width, height: 850 });
				await page.goto(`${path}?lang=${locale}&long-code`);
				await page.locator('html[data-gallery-ready]').waitFor();
				await page.addStyleTag({ content: 'html { font-size: 200%; }' });
				await page.evaluate(() => document.fonts.ready);
				const slot = page.locator('[data-slot="site-header-network"]');
				const picker = slot.getByRole('combobox');
				await picker.selectOption('ott');
				await expect(picker).toHaveValue('ott');
				const label = slot.getByText('OC Transpo', { exact: true });
				await expect(label).toBeVisible();
				const fragments = await label.evaluate((element) => {
					const node = element.firstChild;
					if (!(node instanceof Text)) throw new Error('The compact label must contain text');
					const range = document.createRange();
					return Array.from(node.data.matchAll(/\S+/gu), (word) => {
						const start = word.index!;
						range.setStart(node, start);
						range.setEnd(node, start + word[0].length);
						return [word[0], range.getClientRects().length];
					});
				});
				expect(fragments).toEqual([['OC', 1], ['Transpo', 1]]);
				const box = (await slot.boundingBox())!;
				expect(box.x).toBeGreaterThanOrEqual(0);
				expect(box.x + box.width).toBeLessThanOrEqual(width);
				await expectNoHorizontalOverflow(page);
			});
		}
	}
});

test.describe('D1 frame and network slot', { tag: '@theme' }, () => {
	for (const width of [320, 390]) {
		test(`both rails at ${width}px and 200% text`, async ({ page }) => {
			await page.setViewportSize({ width, height: 850 });
			await page.goto(path);
			await page.locator('html[data-gallery-ready]').waitFor();
			await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			const pill = page.getByTestId('nav-pill');
			const network = page.getByRole('combobox', { name: 'Network' });
			const networkPicker = network.locator('..');
			await expect(networkPicker.getByText('STM', { exact: true })).toBeVisible();
			await expect(network.locator('option:checked')).toHaveText('Montréal · STM');
			const pillBox = (await pill.boundingBox())!;
			const networkBox = (await network.boundingBox())!;
			expect(networkBox.y).toBeGreaterThanOrEqual(pillBox.y + pillBox.height);
			const controls = page.getByRole('button', { name: /Open controls/ });
			const evidence = page.getByRole('button', { name: /Open evidence/ });
			const controlsBox = (await controls.boundingBox())!;
			const evidenceBox = (await evidence.boundingBox())!;
			expect(evidenceBox.y + evidenceBox.height).toBeLessThan(controlsBox.y);
			await controls.press('Enter');
			const sheet = page.getByRole('dialog', { name: 'Controls' });
			await expect(sheet.getByRole('combobox', { name: 'Record period' })).toBeVisible();
			await expectAccessible(page);
			await sheet.getByRole('button', { name: 'Close controls' }).press('Enter');
			await expect(sheet).toBeHidden();
			await expect(controls).toBeFocused();
			await expectNoHorizontalOverflow(page);
		});
	}

	test('desktop controls are sticky and float over full viewport content', async ({ page }) => {
		await page.setViewportSize({ width: 1100, height: 820 });
		await page.goto(path);
		await page.locator('html[data-gallery-ready]').waitFor();
		const header = page.getByTestId('nav');
		const search = header.getByRole('searchbox', { name: 'Search reports' });
		const network = header.getByRole('combobox', { name: 'Network' });
		await expect(network.locator('option:checked')).toHaveText('Montréal · STM');
		const searchBox = (await search.boundingBox())!;
		const networkBox = (await network.boundingBox())!;
		expect(networkBox.x).toBeGreaterThanOrEqual(searchBox.x + searchBox.width);
		const main = page.getByRole('main', { name: 'Service workspace' });
		const rail = page.getByRole('complementary', { name: 'Controls' });
		await expect(rail).toHaveCSS('position', 'sticky');
		expect((await rail.boundingBox())!.x).toBeLessThan((await main.boundingBox())!.x);
		const headerHeight = (await header.boundingBox())!.height;
		await expect(page.getByTestId('chrome-size')).toHaveText(String(Math.ceil(headerHeight)));
		await page.getByRole('button', { name: 'Full viewport' }).click();
		await expect(rail).toHaveCSS('position', 'absolute');
		expect((await rail.boundingBox())!.x).toBeGreaterThan((await main.boundingBox())!.x);
		await expectNoHorizontalOverflow(page);
		await expectAccessible(page);
	});
});
