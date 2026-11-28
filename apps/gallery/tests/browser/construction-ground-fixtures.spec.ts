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

/** Puts the ground line just above the viewport's lower edge, past the end of the reveal. */
async function showGround(page: Page) {
	// The end of the page finishes the reveal, so the floor stops growing before it is positioned.
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
	await frames(page);
	await floor(page).evaluate((element) => {
		window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight + 20);
	});
	await frames(page);
}

function boxes(page: Page) {
	return page.evaluate(() => {
		const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON() as DOMRect;
		return {
			beam: rect('[data-testid="ground-beam"]'),
			floor: rect('[data-slot="construction-ground-floor"]'),
			viewport: window.innerHeight,
		};
	});
}

/**
 * The first and last rows of a viewport region that `target` paints, found by comparing the pixels
 * with it shown and hidden. Rows count from the region's top; null means it paints nothing there.
 */
async function paintedRows(
	page: Page,
	target: string,
	clip: { x: number; y: number; width: number; height: number },
) {
	const shown = (await page.screenshot({ clip })).toString('base64');
	const hide = await page.addStyleTag({ content: `${target}{visibility:hidden!important}` });
	const hidden = (await page.screenshot({ clip })).toString('base64');
	await hide.evaluate((node) => (node as HTMLStyleElement).remove());
	return page.evaluate(
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
			let first: number | null = null;
			let last: number | null = null;
			for (let index = 0; index < a!.data.length; index += 4) {
				if ([0, 1, 2].some((channel) => a!.data[index + channel] !== b!.data[index + channel])) {
					const row = Math.floor(index / 4 / a!.width);
					first ??= row;
					last = row;
				}
			}
			return first === null ? null : { first, last: last! };
		},
		[shown, hidden],
	);
}

/** How much of the beam's height is painted when its whole box is inside the viewport. */
async function paintedBeam(page: Page) {
	const { beam: box, floor: ground, viewport } = await boxes(page);
	expect(box.top, 'the whole beam is in the viewport').toBeGreaterThanOrEqual(0);
	expect(box.bottom).toBeLessThanOrEqual(viewport);
	const y = Math.floor(box.top);
	const rows = await paintedRows(page, '[data-testid="ground-beam"]', {
		x: Math.floor(box.left),
		y,
		width: Math.floor(box.width),
		height: Math.ceil(box.bottom) - y,
	});
	return {
		full: box.height,
		visible: rows ? box.bottom - (y + rows.first) : 0,
		aboveGroundLine: ground.bottom - box.top,
		groundHeight: ground.height,
	};
}

test.beforeEach(async ({ page }, info) => {
	test.skip(info.project.name !== 'desktop', 'these tests set their own viewports');
	// The Gallery runs with reduced motion unless a test asks for the scroll-linked reveal.
	await page.emulateMedia({ reducedMotion: 'no-preference' });
});

for (const { width, height, ground, beamTop } of SIZES) {
	test(`a revealed ground shows the whole beam above it at ${width}px`, async ({ page }, info) => {
		await page.setViewportSize({ width, height });
		await open(page);
		await showGround(page);
		await expect(page.locator('[data-slot="construction-props"]')).toHaveAttribute('data-state', 'visible');

		const measured = await paintedBeam(page);
		await info.attach('beam', { body: JSON.stringify({ width, ...measured }), contentType: 'application/json' });
		expect(measured.groundHeight).toBeCloseTo(ground, 0);
		expect(measured.aboveGroundLine).toBeCloseTo(beamTop, 0);
		expect(measured.full).toBeGreaterThan(ground);
		expect(measured.visible, `visible ${measured.visible} of ${measured.full}px`).toBeGreaterThanOrEqual(
			measured.full - 1,
		);
		await expect(floor(page)).toHaveCSS('overflow-x', 'clip');
		await expectNoHorizontalOverflow(page);
	});

	for (const progress of [0.1, 0.5]) {
		test(`no fixture pixel shows above the ground at ${progress * 100}% of the reveal, ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			await open(page);
			await revealTo(page, progress);
			// Draw the fixtures at full strength, so this measures the clip and not their own ramps.
			await page.addStyleTag({
				content: '[data-testid="ground-beam"]{opacity:1!important}[data-testid="ground-lamp"]{translate:none!important}',
			});

			const { beam: box, floor: groundBox, viewport } = await boxes(page);
			expect(groundBox.height / ground).toBeCloseTo(progress, 1);
			const top = Math.max(0, Math.floor(box.top));
			const bottom = Math.min(viewport, Math.floor(groundBox.top));
			// The unclipped beam would be on screen here, above the ground.
			expect(bottom - top, 'beam area above the ground and in view').toBeGreaterThan(100);

			const rows = await paintedRows(page, '[data-slot="construction-ground-fixtures"]', {
				x: Math.floor(box.left),
				y: top,
				width: Math.floor(box.width),
				height: bottom - top,
			});
			expect(rows).toBeNull();
		});
	}
}

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

	await showGround(page);
	expect(await read()).toEqual({ progress: 1, beam: 1, lamp: 0 });
	await expect(floor(page)).toHaveCSS('overflow-y', 'visible');

	// Scrolling back clips the fixtures to the ground again.
	await page.evaluate(() => window.scrollTo(0, 0));
	await expect(floor(page)).toHaveCSS('overflow-y', 'clip');
	await expect.poll(async () => (await read()).progress).toBe(0);
});

test('opening the ground from the keyboard reveals the fixtures with it', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);
	await expect(floor(page)).toHaveCSS('overflow-y', 'clip');
	await page.keyboard.press('End');
	await expect(floor(page)).toHaveAttribute('data-opened', 'true');
	await expect(floor(page)).toHaveCSS('overflow-y', 'visible');
	await expect(beam(page)).toHaveCSS('opacity', '1');
});

test('reduced motion shows the whole beam and a finished reveal before any scrolling reaches it', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.setViewportSize({ width: 1440, height: 900 });
	await open(page);

	// At the top of the page the reveal marker has not been reached.
	await expect(floor(page)).toHaveCSS('overflow-y', 'visible');
	await expect(fixtures(page)).toHaveCSS('--ground-progress', '1');
	await expect(beam(page)).toHaveCSS('opacity', '1');

	await showGround(page);
	const measured = await paintedBeam(page);
	expect(measured.visible).toBeGreaterThanOrEqual(measured.full - 1);
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
		await expect(floor(page)).toHaveCSS('overflow-y', 'visible');
		await expect(fixtures(page)).toHaveCSS('--ground-progress', '1');
		await beam(page).scrollIntoViewIfNeeded();
		await expect(beam(page)).toHaveCSS('opacity', '1');
	} finally {
		await context.close();
	}
});
