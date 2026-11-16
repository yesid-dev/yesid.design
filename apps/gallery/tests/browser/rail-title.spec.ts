import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';
import { RAIL_COPY, RAIL_LANGS, type RailLang } from '../../src/lib/gallery/rail-title-fixture.js';

const WIDTHS = [320, 390, 768, 1023, 1024, 1280, 1440, 1920];
const DESKTOP_MIN_WIDTH = 1024;
const FLOOR_PX = 12;

async function ready(page: Page) {
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

async function open(page: Page, lang: RailLang, query = '') {
	await page.goto(`/rail-title/${lang}${query}`);
	await ready(page);
	// Reopening the same page can restore the previous scroll position; start from the top.
	await scrollTo(page, 0);
}

interface Box {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

interface TitleState {
	id: string;
	side: string;
	writing: string;
	fit: string | null;
	fontSize: number;
	section: Box;
	/** The text as painted: the glyph box of every character, dot included, less any clipped part. */
	painted: Box | null;
	/** The first and last cards: the content the title must never cover. */
	content: Box[];
}

interface Snapshot {
	pill: Box | null;
	/** The scrollport the sticky titles follow, and the clearance line under which they hold. */
	port: Box;
	viewport: { width: number; height: number };
	sections: TitleState[];
}

/** Every section's title, painted text and content, with the header pill, in viewport coordinates. */
const snapshot = (page: Page) =>
	page.evaluate((): Snapshot => {
		const box = (element: Element): Box => {
			const { top, bottom, left, right } = element.getBoundingClientRect();
			return { top, bottom, left, right };
		};
		const scroller = document.querySelector<HTMLElement>('[data-testid="rail-scroller"][style*="overflow"]');
		const port = scroller
			? { ...box(scroller), top: box(scroller).top + scroller.clientTop, bottom: box(scroller).top + scroller.clientTop + scroller.clientHeight }
			: { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
		const pill = document.querySelector('[data-testid="nav-pill"]');
		return {
			pill: pill ? box(pill) : null,
			port,
			viewport: { width: innerWidth, height: innerHeight },
			sections: [...document.querySelectorAll<HTMLElement>('[data-testid^="rail-section-"]')].map((section) => {
				const rail = section.querySelector<HTMLElement>('[data-slot="rail-title"]')!;
				const text = rail.querySelector('[data-slot="rail-title-text"]')!;
				const range = document.createRange();
				range.selectNodeContents(text);
				const glyphs = range.getBoundingClientRect();
				const clip = /inset\(([\d.]+)px/.exec(getComputedStyle(rail).clipPath);
				const visibleTop = Math.max(glyphs.top, box(rail).top + (clip ? parseFloat(clip[1]) : 0));
				const cards = section.querySelectorAll('[data-testid^="rail-content-"] > p');
				return {
					id: section.id,
					side: rail.dataset.side!,
					writing: getComputedStyle(text).writingMode,
					fit: rail.dataset.fit ?? null,
					fontSize: parseFloat(getComputedStyle(text).fontSize),
					section: box(section),
					painted:
						visibleTop < glyphs.bottom - 0.5
							? { top: visibleTop, bottom: glyphs.bottom, left: glyphs.left, right: glyphs.right }
							: null,
					content: [box(cards[0]), box(cards[cards.length - 1])],
				};
			}),
		};
	});

/** Scrolls the page, or the fixture's overflow container when it has one, and waits a frame. */
const scrollTo = async (page: Page, top: number) => {
	await page.evaluate(async (top) => {
		const scroller = document.querySelector<HTMLElement>('[data-testid="rail-scroller"][style*="overflow"]');
		(scroller ?? window).scrollTo({ top, behavior: 'instant' });
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	}, top);
};

/** A section's top in the scrolling box's own coordinates. */
const sectionTop = (page: Page, id: string) =>
	page.locator(`#${id}`).evaluate((node) => {
		const scroller = document.querySelector<HTMLElement>('[data-testid="rail-scroller"][style*="overflow"]');
		return scroller
			? node.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientTop + scroller.scrollTop
			: node.getBoundingClientRect().top + scrollY;
	});

const overlaps = (a: Box, b: Box) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

for (const lang of RAIL_LANGS) {
	const copy = RAIL_COPY[lang];

	test(`${lang}: each rail title is its section's h2, first in the section, rotated on the rail from 1024px and horizontal below`, async ({ page }, { project }) => {
		test.setTimeout(90_000);
		await open(page, lang);
		for (const section of copy.sections) {
			const region = page.getByRole('region', { name: section.heading, exact: true });
			const heading = region.getByRole('heading', { level: 2, name: section.heading, exact: true });
			await expect(heading).toHaveCount(1);
			await expect(heading).toHaveText(`${section.heading}.`);
			expect(
				await heading.evaluate((node) => {
					const content = node.closest('section')!.querySelector('[data-testid^="rail-content-"]')!;
					return node.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING;
				}),
			).toBeTruthy();
		}

		const widths = project.name === 'desktop' ? WIDTHS : [page.viewportSize()!.width];
		for (const width of widths) {
			await page.setViewportSize({ width, height: 900 });
			for (const [index, entry] of copy.sections.entries()) {
				await scrollTo(page, await sectionTop(page, entry.id));
				const state = (await snapshot(page)).sections[index];
				const where = `${lang} ${entry.id} at ${width}px`;
				const painted = state.painted!;
				expect(painted, where).not.toBeNull();
				expect(painted.left, where).toBeGreaterThanOrEqual(0);
				expect(painted.right, where).toBeLessThanOrEqual(width);
				expect(state.fontSize, where).toBeGreaterThanOrEqual(FLOOR_PX);
				if (width < DESKTOP_MIN_WIDTH) {
					expect(state.writing, where).toBe('horizontal-tb');
					expect(painted.bottom, `${where}: the title reads above the content`).toBeLessThanOrEqual(state.content[0].top);
				} else {
					expect(state.writing, where).toBe('vertical-rl');
					expect(state.side, where).toBe(entry.side);
					for (const card of state.content) {
						if (entry.side === 'left') expect(painted.right, `${where}: left of the content`).toBeLessThanOrEqual(card.left);
						else expect(painted.left, `${where}: right of the content`).toBeGreaterThanOrEqual(card.right);
					}
				}
			}
			await expectNoHorizontalOverflow(page);
		}
		await expectAccessible(page);
	});
}

test('a rail title stays in view under the pill while its section scrolls, then the next title takes over', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	test.setTimeout(120_000);
	for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 700 }, { width: 1920, height: 1080 }]) {
		await page.setViewportSize(viewport);
		await open(page, 'fr');
		const workIndex = RAIL_COPY.fr.sections.findIndex((section) => section.id === 'work');
		const where = `${viewport.width}x${viewport.height}`;

		// Inside the long section the title holds one place, clear of the pill and inside the viewport.
		const workTop = await sectionTop(page, 'work');
		await scrollTo(page, workTop + 300);
		const first = await snapshot(page);
		const held = first.sections[workIndex].painted!;
		expect(held.top, `${where}: under the pill`).toBeGreaterThanOrEqual(first.pill!.bottom);
		expect(held.top, `${where}: just under the pill`).toBeLessThanOrEqual(first.pill!.bottom + 48);
		expect(held.bottom, `${where}: inside the viewport`).toBeLessThanOrEqual(viewport.height);
		await scrollTo(page, workTop + 900);
		const later = (await snapshot(page)).sections[workIndex].painted!;
		expect(Math.abs(later.top - held.top), `${where}: sticky`).toBeLessThanOrEqual(1);

		// Near its end the title leaves with its section, and the next section's title takes the rail.
		const aboutTop = await sectionTop(page, 'about');
		await scrollTo(page, aboutTop - viewport.height / 3);
		const leaving = (await snapshot(page)).sections[workIndex];
		expect(leaving.painted!.bottom, `${where}: the title ends with its section`).toBeLessThanOrEqual(leaving.section.bottom + 0.5);
		await scrollTo(page, aboutTop + 200);
		const next = await snapshot(page);
		const about = next.sections[workIndex + 1].painted!;
		expect(about.top, `${where}: the next title holds under the pill`).toBeGreaterThanOrEqual(next.pill!.bottom);
		expect(about.top, `${where}: the next title holds under the pill`).toBeLessThanOrEqual(next.pill!.bottom + 48);
	}
});

