import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

const floor = (page: Page) => page.locator('[data-slot="construction-ground-floor"]');
const fixtures = (page: Page) => page.locator('[data-slot="construction-ground-fixtures"]');
const beam = (page: Page) => page.getByTestId('ground-beam');

/** The Gallery beam's top above the ground line, and the ground height, at each width. */
const SIZES = [
	{ width: 390, height: 844, ground: 100, beamTop: 330 },
	{ width: 1024, height: 768, ground: 240, beamTop: 364 },
	{ width: 1440, height: 900, ground: 240, beamTop: 430 },
] as const;

const frames = (page: Page) =>
	page.evaluate(
		() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
	);

async function open(page: Page) {
	await page.goto('/construction-ground/en');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
	await page.evaluate(() => document.fonts.ready);
}

/** Scrolls so the internal marker sits where the reveal has reached `progress`. */
async function revealTo(page: Page, progress: number) {
	await page.locator('[data-slot="construction-ground-anchor"]').evaluate((anchor, share) => {
		window.scrollBy(0, anchor.getBoundingClientRect().top - window.innerHeight * share);
	}, 0.95 - 0.25 * progress);
	await frames(page);
}

/** The ground and beam in page coordinates, with the current reveal. */
function layout(page: Page) {
	return page.evaluate(() => {
		const box = (element: Element) => {
			const { top, bottom, left, width, height } = element.getBoundingClientRect();
			return { top: top + window.scrollY, bottom: bottom + window.scrollY, left, width, height };
		};
		const ground = document.querySelector<HTMLElement>('[data-slot="construction-ground-floor"]')!;
		const host = document.querySelector('[data-testid="construction-ground-host"]')!;
		return {
			progress: Number(ground.style.getPropertyValue('--ground-progress')),
			floor: box(ground),
			beam: box(document.querySelector('[data-testid="ground-beam"]')!),
			above: box(host.previousElementSibling!),
		};
	});
}

/**
 * The first page row `target` paints in a band of the whole page, found by comparing the pixels with
 * it shown and hidden; null when it paints nothing there. The band may lie outside the viewport.
 */
async function firstPaintedRow(
	page: Page,
	target: string,
	band: { x: number; y: number; width: number; height: number },
) {
	const picture = async () => (await page.screenshot({ fullPage: true, clip: band })).toString('base64');
	// Inline styles, because an added style tag never reports loading when JavaScript is off.
	const show = (visible: boolean) =>
		page.locator(target).evaluate((element: HTMLElement | SVGElement, on) => {
			element.style.visibility = on ? '' : 'hidden';
		}, visible);
	const shown = await picture();
	await show(false);
	const hidden = await picture();
	await show(true);
	const row = await page.evaluate(
		async (pictures) => {
			const [a, b] = await Promise.all(
				pictures.map(async (data) => {
					const image = new Image();
					image.src = `data:image/png;base64,${data}`;
					await image.decode();
					const canvas = document.createElement('canvas');
					canvas.width = image.width;
					canvas.height = image.height;
					const context = canvas.getContext('2d')!;
					context.drawImage(image, 0, 0);
					return context.getImageData(0, 0, image.width, image.height);
				}),
			);
			for (let index = 0; index < a!.data.length; index += 4) {
				if ([0, 1, 2].some((channel) => a!.data[index + channel] !== b!.data[index + channel])) {
					return Math.floor(index / 4 / a!.width);
				}
			}
			return null;
		},
		[shown, hidden],
	);
	return row === null ? null : band.y + row;
}

/** How far above the ground's top the beam is painted, in px, looking well past its full height. */
async function paintedAboveGround(page: Page) {
	const before = await layout(page);
	const y = Math.max(0, Math.floor(before.beam.top) - 150);
	const row = await firstPaintedRow(page, '[data-testid="ground-beam"]', {
		x: Math.floor(before.beam.left),
		y,
		width: Math.floor(before.beam.width),
		height: Math.floor(before.floor.top) - y,
	});
	// A picture of the whole page must not have moved the reveal it measures.
	expect((await layout(page)).progress).toBe(before.progress);
	return {
		...before,
		painted: row === null ? 0 : Math.floor(before.floor.top) - row,
		paintedTop: row,
		/** What the beam would show above the ground if nothing clipped it. */
		extent: before.floor.bottom - before.beam.top - before.floor.height,
	};
}

