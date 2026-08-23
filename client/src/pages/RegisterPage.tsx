import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { ErrorMessage } from '../components/Message';
import { Field } from '../components/Field';

const EMPTY = {
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
};

export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY);
    const [error, setError] = useState<ApiError | null>(null);
    const [busy, setBusy] = useState(false);

    function update(field: keyof typeof EMPTY) {
        return (event: { target: { value: string } }) =>
            setForm((current) => ({
                ...current,
                [field]: event.target.value,
            }));
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);

        try {
            await register(form);
            navigate('/posts', { replace: true });
        } catch (cause) {
            setError(cause as ApiError);
            setBusy(false);
        }
    }

    return (
        <div className="narrow">
            <h1>Create account</h1>
            <form className="form-card" onSubmit={submit} noValidate>
                <ErrorMessage error={error} />
                <Field
                    id="displayName"
                    label="Display name"
                    value={form.displayName}
                    onChange={update('displayName')}
                    required
                />
                <Field
                    id="username"
                    label="Username"
                    // The API allows letters, numbers and underscores only.
                    pattern="[A-Za-z0-9_]+"
                    value={form.username}
                    onChange={update('username')}
                    required
                />
                <Field
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update('email')}
                    required
                />
                <Field
                    id="password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    minLength={3}
                    value={form.password}
                    onChange={update('password')}
                    required
                />
                <Field
                    id="confirm"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirm}
                    onChange={update('confirm')}
                    required
                />
                <button type="submit" disabled={busy}>
                    {busy ? 'Creating…' : 'Create account'}
                </button>
            </form>
            <p className="muted" style={{ textAlign: 'center' }}>
                Already registered? <Link to="/login">Sign in</Link>
            </p>
        </div>
    );
}