test('at every scroll position no painted rail title covers the pill, its content, another title or leaves its section', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	test.setTimeout(150_000);
	for (const lang of RAIL_LANGS) {
		await open(page, lang);
		const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
		for (let top = 0; top <= height; top += 160) {
			await scrollTo(page, top);
			const state = await snapshot(page);
			const visible = state.sections.filter((entry) => entry.painted && entry.painted.bottom > 0 && entry.painted.top < state.viewport.height);
			for (const entry of visible) {
				const where = `${lang} ${entry.id} at scroll ${top}`;
				const painted = entry.painted!;
				expect(overlaps(painted, state.pill!), `${where}: pill`).toBe(false);
				for (const card of entry.content) expect(overlaps(painted, card), `${where}: content`).toBe(false);
				expect(painted.top, `${where}: section top`).toBeGreaterThanOrEqual(entry.section.top - 0.5);
				expect(painted.bottom, `${where}: section bottom`).toBeLessThanOrEqual(entry.section.bottom + 0.5);
				for (const other of visible) {
					if (other !== entry) expect(overlaps(painted, other.painted!), `${where}: ${other.id}`).toBe(false);
				}
			}
		}
	}
});

test('a departing title never paints under a header pill that spans the rails', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	test.setTimeout(120_000);
	for (const viewport of [{ width: 1024, height: 700 }, { width: 1440, height: 900 }]) {
		await page.setViewportSize(viewport);
		await open(page, 'en');
		// A product header bar as wide as the page: the three-link product pill, widened to the gutters.
		await page.getByTestId('nav-pill').evaluate((pill) => { pill.style.minWidth = 'calc(100vw - 16px)'; });
		const where = `${viewport.width}x${viewport.height}`;
		const before = await snapshot(page);
		for (const side of ['left', 'right']) {
			const rail = before.sections.find((entry) => entry.side === side)!.painted!;
			expect(before.pill!.left, `${where}: the pill spans the ${side} rail`).toBeLessThanOrEqual(rail.left);
			expect(before.pill!.right, `${where}: the pill spans the ${side} rail`).toBeGreaterThanOrEqual(rail.right);
		}
		// Walk each boundary in small steps, as the departing title passes the clearance line.
		for (const [index, entry] of RAIL_COPY.en.sections.entries()) {
			if (index === RAIL_COPY.en.sections.length - 1) break;
			const end = await page.locator(`#${entry.id}`).evaluate((node) => node.getBoundingClientRect().bottom + scrollY);
			for (let top = end - viewport.height; top <= end; top += 24) {
				await scrollTo(page, Math.max(0, top));
				const state = await snapshot(page);
				const departing = state.sections[index];
				if (departing.painted) {
					expect(overlaps(departing.painted, state.pill!), `${where}: ${entry.id} at scroll ${top}`).toBe(false);
					expect(departing.painted.top, `${where}: ${entry.id} below the pill`).toBeGreaterThanOrEqual(state.pill!.bottom);
				}
			}
		}
	}
});

