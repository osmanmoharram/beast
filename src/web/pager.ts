import { PaginationMeta } from '../common/types/paginated';

export type PageLink = { page: number; url: string; current: boolean };

export type Pager = {
    show: boolean;
    total: number;
    page: number;
    pages: number;
    previousUrl: string | null;
    nextUrl: string | null;
    links: PageLink[];
};

/** How many numbered links to show around the current page. */
const WINDOW = 2;

/**
 * Turns the API's pagination meta into links a template can render without
 * doing any arithmetic — Handlebars deliberately cannot add two numbers, so
 * every URL a pager needs is built here.
 */
export function pagerOf(
    meta: PaginationMeta,
    path: string,
    query: Record<string, string | undefined> = {},
): Pager {
    const url = (page: number): string => {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== '') {
                params.set(key, value);
            }
        }

        if (page > 1) {
            params.set('page', String(page));
        }

        const queryString = params.toString();

        return queryString ? `${path}?${queryString}` : path;
    };

    const first = Math.max(1, meta.page - WINDOW);
    const last = Math.min(meta.pages, meta.page + WINDOW);
    const links: PageLink[] = [];

    for (let page = first; page <= last; page++) {
        links.push({ page, url: url(page), current: page === meta.page });
    }

    return {
        show: meta.pages > 1,
        total: meta.total,
        page: meta.page,
        pages: meta.pages,
        previousUrl: meta.page > 1 ? url(meta.page - 1) : null,
        nextUrl: meta.page < meta.pages ? url(meta.page + 1) : null,
        links,
    };
}
