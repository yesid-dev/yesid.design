// @ts-nocheck: a standalone trace probe, not part of the typed test suite.
// Main-thread cost of the Gallery's /app-frame/switch page, traced with the CPU slowed.
// Build the Gallery with `vite build --minify false` so function names survive, serve it, then:
// node tests/perf/switch-trace.mjs <gallery dir> <origin> <switch|load|idle> [cpu=4] [width=1440] [runs=5] [?scroll=start|end|mixed]
// Reports per run: main-thread task time, all style and layout time, forced style and layout
// grouped by the JS function that asked for it, and GSAP ticker calls and time.
import { createRequire } from 'node:module';
const [, , dir, origin, scenario, cpuArg = '4', wArg = '1440', runsArg = '5', query = ''] = process.argv;
const { chromium } = createRequire(`${dir}/package.json`)('@playwright/test');
const w = Number(wArg);
const browser = await chromium.launch();
const runs = [];
for (let run = 0; run < Number(runsArg); run++) {
	const context = await browser.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: 1, serviceWorkers: 'block', locale: 'en-CA', reducedMotion: 'no-preference' });
	const page = await context.newPage();
	const cdp = await context.newCDPSession(page);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(cpuArg) });
	const events = [];
	cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value));
	const start = () => cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'v8.execute'] } });
	if (scenario === 'load') await start();
	await page.goto(`${origin}/app-frame/switch${query}`, { waitUntil: 'load' });
	await page.waitForFunction(() => document.documentElement.dataset.galleryReady === 'true');
	if (scenario !== 'load') {
		await page.waitForTimeout(1000);
		await start();
		if (scenario === 'switch') {
			await page.getByTestId('view-record').click();
			await page.getByTestId('record-view').waitFor();
		}
	}
	await page.waitForTimeout(1500);
	const done = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
	await cdp.send('Tracing.end');
	await done;
	const byThread = new Map();
	for (const e of events) if (e.name === 'RunTask' && e.dur) byThread.set(`${e.pid}:${e.tid}`, (byThread.get(`${e.pid}:${e.tid}`) ?? 0) + e.dur);
	// The renderer main thread is the one that ran script.
	const scriptThreads = new Set(events.filter((e) => e.name === 'FunctionCall' || e.name === 'EvaluateScript').map((e) => `${e.pid}:${e.tid}`));
	const main = [...byThread].filter(([k]) => scriptThreads.has(k)).sort((a, b) => b[1] - a[1])[0]?.[0];
	const mine = events.filter((e) => `${e.pid}:${e.tid}` === main && e.ph === 'X' && e.dur);
	const ms = (list) => Math.round(list.reduce((a, e) => a + e.dur, 0) / 1000);
	const forced = {};
	for (const e of mine.filter((k) => (k.name === 'Layout' || k.name === 'UpdateLayoutTree') && k.args?.beginData?.stackTrace?.length)) {
		const f = e.args.beginData.stackTrace[0];
		const key = `${f.functionName || '(anonymous)'} ${(f.url || '').split('/').pop()}:${f.lineNumber}`;
		forced[key] = (forced[key] ?? 0) + e.dur / 1000;
	}
	const gsap = mine.filter((e) => e.name === 'FunctionCall' && e.args?.data?.functionName === '_tick');
	// Top-level tasks only: nested RunTask events would count twice.
	const tops = [];
	for (const e of mine.filter((k) => k.name === 'RunTask').sort((a, b) => a.ts - b.ts)) {
		const last = tops[tops.length - 1];
		if (last && e.ts < last.ts + last.dur) continue;
		tops.push(e);
	}
	runs.push({
		tasks: ms(tops),
		styleLayout: ms(mine.filter((e) => e.name === 'Layout' || e.name === 'UpdateLayoutTree')),
		forced: ms(mine.filter((e) => (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.args?.beginData?.stackTrace?.length)),
		gsapTicks: gsap.length,
		gsapMs: ms(gsap),
		forcedBy: Object.fromEntries(Object.entries(forced).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, Math.round(v)])),
	});
	await context.close();
}
await browser.close();
const median = (key) => { const v = runs.map((r) => r[key]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
console.log(JSON.stringify({ scenario, cpu: Number(cpuArg), w, median: { tasks: median('tasks'), styleLayout: median('styleLayout'), forced: median('forced'), gsapTicks: median('gsapTicks'), gsapMs: median('gsapMs') }, runs }, null, 1));
