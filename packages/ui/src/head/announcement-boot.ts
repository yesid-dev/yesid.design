export const ANNOUNCEMENT_STORAGE_PREFIX = 'yesid:announcement:';

// boot.json holds the CSP hash of this static script. The message ID is an HTML attribute.
const script = `try {
	const id = document.currentScript.dataset.announcementId;
	if (localStorage.getItem('${ANNOUNCEMENT_STORAGE_PREFIX}' + id) === 'dismissed') {
		document.documentElement.dataset.announcementDismissed = id;
	}
} catch {}`;

/** Replaces the app.html placeholder before the body is parsed. Pass the same ID as the banner. */
export function injectAnnouncementBannerBoot(html: string, id?: string): string {
	if (id === undefined) return html.replace('%yesid.announcementBannerBoot%', '');
	const attribute = id.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
	return html.replace(
		'%yesid.announcementBannerBoot%',
		() => `<script data-announcement-id="${attribute}">${script}</script>`,
	);
}
