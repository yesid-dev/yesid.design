import { expect, test, type Locator } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, expectTapTargets } from '@yesid/config/playwright';

const COLD_FIXTURES = ['lines', 'stops', 'vehicles', 'empty', 'loading'] as const;

async function slotOrder(host: Locator): Promise<string[]> {
	return host.locator('[data-slot="listing-body"] > [data-slot]').evaluateAll((elements) =>
		elements.map((element) => element.getAttribute('data-slot')!),
	);
}

test('regions render in order and absent regions emit no element', async ({ page }) => {
	await page.goto('/listing-body/en');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');

	expect(await slotOrder(page.getByTestId('fixture-lines'))).toEqual([
		'listing-body-header',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-sort',
		'listing-body-results',
		'listing-body-more',
	]);

	// Stops and Vehicles omit sort; no sort element is emitted.
	expect(await slotOrder(page.getByTestId('fixture-stops'))).toEqual([
		'listing-body-header',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-results',
		'listing-body-more',
	]);
	expect(await slotOrder(page.getByTestId('fixture-vehicles'))).toEqual([
		'listing-body-header',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-results',
		'listing-body-more',
	]);

	// Empty omits sort and more; Loading omits summary, status, sort and more; Minimal omits all optional slots.
	expect(await slotOrder(page.getByTestId('fixture-empty'))).toEqual([
		'listing-body-header',
		'listing-body-search',
		'listing-body-summary',
		'listing-body-result-status',
		'listing-body-results',
	]);
	expect(await slotOrder(page.getByTestId('fixture-loading'))).toEqual([
		'listing-body-header',
		'listing-body-search',
		'listing-body-results',
	]);
	expect(await slotOrder(page.getByTestId('fixture-minimal'))).toEqual([
		'listing-body-results',
	]);

	// Clearing Stops removes the summary region entirely without leaving an empty wrapper.
	const stops = page.getByTestId('fixture-stops');
	await stops.locator('[data-slot="clear-filters"]').click();
	await expect(stops.locator('[data-slot="listing-body-summary"]')).toHaveCount(0);

	// Searching Lines updates the always-present polite status and swaps breakdown for FilterSummary.
	const lines = page.getByTestId('fixture-lines');
	const status = lines.locator('[data-slot="listing-body-result-status"]');
	await expect(status).toHaveAttribute('role', 'status');
	await expect(status).toHaveText('6 lines');
	await lines.getByTestId('lines-search').fill('Beaubien');
	await expect(status).toHaveText('1 line');
	await expect(lines.locator('[data-slot="filter-summary"]')).toBeVisible();
	await lines.locator('[data-slot="clear-filters"]').click();
	await expect(status).toHaveText('6 lines');
});

for (const lang of ['en', 'fr'] as const) {
	for (const fixture of COLD_FIXTURES) {
		test(`cold load ${fixture} (${lang}) has zero layout-shift entries after first paint`, async ({ page }, info) => {
			test.skip(info.project.name === 'tablet', 'Cold-load layout-shift check runs at 390 (phone) and 1440 (desktop)');
			const width = page.viewportSize()!.width;
			await page.addInitScript(() => {
				type LayoutShift = PerformanceEntry & { value: number; hadRecentInput: boolean };
				const entries: { startTime: number; value: number }[] = [];
				(window as Window & { __listingBodyShifts?: { startTime: number; value: number }[] }).__listingBodyShifts = entries;
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries() as LayoutShift[]) {
						if (!entry.hadRecentInput) entries.push({ startTime: entry.startTime, value: entry.value });
					}
				}).observe({ type: 'layout-shift', buffered: true });
			});

			let release!: () => void;
			const held = new Promise<void>((resolve) => {
				release = resolve;
			});
			await page.route('**/_app/immutable/**/*.js', async (route) => {
				await held;
				await route.fallback();
			});

			try {
				await page.goto(`/listing-body/${lang}/${fixture}`, { waitUntil: 'commit' });
				const body = page.locator('[data-slot="listing-body"]');
				await expect(body).toBeVisible();
				await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0);
				await page.evaluate(() => document.fonts.ready);
				await expect(page.locator('html[data-gallery-ready]')).toHaveCount(0);

				const boxes = () =>
					body.locator(':scope, :scope > [data-slot]').evaluateAll((elements) =>
						elements.map((element) => {
							const { x, y, width, height } = element.getBoundingClientRect();
							return { slot: element.getAttribute('data-slot'), x, y, width, height };
						}),
					);
				const readShifts = () =>
					page.evaluate(() => [
						...((window as Window & { __listingBodyShifts?: { startTime: number; value: number }[] })
							.__listingBodyShifts ?? []),
					]);

				const before = await boxes();
				const beforeHydration = await readShifts();

				release();
				await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
				await page.evaluate(
					() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
				);

				const after = await boxes();
				const afterHydration = await readShifts();
				const hydrationShifts = afterHydration.slice(beforeHydration.length);
				const preHydrationCls = beforeHydration.reduce((sum, entry) => sum + entry.value, 0);

				await info.attach('layout-shift', {
					body: JSON.stringify({
						fixture,
						lang,
						width,
						hydrationShiftCount: hydrationShifts.length,
						hydrationShifts,
						preHydrationCls,
						beforeHydration,
					}),
					contentType: 'application/json',
				});

				expect(after, `${fixture} (${lang}) at ${width}px region geometry changed after hydration`).toEqual(before);
				expect(
					hydrationShifts,
					`${fixture} (${lang}) at ${width}px hydration layout-shift entries: ${JSON.stringify(hydrationShifts)}`,
				).toHaveLength(0);
				expect(preHydrationCls).toBeLessThan(0.001);
				await expectNoHorizontalOverflow(page);
				await expectTapTargets(page);
			} finally {
				release();
			}
		});
	}
}

test.describe('listing-body accessibility in light and dark themes', { tag: '@theme' }, () => {
	for (const lang of ['en', 'fr'] as const) {
		for (const width of [390, 1440] as const) {
			test(`/listing-body/${lang} is axe clean at ${width}px`, async ({ page }, info) => {
				await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
				await page.goto(`/listing-body/${lang}`);
				await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
				await expect(page.locator('html')).toHaveAttribute('data-theme', info.project.name);
				await page.evaluate(() => document.fonts.ready);
				await expectAccessible(page);
				await expectNoHorizontalOverflow(page);
				await expectTapTargets(page);
			});
		}
	}
});
