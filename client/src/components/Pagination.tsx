import type { PaginationMeta } from '../api/types';

type PaginationProps = {
    meta: PaginationMeta;
    onChange: (page: number) => void;
};

export function Pagination({ meta, onChange }: PaginationProps) {
    const { page, pages, total } = meta;

    if (pages <= 1) {
        return null;
    }

    return (
        <nav className="pagination" aria-label="Pagination">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page <= 1}
            >
                ← Previous
            </button>
            <span>
                Page {page} of {pages}
                <small>{total.toLocaleString()} total</small>
            </span>
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page >= pages}
            >
                Next →
            </button>
        </nav>
    );
}
