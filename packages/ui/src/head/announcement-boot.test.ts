import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import boot from './boot.json';
import { injectAnnouncementBannerBoot } from './announcement-boot.js';

it('injects the current ID safely and keeps the CSP hash independent of the ID', () => {
	const id = 'release"&<next>';
	const head = document.createElement('head');
	head.innerHTML = injectAnnouncementBannerBoot('%yesid.announcementBannerBoot%', id);
	const script = head.querySelector('script')!;
	expect(script.dataset.announcementId).toBe(id);
	expect(`sha256-${createHash('sha256').update(script.textContent!).digest('base64')}`)
		.toBe(boot.announcementHash);
	expect(injectAnnouncementBannerBoot('<head>%yesid.announcementBannerBoot%</head>'))
		.toBe('<head></head>');
});