test('clipAtHeader={false} lets a departing title leave naturally while sticky placement and fitting stay', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	await page.setViewportSize({ width: 1280, height: 800 });
	const index = RAIL_COPY.en.sections.findIndex((section) => section.id === 'work');
	const departing = async (query: string) => {
		await open(page, 'en', query);
		const start = await sectionTop(page, 'work');
		const height = await page.locator('#work').evaluate((node) => node.getBoundingClientRect().height);
		await scrollTo(page, start + height - 40);
		const state = await snapshot(page);
		return {
			title: state.sections[index],
			pill: state.pill!,
			clip: await page.locator('#work [data-slot="rail-title"]').evaluate((node) => getComputedStyle(node).clipPath),
		};
	};

	// The default still clips the part of the departing title above the clearance line.
	const on = await departing('');
	expect(on.clip).toMatch(/inset\([1-9]\d*px/);
	if (on.title.painted) {
		expect(on.title.painted.top, 'the default never paints above the pill').toBeGreaterThanOrEqual(on.pill.bottom);
	}
	// The opt-out removes the clip and shows the departing title above the clearance line, with every
	// other behaviour unchanged.
	const off = await departing('?clip=off');
	expect(off.clip).toBe('none');
	expect(off.title.painted).not.toBeNull();
	expect(off.title.painted!.top, 'the opt-out lets the title leave naturally').toBeLessThan(off.pill.bottom);
	expect(off.title.fontSize).toBe(on.title.fontSize);
	expect(off.title.writing).toBe(on.title.writing);
});

