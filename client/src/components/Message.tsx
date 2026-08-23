import type { ApiError } from '../api/client';

/**
 * Renders every message the API returned, not just the first: a rejected form
 * usually fails several rules at once, and showing one at a time turns fixing
 * it into a guessing game.
 */
export function ErrorMessage({ error }: { error: ApiError | null }) {
    if (!error) {
        return null;
    }

    return (
        <div className="message message--error" role="alert">
            {error.messages.length === 1 ? (
                error.messages[0]
            ) : (
                <ul>
                    {error.messages.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export function Notice({ children }: { children: React.ReactNode }) {
    return (
        <div className="message message--ok" role="status">
            {children}
        </div>
    );
}

export function Empty({ children }: { children: React.ReactNode }) {
    return <p className="state">{children}</p>;
}
