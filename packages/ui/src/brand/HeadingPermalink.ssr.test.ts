// @vitest-environment node
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import HeadingPermalink from './HeadingPermalink.svelte';

it('server markup already carries the href, the label and the reference to the target', () => {
	const { body } = render(HeadingPermalink, { props: { target: 'safety', label: 'Link to this section' } });
	const [, labelId] = body.match(/aria-labelledby="(\S+) safety"/) ?? [];
	expect(body).toContain('href="#safety"');
	expect(body).toContain(`<span id="${labelId}" hidden="">Link to this section:</span>`);
});
