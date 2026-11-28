import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { firstPaintedRow } from './construction-ground-pixels';

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

/** Scrolls one ground height from where the collapsed floor reaches the viewport. */
async function revealTo(page: Page, progress: number) {
	await floor(page).evaluate((element, share) => {
		const stage = element.querySelector('[data-slot="construction-ground-stage"]')!;
		const y = window.scrollY + element.getBoundingClientRect().top - window.innerHeight;
		window.scrollTo(0, Math.ceil(y + stage.getBoundingClientRect().height * share));
	}, progress);
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
		for (const target of [0.8, 0.85, 0.95, 1, 0.85]) {
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

		for (const target of [0.8, 0.9, 1]) {
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

/** A ground shorter than the moving props, which the Gallery's own heights never are. */
const SHORT_GROUND = 60;

const shortenGround = (page: Page) =>
	page.addStyleTag({
		content: `[data-testid="construction-ground-host"]{--construction-ground-height:${SHORT_GROUND}px!important}`,
	});

/** The first page row the moving props paint above the ground's top, with the fixtures hidden. */
async function propsAboveGround(page: Page) {
	await page.locator('[data-slot="construction-ground-fixtures"]').evaluate((element: HTMLElement) => {
		element.style.visibility = 'hidden';
	});
	const now = await layout(page);
	const width = await page.evaluate(() => document.documentElement.clientWidth);
	const top = Math.floor(now.floor.top);
	const above = await firstPaintedRow(page, '[data-slot="construction-props"]', { x: 0, y: top - 300, width, height: 300 });
	// The same comparison inside the ground finds the props, so an empty result above it means something.
	const inside = await firstPaintedRow(page, '[data-slot="construction-props"]', {
		x: 0,
		y: Math.ceil(now.floor.top),
		width,
		height: Math.max(1, Math.floor(now.floor.height)),
	});
	return { progress: now.progress, above: above === null ? 0 : top - above, inside };
}

for (const size of SIZES) {
	for (const short of [false, true]) {
		const name = short ? `a ${SHORT_GROUND}px ground, shorter than its props` : 'the Gallery ground';
		test(`only fixtures use the headroom: props stay below the top of ${name}, ${size.width}px`, async ({ page }) => {
			await page.setViewportSize({ width: size.width, height: size.height });
			await open(page);
			if (short) await shortenGround(page);

			for (const target of [0.1, 0.5, 0.85, 0.95, 1]) {
				await revealTo(page, target);
				const { progress, above, inside } = await propsAboveGround(page);
				expect(above, `props paint ${above}px above the ground at progress ${progress}`).toBe(0);
				if (target >= 0.5) expect(inside, `props show inside the ground at ${progress}`).not.toBeNull();
			}
		});
	}
}

test('under reduced motion the props stay below the top of a ground shorter than them', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	await shortenGround(page);

	const { above, inside } = await propsAboveGround(page);
	expect(above, `props paint ${above}px above the ground`).toBe(0);
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await frames(page);
	const reached = await propsAboveGround(page);
	expect(reached.above, `props paint ${reached.above}px above the ground once reached`).toBe(0);
	expect(reached.inside ?? inside, 'props show inside the ground').not.toBeNull();
});

test('nothing shows higher than the declared headroom, and none above the ground without one', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	await revealTo(page, 1);

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

	await revealTo(page, 1);
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

	// At the top of the page the floor is still below the viewport.
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
