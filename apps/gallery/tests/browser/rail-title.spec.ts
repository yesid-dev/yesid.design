import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';
import { expect, test, type Page } from '@playwright/test';
import { RAIL_COPY, RAIL_LANGS, type RailLang } from '../../src/lib/gallery/rail-title-fixture.js';

const WIDTHS = [320, 390, 768, 1023, 1024, 1280, 1440, 1920];
const DESKTOP_MIN_WIDTH = 1024;

async function open(page: Page, lang: RailLang) {
	await page.goto(`/rail-title/${lang}`);
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
}

interface Box {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

interface Snapshot {
	pill: Box;
	viewport: { width: number; height: number };
	sections: {
		id: string;
		side: string;
		writing: string;
		section: Box;
		/** The RailTitle layout: the title's sticky range. */
		layout: Box;
		title: Box;
		/** The first and last cards: the content the title must never cover. */
		content: Box[];
	}[];
}

/** Every section's title, content and box, with the header pill, in viewport coordinates. */
const snapshot = (page: Page) =>
	page.evaluate((): Snapshot => {
		const box = (element: Element): Box => {
			const { top, bottom, left, right } = element.getBoundingClientRect();
			return { top, bottom, left, right };
		};
		return {
			pill: box(document.querySelector('[data-testid="nav-pill"]')!),
			viewport: { width: innerWidth, height: innerHeight },
			sections: [...document.querySelectorAll<HTMLElement>('[data-testid^="rail-section-"]')].map((section) => {
				const text = section.querySelector('[data-slot="rail-title-text"]')!;
				const cards = section.querySelectorAll('[data-testid^="rail-content-"] > p');
				return {
					id: section.id,
					side: section.querySelector<HTMLElement>('[data-slot="rail-title"]')!.dataset.side!,
					writing: getComputedStyle(text).writingMode,
					section: box(section),
					layout: box(section.querySelector('[data-slot="rail-title-layout"]')!),
					title: box(text),
					content: [box(cards[0]), box(cards[cards.length - 1])],
				};
			}),
		};
	});

const scrollTo = async (page: Page, top: number) => {
	await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), top);
	await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(
		await page.evaluate((top) => Math.min(Math.round(top), document.documentElement.scrollHeight - innerHeight), top),
	);
};

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
				const top = await page.locator(`#${entry.id}`).evaluate((node) => node.getBoundingClientRect().top + scrollY);
				await scrollTo(page, top);
				const state = (await snapshot(page)).sections[index];
				const where = `${lang} ${entry.id} at ${width}px`;
				expect(state.title.left, where).toBeGreaterThanOrEqual(0);
				expect(state.title.right, where).toBeLessThanOrEqual(width);
				if (width < DESKTOP_MIN_WIDTH) {
					expect(state.writing, where).toBe('horizontal-tb');
					expect(state.title.bottom, `${where}: the title reads above the content`).toBeLessThanOrEqual(state.content[0].top);
				} else {
					expect(state.writing, where).toBe('vertical-rl');
					expect(state.side, where).toBe(entry.side);
					for (const card of state.content) {
						if (entry.side === 'left') expect(state.title.right, `${where}: left of the content`).toBeLessThanOrEqual(card.left);
						else expect(state.title.left, `${where}: right of the content`).toBeGreaterThanOrEqual(card.right);
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
		const sectionTop = (id: string) => page.locator(`#${id}`).evaluate((node) => node.getBoundingClientRect().top + scrollY);
		const workIndex = RAIL_COPY.fr.sections.findIndex((section) => section.id === 'work');
		const where = `${viewport.width}x${viewport.height}`;

		// Inside the long section the title holds one place, clear of the pill and inside the viewport.
		const workTop = await sectionTop('work');
		await scrollTo(page, workTop + 300);
		const first = await snapshot(page);
		const held = first.sections[workIndex].title;
		expect(held.top, `${where}: under the pill`).toBeGreaterThanOrEqual(first.pill.bottom);
		expect(held.top, `${where}: just under the pill`).toBeLessThanOrEqual(first.pill.bottom + 40);
		expect(held.bottom, `${where}: inside the viewport`).toBeLessThanOrEqual(viewport.height);
		await scrollTo(page, workTop + 900);
		const later = (await snapshot(page)).sections[workIndex].title;
		expect(Math.abs(later.top - held.top), `${where}: sticky`).toBeLessThanOrEqual(1);

		// Near its end the title leaves with its section, and the next section's title takes the rail.
		const aboutTop = await sectionTop('about');
		await scrollTo(page, aboutTop - viewport.height / 3);
		const handOff = await snapshot(page);
		const leaving = handOff.sections[workIndex];
		expect(leaving.title.bottom, `${where}: the title ends with its section`).toBeLessThanOrEqual(leaving.section.bottom + 0.5);
		await scrollTo(page, aboutTop + 200);
		const next = await snapshot(page);
		const about = next.sections[workIndex + 1];
		expect(about.title.top, `${where}: the next title holds under the pill`).toBeGreaterThanOrEqual(next.pill.bottom);
		expect(about.title.top, `${where}: the next title holds under the pill`).toBeLessThanOrEqual(next.pill.bottom + 40);
		expect(next.sections[workIndex].title.bottom, `${where}: the previous title has left`).toBeLessThanOrEqual(next.sections[workIndex].section.bottom + 0.5);
	}
});

