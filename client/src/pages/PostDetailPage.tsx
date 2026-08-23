import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { comments as commentsApi, posts } from '../api/resources';
import type { Comment, Paginated, Post } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/useAuth';
import { Pagination } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { Empty, ErrorMessage } from '../components/Message';

export function PostDetailPage() {
    const { id } = useParams();
    const postId = Number(id);
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [page, setPage] = useState(1);
    const [draft, setDraft] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDraft, setEditDraft] = useState('');
    const [actionError, setActionError] = useState<ApiError | null>(null);
    const [busy, setBusy] = useState(false);

    const loadPost = useCallback(
        (signal: AbortSignal) => posts.find(postId, signal),
        [postId],
    );
    const loadComments = useCallback(
        (signal: AbortSignal) => commentsApi.list(postId, { page }, signal),
        [postId, page],
    );

    const post = useAsync<Post>(loadPost, [postId]);
    const thread = useAsync<Paginated<Comment>>(loadComments, [postId, page]);

    async function run(action: () => Promise<unknown>) {
        setBusy(true);
        setActionError(null);

        try {
            await action();
            thread.reload();
        } catch (cause) {
            setActionError(cause as ApiError);
        } finally {
            setBusy(false);
        }
    }

    async function addComment(event: FormEvent) {
        event.preventDefault();
        await run(async () => {
            await commentsApi.create(postId, draft);
            setDraft('');

            // A new comment lands at the end of the oldest-first thread, so
            // jump to the page that now holds it. Computed from the total
            // rather than read off meta.pages, which is 0 for a thread that
            // had no comments — and the API rejects page=0.
            const { total = 0, limit = 20 } = thread.data?.meta ?? {};
            setPage(Math.max(1, Math.ceil((total + 1) / limit)));
        });
    }

    if (post.loading) {
        return <Spinner label="Loading post" />;
    }

    if (post.error || !post.data) {
        return <ErrorMessage error={post.error} />;
    }

    const article = post.data;
    const mine = profile?.user.id === article.author.id;

    return (
        <>
            <article className="card">
                <div className="page-head">
                    <h1>{article.title}</h1>
                    {mine && (
                        <span className="actions">
                            <Link
                                to={`/posts/${article.id}/edit`}
                                className="button button--ghost"
                            >
                                Edit
                            </Link>
                            <button
                                type="button"
                                className="button--danger"
                                disabled={busy}
                                onClick={() =>
                                    void run(async () => {
                                        await posts.remove(article.id);
                                        navigate('/posts');
                                    })
                                }
                            >
                                Delete
                            </button>
                        </span>
                    )}
                </div>
                <p className="byline">
                    {article.author.username} ·{' '}
                    {new Date(article.createdAt).toLocaleString()}
                </p>
                <p className="post-body">{article.body}</p>
            </article>

            <h2>
                Comments{' '}
                {thread.data && (
                    <span className="muted">({thread.data.meta.total})</span>
                )}
            </h2>

            <ErrorMessage error={actionError ?? thread.error} />

            {profile ? (
                <form className="form-card" onSubmit={addComment}>
                    <p className="field">
                        <label htmlFor="comment">Add a comment</label>
                        <textarea
                            id="comment"
                            value={draft}
                            minLength={3}
                            maxLength={500}
                            required
                            style={{ minHeight: '5rem' }}
                            onChange={(event) => setDraft(event.target.value)}
                        />
                    </p>
                    <button type="submit" disabled={busy || draft.length < 3}>
                        Post comment
                    </button>
                </form>
            ) : (
                <p className="muted">
                    <Link to="/login">Sign in</Link> to join the discussion.
                </p>
            )}

            {thread.loading && !thread.data && <Spinner label="Loading" />}
            {thread.data?.data.length === 0 && <Empty>No comments yet.</Empty>}

            {thread.data?.data.map((comment) => {
                const own = profile?.user.id === comment.author.id;

                return (
                    <div className="comment" key={comment.id}>
                        <div className="comment__body">
                            <span className="byline">
                                {comment.author.username} ·{' '}
                                {new Date(
                                    comment.createdAt,
                                ).toLocaleDateString()}
                            </span>

                            {editingId === comment.id ? (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void run(async () => {
                                            await commentsApi.update(
                                                postId,
                                                comment.id,
                                                editDraft,
                                            );
                                            setEditingId(null);
                                        });
                                    }}
                                >
                                    <textarea
                                        value={editDraft}
                                        minLength={3}
                                        maxLength={500}
                                        style={{ minHeight: '4rem' }}
                                        onChange={(event) =>
                                            setEditDraft(event.target.value)
                                        }
                                    />
                                    <span className="actions">
                                        <button type="submit" disabled={busy}>
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            className="button--ghost"
                                            onClick={() => setEditingId(null)}
                                        >
                                            Cancel
                                        </button>
                                    </span>
                                </form>
                            ) : (
                                <>
                                    <p>{comment.body}</p>
                                    {own && (
                                        <span className="actions">
                                            <button
                                                type="button"
                                                className="button--ghost"
                                                onClick={() => {
                                                    setEditingId(comment.id);
                                                    setEditDraft(comment.body);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="button--danger"
                                                disabled={busy}
                                                onClick={() =>
                                                    void run(() =>
                                                        commentsApi.remove(
                                                            postId,
                                                            comment.id,
                                                        ),
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                );
            })}

            {thread.data && (
                <Pagination meta={thread.data.meta} onChange={setPage} />
            )}
        </>
    );
}
