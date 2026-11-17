import { expect, test } from '@playwright/test';

test('shared rail preserves listing geometry, type and four-dot clusters', async ({ page }) => {
	await page.goto('/listing-frame');
	await page.evaluate(() => document.fonts.ready);
	const rail = page.locator('[data-slot="listing-edge-title"]');
	if (page.viewportSize()!.width < 1024) {
		await expect(rail).toBeHidden();
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		return;
	}
	const geometry = await rail.evaluate((el) => {
		const style = getComputedStyle(el);
		const box = el.getBoundingClientRect();
		const title = el.querySelector('[data-slot="rail-title-text"]')!;
		const text = getComputedStyle(title);
		const clusters = [...el.children].slice(1).map(cluster => ({
			box: cluster.getBoundingClientRect().toJSON(),
			dots: [...cluster.children].map(dot => ({ w: dot.getBoundingClientRect().width, h: dot.getBoundingClientRect().height })),
		}));
		return { height: box.height, top: box.top, position: style.position, padding: style.padding,
			font: text.fontWeight, writing: text.writingMode, titleHeight: title.getBoundingClientRect().height,
			clusters, accent: el.nextElementSibling!.getBoundingClientRect().width };
	});
	expect(geometry.height).toBe(page.viewportSize()!.height);
	expect(geometry.position).toBe('sticky');
	expect(geometry.padding).toBe('16px 24px');
	expect(geometry.font).toBe('900');
	expect(geometry.writing).toBe('vertical-rl');
	expect(geometry.titleHeight).toBeLessThanOrEqual(geometry.height - 256 + 1);
	expect(geometry.accent).toBe(2);
	expect(geometry.clusters[0].dots).toEqual([{w:2,h:32},{w:6,h:6},{w:6,h:6},{w:6,h:6},{w:10,h:10}]);
	expect(geometry.clusters[1].dots).toEqual([...geometry.clusters[0].dots].reverse());
	expect(geometry.clusters[0].box.top - geometry.top).toBe(16);
	expect(geometry.top + geometry.height - geometry.clusters[1].box.bottom).toBe(16);
});

test('semantic rail stays centered, fits enlarged text and departs without clipping', async ({ page }) => {
	await page.setViewportSize(page.viewportSize()!.width < 1024 ? { width: 320, height: 640 } : { width: 1024, height: 600 });
	await page.goto('/listing-rail');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await page.evaluate(() => document.fonts.ready);
	const heading = page.getByRole('heading', { level: 1, name: 'Contact' });
	await expect(heading).toHaveAttribute('id', 'contact-title');
	await expect(page.getByRole('region', { name: 'Contact' })).toBeVisible();
	for (const scale of [100, 200]) {
		await page.evaluate(scale => { document.documentElement.style.fontSize = `${scale}%`; }, scale);
		await expect(heading).toBeVisible();
		const rail = page.locator('[data-slot="listing-edge-title"]');
		const box = await heading.boundingBox();
		const column = await rail.boundingBox();
		expect(box!.x).toBeGreaterThanOrEqual(column!.x - 1);
		expect(box!.x + box!.width).toBeLessThanOrEqual(column!.x + column!.width + 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		if (page.viewportSize()!.width >= 1024) {
			expect(Math.abs(box!.y + box!.height / 2 - column!.y - column!.height / 2)).toBeLessThan(1);
			expect(box!.height).toBeLessThanOrEqual(column!.height - 128);
		}
	}
	await page.getByRole('link', { name: 'Continue' }).focus();
	await expect(page.getByRole('link', { name: 'Continue' })).toBeFocused();
	for (const fraction of [0.5, 1, 1.5]) {
		await page.evaluate(fraction => window.scrollTo(0, innerHeight * fraction), fraction);
		await expect(page.locator('[data-slot="rail-title"]')).toHaveCSS('clip-path', 'none');
		await expect(page.locator('[data-slot="listing-edge-title"]')).toHaveCSS('overflow', 'visible');
	}
});


test('decorative listing rail also honors natural unclipped scroll departure', async ({ page }) => {
	await page.goto('/listing-frame?clip=0');
	await expect(page.locator('html')).toHaveAttribute('data-gallery-ready', 'true');
	await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
	if (page.viewportSize()!.width < 1024) return;
	await page.addStyleTag({ content: 'body { min-height: 300vh; }' });
	for (const y of [200, 600, 1000]) {
		await page.evaluate(y => window.scrollTo(0, y), y);
		await expect(page.locator('[data-slot="rail-title"]')).toHaveCSS('clip-path', 'none');
	}
});
