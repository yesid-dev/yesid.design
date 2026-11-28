import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

test.beforeEach(({}, info) => {
	test.skip(info.project.name !== 'desktop', 'Each assertion sets its own viewport.');
});

async function open(page: Page, path: string, width: number, scale = 100) {
	await page.setViewportSize({ width, height: 900 });
	await page.goto(path);
	await page.addStyleTag({ content: `html { font-size: ${scale}%; }` });
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

async function expectFont(locator: Locator, token: '--font-body' | '--font-mono') {
	expect(await locator.evaluate((node, token) => {
		const sample = document.createElement('span');
		sample.style.fontFamily = `var(${token})`;
		node.before(sample);
		const matches = getComputedStyle(node).fontFamily === getComputedStyle(sample).fontFamily;
		sample.remove();
		return matches;
	}, token)).toBe(true);
}

for (const width of [390, 1440]) {
	test(`selected and clear-filter words use the body font at ${width}px`, async ({ page }) => {
		await open(page, '/combobox', width);
		const field = page.getByRole('combobox', { name: 'Measure' });
		await field.press('ArrowDown');
		await page.getByRole('option', { name: 'Measure 1', exact: true }).click();
		await expect(field).toHaveValue('Measure 1');
		await expectFont(field, '--font-body');

		await open(page, '/listing-frame', width);
		await expectFont(page.getByRole('button', { name: 'Effacer les filtres' }), '--font-body');
	});

	test(`footer tagline defaults to mono and follows its font override at ${width}px`, async ({ page }) => {
		const path = '/app-frame/record-parts/fr';
		const tagline = page.getByRole('contentinfo').getByText('Relevé des lignes', { exact: true });
		await open(page, path, width);
		await expectFont(tagline, '--font-mono');
		await open(page, `${path}?body-tagline`, width);
		await expectFont(tagline, '--font-body');
	});

	for (const scale of [100, 200]) {
		test(`status ink is centred on its label at ${width}px / ${scale}%`, async ({ page }) => {
			await open(page, '/map-legends', width, scale);
			const marks = page.locator('[data-slot="status-mark"]');
			expect(await marks.count()).toBeGreaterThan(0);
			const offsets = await marks.evaluateAll((elements) => elements.map((mark) => {
				const label = mark.querySelector('.status-word')!;
				const probe = document.createElement('span');
				probe.style.cssText = 'display:inline-block;width:0;height:1cap;vertical-align:baseline';
				label.prepend(probe);
				const cap = probe.getBoundingClientRect();
				const ink = mark.querySelector('svg path')!.getBoundingClientRect();
				probe.remove();
				return Math.abs((ink.top + ink.bottom - cap.top - cap.bottom) / 2);
			}));
			for (const offset of offsets) expect(offset).toBeLessThanOrEqual(1.5);
		});

		test(`chart corner labels have breathing room at ${width}px / ${scale}%`, async ({ page }) => {
			await open(page, '/chart-parts', width, scale);
			const chart = page.getByRole('figure', { name: 'On-time departures, 20 to 26 November' });
			const date = chart.locator('text').filter({ hasText: /^20 Nov$/ });
			const value = chart.locator('text').filter({ hasText: /^75%$/ });
			await expect(date).toHaveCount(1);
			await expect(value).toHaveCount(1);
			await expect.poll(async () => {
				const dateBox = (await date.boundingBox())!;
				const valueBox = (await value.boundingBox())!;
				return dateBox.y - valueBox.y - valueBox.height;
			}).toBeGreaterThanOrEqual(3 * scale / 100);
			const area = (await chart.locator('[data-slot="chart-area"]').boundingBox())!;
			const dateBox = (await date.boundingBox())!;
			expect(dateBox.x).toBeGreaterThanOrEqual(area.x - 0.5);
			expect(dateBox.y + dateBox.height).toBeLessThanOrEqual(area.y + area.height);
		});

		test(`a short live stamp stays one line in a 238px panel at ${width}px / ${scale}%`, async ({ page }) => {
			await page.clock.setFixedTime(new Date('2026-11-27T12:00:09Z'));
			await open(page, '/live-controls', width, scale);
			const stamp = page.getByRole('region', { name: 'Map data' }).locator('[data-slot="stamp"]');
			await expect(stamp).toHaveText('Live');
			const excessHeight = await stamp.evaluate((element) => {
				const { paddingTop, paddingBottom, borderTopWidth, borderBottomWidth } = getComputedStyle(element);
				const chrome = [paddingTop, paddingBottom, borderTopWidth, borderBottomWidth]
					.reduce((total, value) => total + parseFloat(value), 0);
				const visible = element.querySelector('.stamp-age > span:not([aria-hidden])')!;
				const text = document.createRange();
				text.selectNodeContents(visible);
				const line = parseFloat(getComputedStyle(visible).lineHeight);
				return element.getBoundingClientRect().height - chrome - line * text.getClientRects().length;
			});
			expect(Math.abs(excessHeight)).toBeLessThan(1);
			await expectNoHorizontalOverflow(page, ['.map-panel', '.map-panel [data-slot="stamp"]']);
		});
	}

	test(`menu focus and close rings clear the language control at ${width}px`, async ({ page }) => {
		await open(page, '/site-header-pill', width);
		const pill = page.getByTestId('nav-pill');
		const menu = pill.getByTestId('nav-menu-toggle');
		await page.keyboard.press('Tab');
		await menu.focus();
		const clearance = () => menu.evaluate((button) => {
			const language = button.closest('nav')!.querySelector('[data-testid="language-toggle"]')!;
			const { outlineStyle, outlineWidth, outlineOffset } = getComputedStyle(button);
			return (outlineStyle === 'none' ? -Infinity : button.getBoundingClientRect().left -
				language.getBoundingClientRect().right - parseFloat(outlineWidth) - parseFloat(outlineOffset));
		});
		await expect.poll(clearance).toBeGreaterThanOrEqual(3);
		await menu.press('Enter');
		await expect(menu).toHaveAttribute('aria-expanded', 'true');
		await expect(menu).toBeFocused();
		await expect.poll(clearance).toBeGreaterThanOrEqual(3);
	});

	for (const scale of [100, 200]) {
		test(`notice copy uses the full available width at ${width}px / ${scale}%`, async ({ page }) => {
			await open(page, '/record-parts', width, scale);
			const notice = page.getByRole('status', { name: 'Not published' });
			const body = notice.locator('[data-slot="state-notice-body"]');
			const action = notice.getByRole('link');
			const lines = await body.evaluate((node) => {
				const range = document.createRange();
				range.selectNodeContents(node);
				return range.getClientRects().length;
			});
			const bodyBox = (await body.boundingBox())!;
			const actionBox = (await action.boundingBox())!;
			if (width === 390) {
				expect(lines).toBeGreaterThan(1);
				expect(actionBox.y).toBeGreaterThan(bodyBox.y + bodyBox.height);
			} else {
				expect(lines).toBe(1);
				expect(actionBox.y).toBeLessThan(bodyBox.y + bodyBox.height);
			}
			await expectNoHorizontalOverflow(page);
		});
	}

	test(`AppFrame keeps the controls summary readable at ${width}px / 200%`, async ({ page }) => {
		await open(page, '/app-frame/controls-rail?long-summary', width, 200);
		const pill = page.getByRole('button', { name: 'Controls Les sept derniers jours · Open controls' });
		const evidence = page.getByRole('button', { name: /Open evidence/ });
		const summary = pill.getByText('Les sept derniers jours', { exact: true });
		await expect(summary).toBeVisible();
		expect(await summary.evaluate((node) => node.scrollWidth)).toBeLessThanOrEqual(
			await summary.evaluate((node) => node.clientWidth),
		);
		await expect.poll(async () => {
			const lower = (await pill.boundingBox())!;
			const upper = (await evidence.boundingBox())!;
			return lower.y - upper.y - upper.height;
		}).toBeGreaterThanOrEqual(7);
		await expectNoHorizontalOverflow(page, ['.surface-rail-pill', '.surface-rail-pill-copy']);
	});
}

for (const lang of ['en', 'fr']) {
	test(`${lang}: five footer groups wrap at 1024px only when the brand and links cannot fit together`, async ({ page }) => {
		const path = `/app-frame/record-parts/${lang}`;
		const footer = page.getByRole('contentinfo');
		const rows = () => footer.locator('.footer-columns').evaluate((element) => {
			const counts = new Map<number, number>();
			for (const child of element.children) {
				const top = Math.round(child.getBoundingClientRect().top);
				counts.set(top, (counts.get(top) ?? 0) + 1);
			}
			return [...counts.values()];
		});

		await open(page, path, 1024);
		await expect.poll(rows).toEqual([6]);
		await open(page, `${path}?wide-groups`, 1024);
		await expect.poll(rows).toEqual([1, 5]);
		await page.setViewportSize({ width: 1440, height: 900 });
		await expect.poll(rows).toEqual([6]);
		await page.setViewportSize({ width: 390, height: 900 });
		await expect.poll(rows).toEqual([1, 2, 2, 1]);
		await expectNoHorizontalOverflow(page);
	});
}
