// @vitest-environment node
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Fixture from './test-fixtures/ReadingFrameSsr.svelte';

type Props = Record<string, unknown>;
const base = {
	title: 'Privacy policy',
	updated: { datetime: '2026-11-02', label: 'Last updated', text: 'November 2, 2026' },
	sections: [
		{ id: 'data', title: 'Data we keep' },
		{ id: 'contact', title: 'Contact' },
	],
	contentsLabel: 'Contents',
};
const html = (props: Props = {}) => render(Fixture, { props: { ...base, ...props } as never }).body;

describe('ReadingFrame (experimental)', () => {
	it('renders the title, the real date, the summary, the contents and the body on the server', () => {
		const markup = html();
		expect(markup).toMatch(/<h1 class="reading-frame__title[^"]*"[^>]*>Privacy policy<\/h1>/);
		expect(markup).toContain('Last updated');
		expect(markup).toMatch(/<time datetime="2026-11-02"[^>]*>November 2, 2026<\/time>/);
		expect(markup).toContain('What this policy covers.');
		expect(markup).toMatch(/<nav[^>]*aria-labelledby="[^"]+-contents"/);
		expect(markup).toMatch(/<h2[^>]*>Contents<\/h2>/);
		expect(markup).toContain('href="#data"');
		expect(markup).toContain('href="#contact"');
		expect(markup).toContain('<h2 id="data">Data we keep</h2>');
		expect(markup.indexOf('reading-frame__contents')).toBeLessThan(markup.indexOf('reading-frame__body'));
	});

	it('omits the contents without sections, and renders a product contents snippet instead of the list', () => {
		expect(html({ sections: undefined, contentsLabel: undefined })).not.toContain('reading-frame__contents');
		const markup = html({ ownContents: true, contentsLabel: undefined });
		expect(markup).toContain('aria-label="Product contents"');
		expect(markup).not.toContain('href="#data"');
	});

	it.each([
		['a translated id', [{ id: 'données', title: 'Données' }]],
		['an id with spaces', [{ id: 'data we keep', title: 'Data' }]],
		['an uppercase id', [{ id: 'Data', title: 'Data' }]],
		['a duplicate id', [{ id: 'data', title: 'Data' }, { id: 'data', title: 'Again' }]],
	])('refuses %s, so a section link reaches the same section in every language', (_, sections) => {
		expect(() => html({ sections })).toThrow(/ReadingFrame: section id/);
	});

	it.each(['2 November 2026', '2026-13-01', '', 'today'])('refuses an update date that is not ISO 8601: %j', (datetime) => {
		expect(() => html({ updated: { ...base.updated, datetime } })).toThrow(/updated\.datetime/);
	});

	it('accepts a full ISO timestamp and requires a contents label with built-in sections', () => {
		expect(html({ updated: { ...base.updated, datetime: '2026-11-02T09:30:00Z' } })).toContain('datetime="2026-11-02T09:30:00Z"');
		expect(() => html({ contentsLabel: undefined })).toThrow(/contentsLabel/);
	});

	it('draws no decoration: no mono, uppercase, tape, glow or numbering markup', () => {
		const markup = html();
		for (const banned of ['font-mono', 'uppercase', 'hazard', 'glow', 'label-station']) expect(markup).not.toContain(banned);
	});
});