test('clipAtHeader follows a prop change in a nested scroller, both ways', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/rail-title-fit?scroller=400&clip=off');
	await ready(page);
	const title = page.locator('#fit [data-slot="rail-title"]');
	const clip = () => title.evaluate((node) => getComputedStyle(node).clipPath);
	const start = await sectionTop(page, 'fit');
	const height = await page.locator('#fit').evaluate((node) => node.getBoundingClientRect().height);
	await scrollTo(page, start + height - 60);

	await expect.poll(clip, { message: 'the opt-out applies inside the nested scrollport' }).toBe('none');
	const port = await snapshot(page);
	const state = port.sections[0];
	expect(state.fontSize).toBeGreaterThanOrEqual(FLOOR_PX);
	expect(state.painted).not.toBeNull();
	expect(state.painted!.bottom).toBeLessThanOrEqual(port.port.bottom + 0.5);

	await page.getByTestId('toggle-clip').click();
	await expect.poll(clip, { message: 'turning the clip back on applies it' }).toMatch(/^inset\([1-9]/);
	await page.getByTestId('toggle-clip').click();
	await expect.poll(clip, { message: 'the clip can be turned off again' }).toBe('none');
});

test('a long rotated title shrinks to fit under the pill on a short window', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	for (const lang of ['es', 'fr'] as const) {
		await page.setViewportSize({ width: 1024, height: 600 });
		await open(page, lang);
		const index = RAIL_COPY[lang].sections.findIndex((section) => section.id === 'next');
		await scrollTo(page, (await sectionTop(page, 'next')) + 100);
		await expect
			.poll(async () => {
				const state = await snapshot(page);
				const title = state.sections[index];
				return title.fontSize >= FLOOR_PX && title.painted!.bottom <= state.viewport.height && title.painted!.top >= state.pill!.bottom;
			}, { message: `${lang}: the long title fits between the pill and the window's bottom` })
			.toBe(true);
	}
});

test('fitting keeps a 12px floor: a title too long to rotate reads horizontally above its content', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are rotated from 1024px');
	await page.setViewportSize({ width: 1024, height: 600 });
	await page.goto('/rail-title-fit?offset=100');
	await ready(page);
	const fitTitle = async () => (await snapshot(page)).sections[0];

	await page.getByTestId('title-medium').click();
	await expect.poll(async () => (await fitTitle()).fit).toBeNull();
	await scrollTo(page, (await sectionTop(page, 'fit')) + 200);
	const medium = await fitTitle();
	const state = await snapshot(page);
	expect(medium.writing).toBe('vertical-rl');
	expect(medium.fontSize).toBeGreaterThanOrEqual(FLOOR_PX);
	expect(medium.painted!.bottom, 'the shrunk title, dot included, ends inside the viewport').toBeLessThanOrEqual(state.port.bottom);

	await page.getByTestId('title-long').click();
	await expect.poll(async () => (await fitTitle()).fit).toBe('horizontal');
	const long = await fitTitle();
	expect(long.writing).toBe('horizontal-tb');
	expect(long.fontSize).toBeGreaterThanOrEqual(FLOOR_PX);
	expect(long.painted!.bottom, 'above the content').toBeLessThanOrEqual(long.content[0].top);
	expect(long.painted!.left).toBeGreaterThanOrEqual(0);
	expect(long.painted!.right).toBeLessThanOrEqual(1024);
	await expectNoHorizontalOverflow(page);
});

