import { expect, test, type Locator } from '@playwright/test';
import { openGallery } from './gallery.js';

const week = 'Previous seven complete reporting days';

async function wrappedLines(label: Locator) {
	return label.evaluate(node => {
		const range = document.createRange();
		range.selectNodeContents(node);
		return range.getClientRects().length;
	});
}

test('select-only combobox opens by touch or click and supports keyboard selection', async ({ page }, testInfo) => {
	await openGallery(page);
	const demo = page.locator('[data-gallery-demo="combobox-select-only"]');
	const trigger = demo.getByRole('combobox', { name: 'Reporting period' });
	const listbox = page.getByRole('listbox', { name: 'Reporting period' });
	const weekOption = listbox.getByRole('option', { name: new RegExp(week) });
	await expect(demo.locator('input')).toHaveCount(0);
	await expect(trigger).toContainText('Choose a period');
	await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
	if (testInfo.project.use.hasTouch) await trigger.getByText('Choose a period').tap();
	else await trigger.getByText('Choose a period').click();
	await expect(listbox).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(trigger).toHaveAttribute('aria-controls', (await listbox.getAttribute('id'))!);
	if (testInfo.project.use.hasTouch) await weekOption.tap();
	else await weekOption.click();
	await expect(listbox).toBeHidden();
	await expect(trigger).toContainText(week);
	await expect(trigger).toBeFocused();

	for (const key of ['Enter', 'Space', 'ArrowDown', 'ArrowUp']) {
		await page.keyboard.press(key);
		await expect(weekOption).toHaveAttribute('data-highlighted', '');
		await page.keyboard.press('ArrowUp');
		const today = listbox.getByRole('option', { name: 'Today' });
		await expect(today).toHaveAttribute('data-highlighted', '');
		await expect(trigger).toHaveAttribute('aria-activedescendant', (await today.getAttribute('id'))!);
		await page.keyboard.press('Escape');
		await expect(listbox).toBeHidden();
		await expect(trigger).toBeFocused();
		await expect(trigger).toContainText(week);
	}

	await page.keyboard.press('Enter');
	await expect(weekOption).toHaveAttribute('data-highlighted', '');
	await page.keyboard.press('Enter');
	await expect(listbox).toBeHidden();
	await expect(trigger).toContainText(week);
	await page.keyboard.press('ArrowDown');
	await expect(weekOption).toHaveAttribute('data-highlighted', '');
	await page.keyboard.press('ArrowDown');
	await expect(listbox.getByRole('option', { name: 'Previous calendar month' })).toHaveAttribute('data-highlighted', '');
	await page.keyboard.press('Space');
	await expect(listbox).toBeHidden();
	await expect(trigger).toBeFocused();
	await expect(trigger).toContainText('Previous calendar month');
});

test('select-only labels wrap at 200% and the list follows a fixed trigger', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await openGallery(page);
	await page.locator('html').evaluate(node => { node.style.fontSize = '200%'; });
	const demo = page.locator('[data-gallery-demo="combobox-select-only"]');
	await demo.evaluate(node => {
		const headerBottom = document.querySelector('header')!.getBoundingClientRect().bottom;
		// Give the fixture the phone width minus its gutters, even if other Gallery cards widen the layout viewport.
		Object.assign(node.style, { position: 'fixed', top: `${headerBottom + 16}px`, left: '20px', width: '350px' });
	});
	const trigger = demo.getByRole('combobox', { name: 'Reporting period' });
	const listbox = page.getByRole('listbox', { name: 'Reporting period' });
	const weekOption = listbox.getByRole('option', { name: new RegExp(week) });
	await trigger.click();
	await expect.poll(() => wrappedLines(weekOption.getByText(week, { exact: true }))).toBeGreaterThan(1);
	await weekOption.click();
	await expect.poll(() => wrappedLines(trigger.getByText(week, { exact: true }))).toBeGreaterThan(1);
	await trigger.click();
	await expect(listbox).toBeVisible();
	const placement = (scroll = 0) => listbox.evaluate((node, scroll) => {
		if (scroll) window.scrollBy({ top: scroll, behavior: 'instant' });
		const anchor = document.querySelector('[data-gallery-demo="combobox-select-only"] [role="combobox"]')!.getBoundingClientRect();
		const popup = node.getBoundingClientRect();
		const gap = popup.bottom <= anchor.top ? anchor.top - popup.bottom : popup.top - anchor.bottom;
		return { gap, scrollY };
	}, scroll);
	await expect.poll(async () => (await placement()).gap).toBeCloseTo(6, 0);
	const before = await placement();
	const after = await placement(700);
	expect(after.scrollY).toBe(before.scrollY + 700);
	expect(after.gap).toBeCloseTo(6, 0);
	for (const control of [trigger, listbox]) {
		await expect.poll(() => control.evaluate(node => {
			const { left, right } = node.getBoundingClientRect();
			return Math.max(-left, right - 390, node.scrollWidth - node.clientWidth);
		}), `horizontal overflow of ${await control.getAttribute('role')}`).toBeLessThanOrEqual(1);
	}
});