/** What stands above a full ground: the beam's top above the ground line less the ground. */
const headroomOf = ({ beamTop, ground }: (typeof SIZES)[number]) => beamTop - ground;

const opening = (progress: number) => Math.max(0, Math.min(1, (progress - 0.8) / 0.2));

test.beforeEach(async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop', 'these tests set their own viewports');
	// The Gallery runs with reduced motion unless a test asks for the scroll-linked reveal.
	await page.emulateMedia({ reducedMotion: 'no-preference' });
});

for (const size of SIZES) {
	const { width, height, ground } = size;
	const headroom = headroomOf(size);

	for (const progress of [0.1, 0.5]) {
		test(`no fixture pixel shows above the ground at ${progress * 100}% of the reveal, ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			await open(page);
			await revealTo(page, progress);
			// Draw the fixtures at full strength, so this measures the clip and not their own ramps.
			await page.addStyleTag({
				content: '[data-testid="ground-beam"]{opacity:1!important}[data-testid="ground-lamp"]{translate:none!important}',
			});

			const now = await layout(page);
			expect(now.floor.height / ground).toBeCloseTo(progress, 1);
			const y = Math.floor(now.beam.top);
			const band = Math.floor(now.floor.top) - y;
			// The unclipped beam would paint here, above the ground.
			expect(band, 'beam area above the ground').toBeGreaterThan(100);
			expect(
				await firstPaintedRow(page, '[data-slot="construction-ground-fixtures"]', {
					x: Math.floor(now.beam.left),
					y,
					width: Math.floor(now.beam.width),
					height: band,
				}),
			).toBeNull();
		});
	}

	test(`the beam opens above the ground over the last fifth of the reveal at ${width}px`, async ({ page }, info) => {
		await page.setViewportSize({ width, height });
		await open(page);

		const steps: { target: number; progress: number; painted: number }[] = [];
		// Forward to the end, then back, since the opening follows scrolling both ways.
		for (const target of [0.8, 0.85, 0.95, 1.002, 0.85]) {
			await revealTo(page, target);
			const measured = await paintedAboveGround(page);
			steps.push({ target, progress: measured.progress, painted: measured.painted });
			expect(measured.floor.bottom - measured.beam.top, 'beam top above the ground line').toBeCloseTo(
				size.beamTop,
				0,
			);
			expect(
				Math.abs(measured.painted - headroom * opening(measured.progress)),
				`painted ${measured.painted}px above the ground at progress ${measured.progress}`,
			).toBeLessThanOrEqual(2);
		}
		await info.attach('opening', {
			body: JSON.stringify({ width, headroom, steps }),
			contentType: 'application/json',
		});

		const [, early, late, end, back] = steps.map((step) => step.painted);
		expect(early).toBeGreaterThan(0);
		expect(late).toBeGreaterThan(early!);
		expect(late).toBeLessThan(headroom - 1);
		expect(end).toBeGreaterThan(late!);
		expect(end).toBeGreaterThanOrEqual(headroom - 1);
		expect(Math.abs(back! - early!)).toBeLessThanOrEqual(2);
		await expect(floor(page)).toHaveCSS('overflow-x', 'clip');
		await expectNoHorizontalOverflow(page);
	});

	test(`the beam never covers what sits above the ground at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height });
		await open(page);

		for (const target of [0.8, 0.9, 1.002]) {
			await revealTo(page, target);
			const { paintedTop, above, floor: groundBox, progress } = await paintedAboveGround(page);
			expect(groundBox.top - above.bottom, 'space reserved above the ground').toBeGreaterThanOrEqual(headroom - 0.5);
			if (progress > 0.82) expect(paintedTop, `the beam shows at ${progress}`).not.toBeNull();
			// The band reaches 150px past the beam's top, well into the element above the ground.
			if (paintedTop !== null) {
				expect(paintedTop, `painted from ${paintedTop}, above ends at ${above.bottom}`).toBeGreaterThanOrEqual(
					Math.floor(above.bottom),
				);
			}
		}
	});
}

