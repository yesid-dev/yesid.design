import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow } from '@yesid/config/playwright';

// Each case sets its own viewport, so one project runs every width.
test.beforeEach(({}, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One run sets every width');
});

interface Fill {
	id: string;
	/** The parent's content box, the space the frame's margin box may use. */
	parent: { left: number; right: number; width: number };
	gutters: number;
	measure: number;
	/** The frame's border box and content width. */
	frame: { left: number; right: number; content: number };
	titleSize: string;
	links: { text: string; width: number; natural: number }[];
}

async function fills(page: Page): Promise<Fill[]> {
	return page.locator('[data-case]').evaluateAll((parents) => parents.map((parent) => {
		const px = (value: string) => Number.parseFloat(value);
		const frame = parent.querySelector<HTMLElement>('[data-slot="reading-frame"]')!;
		const parentStyle = getComputedStyle(parent);
		const frameStyle = getComputedStyle(frame);
		const parentLeft = parent.getBoundingClientRect().left + parent.clientLeft + px(parentStyle.paddingLeft);
		const parentWidth = parent.clientWidth - px(parentStyle.paddingLeft) - px(parentStyle.paddingRight);
		const box = frame.getBoundingClientRect();
		const gutters = px(frameStyle.paddingLeft) + px(frameStyle.paddingRight);
		const links = [...frame.querySelectorAll<HTMLElement>('[data-slot="reading-frame-contents"] a')].map((link) => {
			// The text on one line, in the link's own font.
			const text = link.textContent!.trim();
			const probe = link.appendChild(document.createElement('span'));
			probe.style.cssText = 'position: absolute; visibility: hidden; white-space: nowrap; inline-size: max-content;';
			probe.textContent = text;
			const natural = probe.getBoundingClientRect().width;
			probe.remove();
			return { text, width: link.getBoundingClientRect().width, natural };
		});
		return {
			id: parent.dataset.case!,
			parent: { left: parentLeft, right: parentLeft + parentWidth, width: parentWidth },
			gutters,
			measure: px(frameStyle.maxWidth),
			frame: { left: box.left, right: box.right, content: box.width - gutters },
			titleSize: getComputedStyle(frame.querySelector('h1')!).fontSize,
			links,
		};
	}));
}

for (const width of [390, 768, 1440]) {
	test(`a reading frame fills a content-sized parent up to the measure at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/reading-frame-fill');
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.evaluate(() => document.fonts.ready);

		const cases = await fills(page);
		expect(cases.map(({ id }) => id)).toEqual(['block', 'block-flush', 'flex', 'flex-flush', 'grid', 'grid-flush']);
		for (const fill of cases) {
			const where = `${fill.id} at ${width}px`;
			const expected = Math.min(fill.parent.width - fill.gutters, fill.measure);
			expect(Math.abs(fill.frame.content - expected), `${where}: content ${fill.frame.content}px, expected ${expected}px`).toBeLessThanOrEqual(1);
			expect(fill.frame.left, `${where}: starts inside its parent`).toBeGreaterThanOrEqual(fill.parent.left - 1);
			expect(fill.frame.right, `${where}: ends inside its parent`).toBeLessThanOrEqual(fill.parent.right + 1);
			expect(fill.links).toHaveLength(4);
			for (const link of fill.links) {
				const needed = Math.min(link.natural, expected);
				expect(link.width, `${where}: "${link.text}" is ${link.width}px for ${link.natural}px of text`).toBeGreaterThanOrEqual(needed - 1);
			}
			// A content-sized parent gives the same geometry as block flow with the same gutter.
			const reference = cases.find(({ id }) => id === (fill.id.endsWith('-flush') ? 'block-flush' : 'block'))!;
			expect(Math.abs(fill.frame.left - reference.frame.left), `${where}: same start as ${reference.id}`).toBeLessThanOrEqual(1);
			expect(Math.abs(fill.frame.content - reference.frame.content), `${where}: same width as ${reference.id}`).toBeLessThanOrEqual(1);
			expect(fill.titleSize, `${where}: same title size as ${reference.id}`).toBe(reference.titleSize);
		}
		await expectNoHorizontalOverflow(page);
	});
}
