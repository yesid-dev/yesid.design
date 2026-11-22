import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { injectAnnouncementBannerBoot, injectThemeBoot } from '@yesid/ui/head';
import { preloadFont } from '@yesid/tokens/fonts';
import { initializeUi } from '#lib/ui-initialization.js';
import { announcementId } from '#lib/gallery/announcement.js';

export const init: ServerInit = () => {
	initializeUi();
};

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => injectAnnouncementBannerBoot(
			injectThemeBoot(html),
			announcementId(event.route.id, event.params.id),
		),
		preload: ({ type, path }) => type !== 'font' || preloadFont(path),
	});