test('typeahead opens the select-only list without committing until confirmed', async ({ page }) => {
	await openGallery(page);
	const demo = page.locator('[data-gallery-demo="combobox-select-only"]');
	const trigger = demo.getByRole('combobox', { name: 'Reporting period' });
	const listbox = page.getByRole('listbox', { name: 'Reporting period' });
	const weekOption = listbox.getByRole('option', { name: new RegExp(week) });
	await trigger.press('Enter');
	await listbox.getByRole('option', { name: 'Today', exact: true }).click();
	await expect(demo).toHaveAttribute('data-value', 'today');
	await expect(demo).toHaveAttribute('data-value-changes', '1');

	await trigger.press('p');
	await expect(listbox).toBeVisible();
	await expect(weekOption).toHaveAttribute('data-highlighted', '');
	await expect(trigger).toHaveAttribute('aria-activedescendant', (await weekOption.getAttribute('id'))!);
	await expect(demo).toHaveAttribute('data-value', 'today');
	await expect(demo).toHaveAttribute('data-value-changes', '1');
	await trigger.press('Escape');
	await expect(listbox).toBeHidden();
	await expect(trigger).toBeFocused();
	await expect(demo).toHaveAttribute('data-value', 'today');
	await expect(demo).toHaveAttribute('data-value-changes', '1');

	await trigger.press('p');
	await expect(weekOption).toHaveAttribute('data-highlighted', '');
	await trigger.press('Space');
	await expect(listbox).toBeHidden();
	await expect(demo).toHaveAttribute('data-value', 'last-week');
	await expect(demo).toHaveAttribute('data-value-changes', '2');
});

test('only interactive form validation focuses the select-only trigger', async ({ page }) => {
	await openGallery(page);
	const demo = page.locator('[data-gallery-demo="combobox-select-only"]');
	const trigger = demo.getByRole('combobox', { name: 'Reporting period' });
	const submit = demo.getByRole('button', { name: 'Apply period' });
	const nativeSelect = demo.locator('select[name="period"]');
	await submit.focus();
	await expect(submit).toBeFocused();
	expect(await nativeSelect.evaluate((select: HTMLSelectElement) => select.checkValidity())).toBe(false);
	await expect(submit).toBeFocused();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	await submit.press('Enter');
	await expect(trigger).toBeFocused();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

for (const keys of [['p', 'l'], ['p', 'p']] as const) {
	test(`select-only typeahead matches the glyph-prefixed label with ${keys.join(' then ')}`, async ({ page }) => {
		await openGallery(page);
		const trigger = page.getByRole('combobox', { name: 'Fruit' });
		const listbox = page.getByRole('listbox', { name: 'Fruit' });
		const plum = listbox.getByRole('option', { name: 'Plum', exact: true });
		await trigger.press(keys[0]);
		await page.keyboard.press(keys[1]);
		await expect(plum).toHaveAttribute('data-highlighted', '');
		await expect(plum).toHaveAttribute('aria-selected', 'false');
		await expect(trigger).toContainText('Choose a fruit');
		await page.keyboard.press('Enter');
		await expect(listbox).toBeHidden();
		await expect(trigger).toContainText('Plum');
	});
}

test('composing keys and modified Space keep the select-only selection intact', async ({ page }) => {
	await openGallery(page);
	const demo = page.locator('[data-gallery-demo="combobox-select-only"]');
	const trigger = demo.getByRole('combobox', { name: 'Reporting period' });
	const listbox = page.getByRole('listbox', { name: 'Reporting period' });
	await trigger.focus();
	for (const modifiers of [{ isComposing: true }, { keyCode: 229 }]) {
		await trigger.dispatchEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...modifiers });
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	}
	await trigger.press('Control+Space');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	await trigger.press('p');
	const option = listbox.getByRole('option', { name: new RegExp(week) });
	await expect(option).toHaveAttribute('data-highlighted', '');
	await trigger.dispatchEvent('keydown', { key: ' ', isComposing: true, bubbles: true, cancelable: true });
	await expect(listbox).toBeVisible();
	await trigger.press('Control+Space');
	await expect(listbox).toBeVisible();
	await expect(option).toHaveAttribute('data-highlighted', '');
	await expect(demo).toHaveAttribute('data-value-changes', '0');
	await expect(trigger).toContainText('Choose a period');

	await trigger.press('Alt+ArrowUp');
	await expect(listbox).toBeHidden();
	await trigger.press('Space');
	await expect(listbox).toBeVisible();
});

test('an overflowing hint leaves caret keys to an input and still scrolls from a button', async ({ page }) => {
	await openGallery(page);
	const input = page.getByRole('textbox', { name: 'Service name' });
	const button = page.getByRole('button', { name: 'Service alerts' });
	const tooltip = page.getByRole('tooltip');
	const measure = () => tooltip.evaluate(node => node.scrollTop);
	const makeOverflow = async () => {
		await expect(tooltip).toBeVisible();
		await tooltip.evaluate(node => Object.assign(node.style, { width: '200px', maxBlockSize: '32px' }));
		expect(await tooltip.evaluate(node => node.scrollHeight)).toBeGreaterThan(32);
	};
	const selection = () => input.evaluate((node: HTMLInputElement) => [node.selectionStart, node.selectionEnd]);
	const middle = () => input.evaluate((node: HTMLInputElement) => node.setSelectionRange(4, 4));
	const keys = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
	await input.focus();
	await makeOverflow();
	await page.keyboard.type('Central service');
	await page.keyboard.press('Escape');
	await expect(tooltip).toBeHidden();
	const baseline = [];
	for (const key of keys) {
		await middle();
		await page.keyboard.press(key);
		baseline.push(await selection());
	}
	await button.focus();
	await input.focus();
	await makeOverflow();
	for (const [index, key] of keys.entries()) {
		await middle();
		await page.keyboard.press(key);
		expect(await selection()).toEqual(baseline[index]);
		expect(await measure()).toBe(0);
	}
	await page.keyboard.press('Escape');
	await expect(input).toBeFocused();
	await expect(tooltip).toBeHidden();

	await button.focus();
	await makeOverflow();
	await page.keyboard.press('ArrowDown');
	await expect.poll(measure).toBeGreaterThan(0);
	await page.keyboard.press('Home');
	await expect.poll(measure).toBe(0);
});
