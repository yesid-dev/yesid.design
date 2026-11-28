import { expect, test } from '@playwright/test';
import { expectSteadyWhileStreaming, settle, streamingProxy, watchBox } from './streaming.js';

const pill = '[data-testid="nav-pill"]';

/** Pause inside the pill after its links and search, before the toggles and the menu button. */
function beforeToggles(html: string): number {
	const start = html.indexOf('data-testid="nav-pill"');
	const trailing = html.indexOf('nav-trailing', start);
	return start < 0 || trailing < 0 ? -1 : html.lastIndexOf('<div', trailing);
}

test('the header pill never widens or moves while the header streams in', async ({ page, baseURL }) => {
	const proxy = await streamingProxy(baseURL!, '/site-header', beforeToggles);
	try {
		await watchBox(page, pill);
		await page.goto(proxy.url);
		const result = await settle(page, pill);
		await expect(page.getByTestId('nav-menu-toggle')).toBeVisible();
		expectSteadyWhileStreaming(result, 'header pill');
	} finally {
		await proxy.close();
	}
});
