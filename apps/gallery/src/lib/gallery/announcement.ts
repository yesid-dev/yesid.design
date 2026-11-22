export function announcementId(route: string | null, id?: string): string | undefined {
	return route === '/announcement-banner/[[id]]' && id !== 'none' ? id ?? 'first' : undefined;
}
