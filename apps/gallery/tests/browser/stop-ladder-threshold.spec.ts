import { expect, test, type Locator } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow } from '@yesid/config/playwright';

const LABELS = { en: 'Late beyond 5 min', fr: 'En retard au-delà de 5 min' } as const;
/** Threshold value over the ladder's `max` of 10. */
const POSITIONS = { start: 0.05, middle: 0.5, end: 1 } as const;

function measure(ladder: Locator) {
	return ladder.evaluate((element) => {
		const list = element.querySelector('ol')!;
		const label = element.querySelector<HTMLElement>('.threshold-label')!;
		// A bar track covers the rule's horizontal range, in both the wide and the narrow layout.
		const track = list.querySelector('.track')!.getBoundingClientRect();
		const listBox = list.getBoundingClientRect();
		// The narrow list is a block, so the rule is placed against the list instead of its grid column.
		const ruleOrigin = getComputedStyle(list).display === 'block' ? listBox.left : track.left;
		const range = document.createRange();
		range.selectNodeContents(label);
		// The words themselves, since a label's element can be wider than its text.
		const { left, right, top, width } = range.getBoundingClientRect();
		const ladderBox = element.getBoundingClientRect();
		return {
			text: label.textContent,
			ruleX: ruleOrigin + Number.parseFloat(getComputedStyle(list, '::after').left),
			ruleFoot: listBox.bottom,
			track: { left: track.left, right: track.right, width: track.width },
			label: { left, right, top, width },
			boxHeight: label.getBoundingClientRect().height,
			lineHeight: Number.parseFloat(getComputedStyle(label).lineHeight),
			textLines: new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size,
			ladder: { left: ladderBox.left, right: ladderBox.right },
		};
	});
}

for (const [lang, expected] of Object.entries(LABELS)) {
	test(`the threshold label sits at its rule's foot on one line (${lang})`, async ({ page }, info) => {
		await page.goto(`/stop-ladder-threshold/${lang}`);
		await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
		await page.evaluate(() => document.fonts.ready);

		const cases = [];
		for (const size of ['full', 'compact']) {
			for (const [position, fraction] of Object.entries(POSITIONS)) {
				const ladder = page.getByTestId(`ladder-${size}-${position}`).locator('[data-slot="stop-ladder"]');
				cases.push({ name: `${size} ${position}`, fraction, ...(await measure(ladder)) });
			}
		}
		await info.attach(`ladder-geometry-${lang}`, {
			body: JSON.stringify({ lang, width: page.viewportSize()!.width, cases }),
			contentType: 'application/json',
		});

		for (const measured of cases) {
			const { name, fraction, label, track, ladder, ruleX, ruleFoot } = measured;

			expect(measured.text, name).toBe(expected);
			expect(ruleX, `${name} rule position`).toBeCloseTo(track.left + fraction * track.width, 0);
			expect(label.left, `${name} label starts before the rule`).toBeLessThanOrEqual(ruleX + 0.5);
			expect(label.right, `${name} label ends after the rule`).toBeGreaterThanOrEqual(ruleX - 0.5);
			if (label.width <= track.width) {
				// The same fraction of the label and of the track meet at the rule.
				expect(
					Math.abs(label.left + fraction * label.width - ruleX),
					`${name} anchor offset`,
				).toBeLessThanOrEqual(1);
			} else {
				// A label wider than the bar column ends with it and extends toward the stop names.
				expect(Math.abs(label.right - track.right), `${name} end offset`).toBeLessThanOrEqual(1);
			}
			expect(label.top, `${name} below the rule`).toBeGreaterThanOrEqual(ruleFoot - 0.5);
			expect(label.top - ruleFoot, `${name} at the rule's foot`).toBeLessThanOrEqual(8);
			expect(measured.textLines, `${name} text lines`).toBe(1);
			expect(measured.boxHeight, `${name} one line box`).toBeLessThan(measured.lineHeight * 1.5);
			expect(label.left, `${name} inside the ladder start`).toBeGreaterThanOrEqual(ladder.left - 0.5);
			expect(label.right, `${name} inside the ladder end`).toBeLessThanOrEqual(ladder.right + 0.5);
		}

		await expectNoHorizontalOverflow(page);
		await expectAccessible(page);
	});
}
