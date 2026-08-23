import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { posts } from '../api/resources';
import type { Paginated, Post } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { useDebounced } from '../hooks/useDebounced';
import { useAuth } from '../auth/useAuth';
import { Pagination } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { Empty, ErrorMessage } from '../components/Message';

function excerpt(body: string, limit = 180) {
    return body.length > limit ? `${body.slice(0, limit).trimEnd()}…` : body;
}

export function PostsPage() {
    const { profile } = useAuth();

    /**
     * Page and query live in the URL rather than in state, so a search can be
     * bookmarked, shared and survive the back button — the three things a list
     * screen loses by keeping them in memory.
     */
    const [params, setParams] = useSearchParams();
    const page = Number(params.get('page') ?? 1);
    const q = params.get('q') ?? '';

    // Kept separately so the input stays responsive while the request that
    // the debounced value triggers is still in flight.
    const [term, setTerm] = useState(q);
    const debounced = useDebounced(term);

    const load = useCallback(
        (signal: AbortSignal) =>
            posts.list({ q: debounced || undefined, page }, signal),
        [debounced, page],
    );

    const { data, error, loading } = useAsync<Paginated<Post>>(load, [
        debounced,
        page,
    ]);

    function search(value: string) {
        setTerm(value);
        // Back to the first page: page 7 of the old results says nothing
        // about the new ones.
        setParams(value ? { q: value } : {}, { replace: true });
    }

    return (
        <>
            <div className="page-head">
                <h1>Posts</h1>
                {profile && (
                    <Link to="/posts/new" className="button">
                        Write a post
                    </Link>
                )}
            </div>

            <div className="search">
                <input
                    type="search"
                    value={term}
                    placeholder="Search titles and bodies…"
                    aria-label="Search posts"
                    onChange={(event) => search(event.target.value)}
                />
            </div>

            <ErrorMessage error={error} />

            {loading && !data && <Spinner label="Loading posts" />}

            {data && data.data.length === 0 && (
                <Empty>
                    {debounced
                        ? `Nothing matches “${debounced}”.`
                        : 'No posts yet.'}
                </Empty>
            )}

            {data?.data.map((post) => (
                <article className="card" key={post.id}>
                    <h2>
                        <Link to={`/posts/${post.id}`}>{post.title}</Link>
                    </h2>
                    {/* No avatar here: /posts returns the author's id,
                        username and email but no avatarUrl, and deriving a
                        Gravatar in the browser would duplicate the hashing
                        the server already does for /profiles. */}
                    <p className="byline">
                        {post.author.username} ·{' '}
                        {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <p className="excerpt">{excerpt(post.body)}</p>
                </article>
            ))}

            {data && (
                <Pagination
                    meta={data.meta}
                    onChange={(next) => {
                        const updated = new URLSearchParams(params);
                        updated.set('page', String(next));
                        setParams(updated);
                        window.scrollTo({ top: 0 });
                    }}
                />
            )}
        </>
    );
}
