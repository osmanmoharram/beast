import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { profiles } from '../api/resources';
import { useAuth } from '../auth/useAuth';
import { Avatar } from '../components/Avatar';
import { Field } from '../components/Field';
import { ErrorMessage, Notice } from '../components/Message';

/**
 * Deliberately wider than the four types the server stores. `accept` only
 * filters what the operating system's file dialog offers, and a narrow list is
 * how a perfectly good picture ends up greyed out and unselectable — the file
 * dialog opens, nothing can be chosen, and the control looks broken. The real
 * gate is the server, which checks the image's magic numbers rather than
 * trusting any of this.
 */
const ACCEPTED = 'image/*';

/** What the server's four supported types come out as. */
const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Matches UPLOADS_MAX_FILE_SIZE on the server. */
const MAX_BYTES = 2 * 1024 * 1024;

export function MyProfilePage() {
    const { profile, setProfile } = useAuth();
    const fileInput = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState<ApiError | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    /** Rejections found before anything is sent, so they have no ApiError. */
    const [localError, setLocalError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName);
            // <input type="date"> wants exactly YYYY-MM-DD.
            setBirthDate(profile.birthDate?.slice(0, 10) ?? '');
        }
    }, [profile]);

    if (!profile) {
        return null;
    }

    async function run(action: () => Promise<void>, done: string) {
        setBusy(true);
        setError(null);
        setNotice(null);

        try {
            await action();
            setNotice(done);
        } catch (cause) {
            setError(cause as ApiError);
        } finally {
            setBusy(false);
        }
    }

    async function save(event: FormEvent) {
        event.preventDefault();

        await run(async () => {
            await profiles.update(profile!.id, {
                displayName,
                // Sending an empty string would fail @IsDate; omit instead.
                birthDate: birthDate || undefined,
            });
            // PATCH answers with a success envelope rather than the row, so
            // the refreshed profile has to be fetched to update the header.
            setProfile(await profiles.me());
        }, 'Profile saved.');
    }

    /**
     * Clearing the input is in a `finally` rather than after a successful
     * upload, and it is what makes a second attempt possible at all: a file
     * input fires `change` only when the selection actually changes, so
     * re-picking the same file after a failure is a no-op — the click opens
     * the dialog, the file is chosen, and absolutely nothing happens. Wiping
     * the value means every pick is a change.
     */
    async function upload(file: File) {
        try {
            const rejection = reject(file);

            // Checked here as well as on the server so a 3 MB photo is refused
            // instantly, instead of being uploaded in full to earn a 413.
            if (rejection) {
                setError(null);
                setNotice(null);
                setLocalError(rejection);
                return;
            }

            setLocalError(null);

            await run(async () => {
                setProfile(await profiles.uploadAvatar(file));
            }, 'Avatar updated.');
        } finally {
            if (fileInput.current) {
                fileInput.current.value = '';
            }
        }
    }

    function reject(file: File): string | null {
        if (file.size > MAX_BYTES) {
            const mb = (file.size / 1024 / 1024).toFixed(1);

            return `That image is ${mb} MB. The limit is 2 MB.`;
        }

        // An empty type means the browser could not tell; let the server,
        // which reads the bytes, be the judge rather than refusing here.
        if (file.type && !SUPPORTED.includes(file.type)) {
            return `${file.type} is not supported. Use JPEG, PNG, WebP or GIF.`;
        }

        return null;
    }

    return (
        <>
            <h1>Your profile</h1>

            <ErrorMessage error={error} />
            {localError && (
                <div className="message message--error" role="alert">
                    {localError}
                </div>
            )}
            {notice && <Notice>{notice}</Notice>}

            <section className="form-card" style={{ marginBottom: '1rem' }}>
                <div className="byline" style={{ marginBottom: '0.75rem' }}>
                    <Avatar
                        src={profile.avatarUrl}
                        name={profile.displayName}
                        size={72}
                    />
                    <span>
                        <strong>{profile.displayName}</strong>
                        <br />@{profile.user.username}
                    </span>
                </div>

                <p className="field">
                    <label htmlFor="avatar">Avatar</label>
                    <input
                        id="avatar"
                        ref={fileInput}
                        type="file"
                        accept={ACCEPTED}
                        disabled={busy}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                void upload(file);
                            }
                        }}
                    />
                    <small className="muted">
                        {busy
                            ? 'Uploading…'
                            : 'JPEG, PNG, WebP or GIF, up to 2 MB. Without one ' +
                              'you get a Gravatar generated from your email.'}
                    </small>
                </p>

                <button
                    type="button"
                    className="button--danger"
                    disabled={busy}
                    onClick={() =>
                        void run(async () => {
                            setProfile(await profiles.removeAvatar());
                        }, 'Avatar removed.')
                    }
                >
                    Remove avatar
                </button>
            </section>

            <form className="form-card" onSubmit={save} noValidate>
                <Field
                    id="displayName"
                    label="Display name"
                    value={displayName}
                    maxLength={100}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                />
                <Field
                    id="birthDate"
                    label="Birth date"
                    type="date"
                    value={birthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setBirthDate(event.target.value)}
                />
                <button type="submit" disabled={busy}>
                    Save changes
                </button>
            </form>
        </>
    );
}
