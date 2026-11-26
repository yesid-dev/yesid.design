import { expect, test, type Locator } from '@playwright/test';

function placement(listbox: Locator, scrollTop?: number) {
	return listbox.evaluate((list, scrollTop) => {
		if (scrollTop !== undefined) window.scrollTo({ top: scrollTop, behavior: 'instant' });
		const input = document.querySelector('[role="combobox"]')!.getBoundingClientRect();
		const rect = list.getBoundingClientRect();
		const above = rect.bottom <= input.top;
		return {
			scrollY,
			above,
			gap: above ? input.top - rect.bottom : rect.top - input.bottom,
			top: rect.top,
			bottom: rect.bottom,
			height: innerHeight,
		};
	}, scrollTop);
}

for (const fixed of [true, false]) {
	for (const openWith of ['pointer', 'keyboard'] as const) {
		test(`combobox stays anchored in ${fixed ? 'a fixed panel' : 'normal flow'} when opened by ${openWith}`, async ({
			page,
		}) => {
			const flipped = openWith === 'keyboard';
			await page.goto('/combobox');
			await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
			const panel = page.getByTestId('combobox-panel');
			const input = panel.getByRole('combobox', { name: 'Measure' });
			const listbox = page.getByRole('listbox', { name: 'Measure' });
			await panel.evaluate((element, { fixed, flipped }) => {
				document.documentElement.style.scrollPaddingBlockEnd = '80px';
				element.toggleAttribute('data-fixed', fixed);
				element.toggleAttribute('data-flipped', flipped);
				const rect = element.getBoundingClientRect();
				const top = flipped ? innerHeight - rect.height : 132;
				window.scrollTo({ top: fixed ? 100 : rect.top - top, behavior: 'instant' });
			}, { fixed, flipped });
			if (openWith === 'keyboard') {
				await input.evaluate((element) => element.focus({ preventScroll: true }));
			}
			const initialScroll = await page.evaluate(() => scrollY);
			expect(initialScroll).toBeGreaterThan(0);
			await expect(panel).toHaveCSS('position', fixed ? 'fixed' : 'static');

			if (openWith === 'pointer') {
				await panel.getByRole('button', { name: 'Measure' }).click();
			} else {
				await input.press('ArrowDown');
			}
			await expect(listbox).toBeVisible();
			await expect.poll(async () => (await placement(listbox)).gap).toBeCloseTo(6, 0);
			const opened = await placement(listbox);
			expect(opened.scrollY, 'opening preserves document scroll').toBe(initialScroll);
			expect(opened.above).toBe(flipped);
			expect(opened.top).toBeGreaterThanOrEqual(-1);
			expect(opened.bottom).toBeLessThanOrEqual(opened.height + 1);

			if (fixed) {
				// Read in the same frame as the scroll, before floating-ui can reposition an absolute list.
				const duringScroll = await placement(listbox, opened.scrollY + 100);
				expect(duringScroll.scrollY).toBe(opened.scrollY + 100);
				expect(duringScroll.above).toBe(flipped);
				expect(duringScroll.gap, 'the list stays attached during document scroll').toBeCloseTo(6, 0);
			}

			const scrollBeforeSelection = opened.scrollY + (fixed ? 100 : 0);
			const optionName = flipped ? 'Measure 12' : 'Measure 1';
			const option = listbox.getByRole('option', { name: optionName, exact: true });
			if (openWith === 'keyboard') {
				const first = listbox.getByRole('option', { name: 'Measure 1', exact: true });
				await expect(first).toHaveAttribute('data-highlighted', '');
				const options = await listbox.getByRole('option').count();
				for (let index = 1; index < options; index++) await input.press('ArrowDown');
				await expect(option).toHaveAttribute('data-highlighted', '');
				await expect.poll(() => listbox.evaluate((list) =>
					list.scrollTop + list.querySelector('[role="presentation"]')!.scrollTop,
				)).toBeGreaterThan(0);
				expect(await page.evaluate(() => scrollY), 'keyboard highlighting preserves document scroll').toBe(scrollBeforeSelection);
			}

			const edgeCrossings = await page.evaluate(() =>
				[...document.querySelectorAll('body *')].flatMap((element) => {
					const { width, left, right } = element.getBoundingClientRect();
					const outside = left < -1 || right > document.documentElement.clientWidth + 1;
					const visible = element.checkVisibility({ opacityProperty: true, visibilityProperty: true });
					return width > 1 && outside && visible ? [element.outerHTML.slice(0, 120)] : [];
				}),
			);
			expect(edgeCrossings).toEqual([]);
			// A hit at the visible option proves the portal paints above the overlapping panel.
			await expect.poll(() => option.evaluate((item) => {
				const { x, y, width, height } = item.getBoundingClientRect();
				return item.contains(document.elementFromPoint(x + width / 2, y + height / 2));
			})).toBe(true);
			await option.click();
			await expect(input).toHaveValue(optionName);
			await expect(listbox).toBeHidden();
			expect(await page.evaluate(() => scrollY), 'selection preserves document scroll').toBe(scrollBeforeSelection);
		});
	}
}