test('horizontal size changes phone and fallback titles while rotation and defaults stay unchanged', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/rail-title-fit');
	await ready(page);
	const baseline = (await snapshot(page)).sections[0].fontSize;
	await page.goto('/rail-title-fit?horizontalSize=2rem');
	await ready(page);
	await expect.poll(async () => (await snapshot(page)).sections[0].fontSize).toBe(baseline);
	for (const width of [390, 768, 1023]) {
		await page.setViewportSize({ width, height: 900 });
		const text = page.locator('#fit [data-slot="rail-title-text"]');
		await expect(text).toHaveCSS('font-size', '32px');
		await expect(text).toHaveCSS('writing-mode', 'horizontal-tb');
		expect((await snapshot(page)).sections[1].fontSize, 'the sibling default remains the display size').toBeGreaterThan(32);
	}
	await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
	await expect(page.locator('#fit [data-slot="rail-title-text"]')).toHaveCSS('font-size', '40px');
	await page.evaluate(() => { document.documentElement.style.removeProperty('font-size'); });
	await page.setViewportSize({ width: 1024, height: 600 });
	await page.getByTestId('title-long').click();
	await expect(page.locator('#fit [data-slot="rail-title"]')).toHaveAttribute('data-fit', 'horizontal');
	await expect(page.locator('#fit [data-slot="rail-title-text"]')).toHaveCSS('font-size', '32px');
	await expectNoHorizontalOverflow(page);
});

test('a title in an overflow container fits that scrollport and refits when it resizes', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/rail-title-fit?scroller=400');
	await ready(page);
	for (const height of [400, 260]) {
		await page.getByTestId('rail-scroller').evaluate((node, height) => { node.style.height = `${height}px`; }, height);
		await scrollTo(page, (await sectionTop(page, 'fit')) + 150);
		await expect
			.poll(async () => {
				const state = await snapshot(page);
				const title = state.sections[0];
				return (
					title.fit === null &&
					title.fontSize >= FLOOR_PX &&
					title.painted !== null &&
					title.painted.top >= state.port.top - 0.5 &&
					title.painted.bottom <= state.port.bottom + 0.5
				);
			}, { message: `the title and its dot stay inside a ${height}px scrollport` })
			.toBe(true);
	}
});

test('changing the heading, dot or size refits without a resize, both ways', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	await page.setViewportSize({ width: 1280, height: 700 });
	await page.goto('/rail-title-fit');
	await ready(page);
	await scrollTo(page, (await sectionTop(page, 'fit')) + 150);
	const fitTitle = async () => (await snapshot(page)).sections[0];
	const fits = async () => {
		const state = await snapshot(page);
		const title = state.sections[0];
		return title.painted !== null && title.painted.bottom <= state.port.bottom + 0.5 && title.painted.top >= 0;
	};
	const shortSize = (await fitTitle()).fontSize;
	expect(shortSize).toBeGreaterThan(FLOOR_PX);

	await page.getByTestId('title-medium').click();
	await expect.poll(fits, { message: 'short to long refits' }).toBe(true);
	expect((await fitTitle()).fontSize).toBeLessThan(shortSize);

	await page.getByTestId('title-short').click();
	await expect.poll(async () => (await fitTitle()).fontSize, { message: 'long to short returns to the full size' }).toBe(shortSize);

	await page.getByTestId('title-medium').click();
	await expect.poll(fits).toBe(true);
	await page.getByTestId('toggle-dot').click();
	await expect.poll(fits, { message: 'dropping the dot refits' }).toBe(true);
	await page.getByTestId('size-large').click();
	await expect.poll(fits, { message: 'a larger size still fits' }).toBe(true);
	expect((await fitTitle()).fontSize).toBeGreaterThanOrEqual(FLOOR_PX);
});

test('the rail titles page passes the accessibility check in both themes @theme', async ({ page }) => {
	test.setTimeout(60_000);
	for (const lang of RAIL_LANGS) {
		await open(page, lang);
		await expectAccessible(page);
	}
});
