import type { StatusMarkStatus } from './StatusMark.svelte';

const viewBox = '0 0 16 16';
const paths: Record<StatusMarkStatus, string> = {
	early: 'M2 4h12l-6 9z',
	on_time: 'M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 1 0 0-11z',
	late: 'M8 3l6 9H2z',
	severe: 'M8 2l6 6-6 6-6-6z',
	unknown: 'M8 2a6 6 0 1 0 0 12 6 6 0 1 0 0-12zM8 4a4 4 0 1 1 0 8 4 4 0 1 1 0-8z',
};

export function statusGlyph(status: StatusMarkStatus): { path: string; viewBox: string } {
	return { path: paths[status], viewBox };
}

function xmlAttribute(value: string): string {
	return value.replace(/[&<>"']/g, (character) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
	})[character]!);
}

export function statusGlyphSvg(
	status: StatusMarkStatus,
	options: { size: number; ink: string; halo?: string },
): string {
	const { path, viewBox } = statusGlyph(status);
	const size = Number.isFinite(options.size) && options.size > 0 ? options.size : 1;
	const outline = options.halo === undefined
		? ''
		: ` stroke="${xmlAttribute(options.halo)}" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke"`;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}"><path d="${path}" fill="${xmlAttribute(options.ink)}" fill-rule="evenodd"${outline}/></svg>`;
}