test('at every scroll position no rail title covers the pill, its content, another title or leaves its section', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	test.setTimeout(120_000);
	for (const lang of RAIL_LANGS) {
		await open(page, lang);
		const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
		for (let top = 0; top <= height; top += 160) {
			await scrollTo(page, top);
			const state = await snapshot(page);
			const visible = state.sections.filter(({ title }) => title.bottom > 0 && title.top < state.viewport.height);
			for (const entry of visible) {
				const where = `${lang} ${entry.id} at scroll ${top}`;
				// A title that has reached its section's end scrolls away with it, under the pill like the
				// content; until then it never touches the pill.
				const leaving = Math.abs(entry.title.bottom - entry.layout.bottom) <= 1 && entry.title.top < state.pill.bottom + 16;
				if (!leaving) expect(overlaps(entry.title, state.pill), `${where}: pill`).toBe(false);
				for (const card of entry.content) expect(overlaps(entry.title, card), `${where}: content`).toBe(false);
				expect(entry.title.top, `${where}: section top`).toBeGreaterThanOrEqual(entry.section.top - 0.5);
				expect(entry.title.bottom, `${where}: section bottom`).toBeLessThanOrEqual(entry.section.bottom + 0.5);
				for (const other of visible) {
					if (other !== entry) expect(overlaps(entry.title, other.title), `${where}: ${other.id}`).toBe(false);
				}
			}
		}
	}
});

test('a long rotated title shrinks to fit under the pill on a short window', async ({ page }) => {
	test.skip(page.viewportSize()!.width < DESKTOP_MIN_WIDTH, 'Rail titles are sticky from 1024px');
	for (const lang of ['es', 'fr'] as const) {
		await page.setViewportSize({ width: 1024, height: 600 });
		await open(page, lang);
		const index = RAIL_COPY[lang].sections.findIndex((section) => section.id === 'next');
		const top = await page.locator('#next').evaluate((node) => node.getBoundingClientRect().top + scrollY);
		await scrollTo(page, top + 100);
		await expect
			.poll(async () => {
				const state = await snapshot(page);
				return state.sections[index].title.bottom <= state.viewport.height && state.sections[index].title.top >= state.pill.bottom;
			}, { message: `${lang}: the long title fits between the pill and the window's bottom` })
			.toBe(true);
	}
});

test('the rail titles page passes the accessibility check in both themes @theme', async ({ page }) => {
	test.setTimeout(60_000);
	for (const lang of RAIL_LANGS) {
		await open(page, lang);
		await expectAccessible(page);
	}
});