test('nothing shows higher than the declared headroom, and none above the ground without one', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	await revealTo(page, 1.002);

	for (const declared of [95, 0]) {
		await page.addStyleTag({
			content: `[data-testid="construction-ground-host"] [data-slot="construction-ground"]{--construction-ground-headroom:${declared}px}`,
		});
		const { painted, extent } = await paintedAboveGround(page);
		expect(extent).toBeGreaterThan(180);
		expect(Math.abs(painted - declared), `headroom ${declared}px paints ${painted}px`).toBeLessThanOrEqual(1);
	}
});

test('fixtures read the reveal from --ground-progress', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	const read = () =>
		fixtures(page).evaluate((element) => {
			const lamp = element.querySelector<HTMLElement>('[data-testid="ground-lamp"]')!;
			const light = element.querySelector<HTMLElement>('[data-testid="ground-beam"]')!;
			const shift = getComputedStyle(lamp).translate.split(' ')[1] ?? '0';
			return {
				progress: Number(getComputedStyle(element).getPropertyValue('--ground-progress')),
				beam: Number(getComputedStyle(light).opacity),
				// The share of its own height the lamp still sits below its place.
				lamp: shift.endsWith('%') ? Number.parseFloat(shift) / 100 : Number.parseFloat(shift) / lamp.offsetHeight,
			};
		});

	for (const target of [0.1, 0.2, 0.5]) {
		await revealTo(page, target);
		const state = await read();
		expect(state.progress).toBeCloseTo(target, 1);
		// The lamp rises over the first fifth; the beam comes on from 10% to 30%.
		expect(state.lamp).toBeCloseTo(1 - Math.min(1, state.progress / 0.2), 2);
		expect(state.beam).toBeCloseTo(Math.max(0, Math.min(1, (state.progress - 0.1) / 0.2)), 2);
	}

	await revealTo(page, 1.002);
	expect(await read()).toEqual({ progress: 1, beam: 1, lamp: 0 });
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect.poll(async () => (await read()).progress).toBe(0);
});

test('opening the ground from the keyboard shows the whole beam with it', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	expect((await paintedAboveGround(page)).painted).toBe(0);
	await page.keyboard.press('End');
	await expect(floor(page)).toHaveAttribute('data-opened', 'true');
	await expect(beam(page)).toHaveCSS('opacity', '1');
	const opened = await paintedAboveGround(page);
	expect(opened.painted).toBeGreaterThanOrEqual(opened.extent - 1);
});

test('reduced motion shows the whole beam and a finished reveal before any scrolling reaches it', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);

	// At the top of the page the reveal marker has not been reached.
	await expect(fixtures(page)).toHaveCSS('--ground-progress', '1');
	await expect(beam(page)).toHaveCSS('opacity', '1');
	const measured = await paintedAboveGround(page);
	expect(measured.floor.height).toBeCloseTo(240, 0);
	expect(measured.painted).toBeGreaterThanOrEqual(measured.extent - 1);
});

test('without JavaScript the whole beam stands above the full ground', async ({ browser, baseURL }) => {
	const context = await browser.newContext({
		baseURL,
		javaScriptEnabled: false,
		viewport: { width: 1440, height: 900 },
	});
	try {
		const page = await context.newPage();
		await page.goto('/construction-ground/en');
		await expect(fixtures(page)).toHaveCSS('--ground-progress', '1');
		await expect(beam(page)).toHaveCSS('opacity', '1');
		const measured = await paintedAboveGround(page);
		expect(measured.floor.height).toBeCloseTo(240, 0);
		expect(measured.painted).toBeGreaterThanOrEqual(measured.extent - 1);
	} finally {
		await context.close();
	}
});
