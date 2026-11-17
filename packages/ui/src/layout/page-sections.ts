import { getContext, setContext } from 'svelte';

/**
 * The divider a `PageSections` draws between its sections. `dimension` is THE divider (D22); the
 * owner's 16 November 2026 ruling makes `hand-drawn` the yesid.dev page default at adoption, and
 * `hazard` is the kit tape kept for existing callers. Every value is a `Separator` variant.
 */
export type PageDivider = 'dimension' | 'hand-drawn' | 'hazard';

/**
 * The section registry behind `PageSections` and `PageSection` (D22). Every registered section
 * except the first is preceded by its boundary, so every section but the last ends with the
 * page's divider and none sits before the footer. Order is registration order, which is document
 * order on the server and during hydration; once mounted, sections re-sort by document position,
 * so a section that mounts later still lands in its place. `divider` is a getter so a section reads
 * its parent's current choice and follows a change to the `PageSections` prop.
 */
export interface PageSectionEntry {
	element: HTMLElement | null;
	setFirst(first: boolean): void;
}

export interface PageSectionsRegistry {
	register(entry: PageSectionEntry): () => void;
	isFirst(entry: PageSectionEntry): boolean;
	refresh(): void;
	divider(): PageDivider;
}

const SECTIONS = Symbol('yesid-page-sections');
const SECTION = Symbol('yesid-page-section');

export function createPageSectionsRegistry(
	divider: () => PageDivider = () => 'dimension',
): PageSectionsRegistry {
	const entries: PageSectionEntry[] = [];
	const ordered = (): PageSectionEntry[] => {
		if (!entries.every((entry) => entry.element?.isConnected)) return entries;
		return [...entries].sort((a, b) =>
			a.element!.compareDocumentPosition(b.element!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
		);
	};
	const refresh = () => ordered().forEach((entry, index) => entry.setFirst(index === 0));
	return {
		register(entry) {
			entries.push(entry);
			return () => {
				const index = entries.indexOf(entry);
				if (index >= 0) entries.splice(index, 1);
				refresh();
			};
		},
		isFirst: (entry) => ordered()[0] === entry,
		refresh,
		divider,
	};
}

export const providePageSections = (registry: PageSectionsRegistry): void => {
	setContext(SECTIONS, registry);
};

export const pageSectionsRegistry = (): PageSectionsRegistry | undefined =>
	getContext<PageSectionsRegistry | undefined>(SECTIONS);

/** Marks content inside a registered page section, so a `PageSection` nested in it stays plain. */
export const provideInsidePageSection = (inside: boolean): void => {
	setContext(SECTION, inside);
};

export const insidePageSection = (): boolean => getContext<boolean | undefined>(SECTION) === true;
