import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { ErrorMessage } from '../components/Message';
import { Field } from '../components/Field';

type RedirectState = { from?: { pathname: string } };

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<ApiError | null>(null);
    const [busy, setBusy] = useState(false);

    // Where RequireAuth turned them away from, if that is how they got here.
    const target =
        (location.state as RedirectState | null)?.from?.pathname ?? '/posts';

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);

        try {
            await login(email, password);
            navigate(target, { replace: true });
        } catch (cause) {
            setError(cause as ApiError);
            setBusy(false);
        }
    }

    return (
        <div className="narrow">
            <h1>Sign in</h1>
            <form className="form-card" onSubmit={submit} noValidate>
                <ErrorMessage error={error} />
                <Field
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Field
                    id="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={busy}>
                    {busy ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
            <p className="muted" style={{ textAlign: 'center' }}>
                No account yet? <Link to="/register">Create one</Link>
            </p>
        </div>
    );
}
