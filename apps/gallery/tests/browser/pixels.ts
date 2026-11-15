import type { Page } from '@playwright/test';

/**
 * Pixel sampling for the D22 divider specs: screenshots a one-CSS-pixel-wide column and decodes
 * it in the page, so the checks read what was painted, not computed styles. At device scale 2 each
 * CSS pixel is two device rows; rows come back in device pixels, top to bottom.
 */
export async function column(page: Page, x: number, top: number, bottom: number) {
	const clip = { x: Math.round(x), y: Math.floor(top), width: 1, height: Math.max(1, Math.ceil(bottom - top)) };
	const png = await page.screenshot({ clip });
	return page.evaluate(async (base64) => {
		const image = new Image();
		image.src = `data:image/png;base64,${base64}`;
		await image.decode();
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;
		const context = canvas.getContext('2d')!;
		context.drawImage(image, 0, 0);
		const data = context.getImageData(0, 0, image.width, image.height).data;
		const rows: [number, number, number][] = [];
		for (let y = 0; y < image.height; y++) {
			const i = y * image.width * 4;
			rows.push([data[i]!, data[i + 1]!, data[i + 2]!]);
		}
		return rows;
	}, png.toString('base64'));
}

/** A drawn stroke pixel: the orange blueprint ink, or hazard yellow; never white or neutral. */
export const isInk = ([r, g, b]: [number, number, number]) => r - b > 60 && r > 90 && !(r > 240 && g > 240 && b > 240);

/** Runs of consecutive ink rows: one per stroke crossed by the column. */
export function strokes(rows: [number, number, number][]) {
	let runs = 0;
	let inside = false;
	for (const row of rows) {
		const ink = isInk(row);
		if (ink && !inside) runs++;
		inside = ink;
	}
	return runs;
}
