import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { posts } from '../api/resources';
import type { Post } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { Field } from '../components/Field';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/Message';

/**
 * Serves both /posts/new and /posts/:id/edit — the two differ only in whether
 * the fields start empty and which call the submit makes.
 */
export function PostFormPage() {
    const { id } = useParams();
    const editing = id !== undefined;
    const postId = Number(id);
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState<ApiError | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(
        (signal: AbortSignal) =>
            editing
                ? posts.find(postId, signal)
                : Promise.resolve(null as Post | null),
        [editing, postId],
    );

    const existing = useAsync<Post | null>(load, [editing, postId]);

    useEffect(() => {
        if (existing.data) {
            setTitle(existing.data.title);
            setBody(existing.data.body);
        }
    }, [existing.data]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);

        try {
            if (editing) {
                await posts.update(postId, { title, body });
                navigate(`/posts/${postId}`);
            } else {
                const created = await posts.create({ title, body });
                navigate(`/posts/${created.id}`);
            }
        } catch (cause) {
            setError(cause as ApiError);
            setBusy(false);
        }
    }

    if (editing && existing.loading) {
        return <Spinner label="Loading post" />;
    }

    return (
        <>
            <h1>{editing ? 'Edit post' : 'Write a post'}</h1>
            <form className="form-card" onSubmit={submit} noValidate>
                <ErrorMessage error={error ?? existing.error} />
                <Field
                    id="title"
                    label="Title"
                    value={title}
                    minLength={3}
                    maxLength={150}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                />
                <p className="field">
                    <label htmlFor="body">Body</label>
                    <textarea
                        id="body"
                        value={body}
                        minLength={3}
                        maxLength={1000}
                        required
                        onChange={(event) => setBody(event.target.value)}
                    />
                    <small className="muted">
                        {body.length} / 1000 characters
                    </small>
                </p>
                <span className="actions">
                    <button type="submit" disabled={busy}>
                        {editing ? 'Save changes' : 'Publish'}
                    </button>
                    <button
                        type="button"
                        className="button--ghost"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                </span>
            </form>
        </>
    );
}
