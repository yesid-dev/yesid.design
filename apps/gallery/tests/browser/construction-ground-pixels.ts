import type { Page } from '@playwright/test';

/**
 * The first page row `target` paints in a band of the whole page, found by comparing the pixels with
 * it shown and hidden; null when it paints nothing there. The band may lie outside the viewport.
 */
export async function firstPaintedRow(
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
