import { expect, test, type Locator } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const ladderSelector = '[data-slot="stop-ladder"]';
const labelSelector = '.column-stop, .column-value, .threshold-label, .stop-name, .code, .highlight-label, .reading';

function measureWords(labels: Locator) {
	return labels.evaluateAll((elements) => elements.flatMap((element) => {
		const text = element.firstChild as Text;
		const range = document.createRange();
		const column = element.getBoundingClientRect();
		const viewportWidth = document.documentElement.clientWidth;
		const probe = document.createElement('span');
		probe.style.cssText = 'position: absolute; visibility: hidden; white-space: nowrap;';
		element.append(probe);
		const words = Array.from(text.data.matchAll(/\S+/g), (match) => {
			range.setStart(text, match.index);
			range.setEnd(text, match.index + match[0].length);
			const fragments = Array.from(range.getClientRects());
			probe.textContent = match[0];
			return {
				word: match[0],
				label: text.data,
				fits: probe.getBoundingClientRect().width <= column.width + 0.5,
				broken: fragments.length > 1,
				outside: fragments.some(({ left, right }) => left < Math.max(0, column.left) - 0.5
					|| right > Math.min(viewportWidth, column.right) + 0.5),
			};
		});
		probe.remove();
		return words;
	}));
}

test.describe('Switch, Stamp and StopLadder', { tag: '@theme' }, () => {
	for (const { width, textSize } of [
		{ width: 390, textSize: 100 },
		{ width: 390, textSize: 200 },
		{ width: 1440, textSize: 100 },
	]) {
		test(`service updates and stop labels at ${width}px and ${textSize}% text`, async ({ page }, testInfo) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/live-controls');
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			await expect(page.locator('html')).toHaveAttribute('data-theme', testInfo.project.name);
			await page.addStyleTag({ content: `html { font-size: ${textSize}%; }` });
			await page.evaluate(() => document.fonts.ready);

			const control = page.getByRole('switch', { name: 'Pause live updates' });
			const stamp = page.locator('[data-slot="stamp"]');
			const bounds = (await control.boundingBox())!;
			expect(bounds.width).toBeGreaterThanOrEqual(44);
			expect(bounds.height).toBeGreaterThanOrEqual(44);
			await expect(control).toHaveAttribute('aria-checked', 'false');
			await expect(control.getByText('Live', { exact: true })).toBeVisible();
			await expect(stamp.locator('.stamp-mark')).toBeVisible();

			await page.getByRole('button', { name: 'toggle theme' }).focus();
			await page.keyboard.press('Tab');
			await expect(control).toBeFocused();
			await expect(control).toHaveCSS('outline-style', 'solid');
			await expect(control).toHaveCSS('outline-width', '2px');
			await page.keyboard.press('Space');
			await expect(control).toHaveAttribute('aria-checked', 'true');
			await expect(control.getByText('Paused', { exact: true })).toBeVisible();
			await expect(stamp).toHaveText('Paused · last updated at 2 p.m.');
			const pauseMark = stamp.locator('.stamp-pause');
			await expect(pauseMark).toBeVisible();
			await expect(pauseMark).toHaveCSS('border-inline-start-style', 'solid');
			await expect(pauseMark).toHaveCSS('border-inline-end-style', 'solid');
			await expect(stamp.locator('.stamp-mark')).toHaveCount(0);
			await expectAccessible(page);
			await page.keyboard.press('Enter');
			await expect(control).toHaveAccessibleName('Pause live updates');
			await expect(control).toHaveAttribute('aria-checked', 'false');
			await expect(stamp).toHaveText('Live · last updated at 2 p.m.');

			const ladder = page.locator(ladderSelector);
			const labels = ladder.locator(labelSelector);
			const words = await measureWords(labels);
			expect(words.filter(({ broken, outside }) => broken || outside)).toEqual([]);
			await expectNoHorizontalOverflow(page, [ladderSelector]);

			// A word wider than the whole ladder must still fit inside the viewport in either column.
			const oversized = 'Uninterrupted'.repeat(30);
			for (const selector of ['.stop-name', '.reading']) {
				const label = ladder.locator(selector).first();
				await label.evaluate((node, text) => { node.textContent = text; }, oversized);
				const [word] = await measureWords(label);
				expect(word).toMatchObject({ fits: false, broken: true, outside: false });
			}
			await expectNoHorizontalOverflow(page, [ladderSelector]);
		});
	}

	for (const width of [320, 390]) {
		test(`oversized stop labels stay inside the ladder at ${width}px and 200% text`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/live-controls');
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			await page.addStyleTag({ content: 'html { font-size: 200%; }' });
			await page.evaluate(() => document.fonts.ready);

			const ladder = page.locator(ladderSelector);
			for (const label of await ladder.locator(labelSelector).all()) {
				const original = await label.textContent();
				await label.evaluate((node) => { node.textContent = 'Uninterrupted'.repeat(30); });
				const [word] = await measureWords(label);
				expect(word).toMatchObject({ fits: false, broken: true, outside: false });
				const overflowing = await ladder.evaluate((node) => {
					const { left, right } = node.getBoundingClientRect();
					const viewportWidth = document.documentElement.clientWidth;
					return [...node.querySelectorAll('*')].filter((descendant) => {
						const bounds = descendant.getBoundingClientRect();
						return bounds.left < Math.max(0, left) - 1 || bounds.right > Math.min(right, viewportWidth) + 1;
					}).map((descendant) => descendant.className);
				});
				expect(overflowing, `${original} overflows the ladder`).toEqual([]);
				await expectNoHorizontalOverflow(page, [ladderSelector]);
				await label.evaluate((node, text) => { node.textContent = text; }, original);
			}
		});
	}

	test('the switch and pause mark stay visible in forced colors', async ({ page }) => {
		await page.emulateMedia({ forcedColors: 'active' });
		await page.goto('/live-controls');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		const control = page.getByRole('switch', { name: 'Pause live updates' });
		await control.press('Space');
		await expect(control).toHaveAttribute('aria-checked', 'true');
		await expect(control).toHaveCSS('outline-style', 'solid');
		await expect(control.getByText('Paused', { exact: true })).toBeVisible();
		await expect(page.locator('.stamp-pause')).toHaveCSS('border-inline-start-width', '2px');
	});
});
