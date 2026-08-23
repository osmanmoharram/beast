import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import { profiles } from '../api/resources';
import { useAuth } from '../auth/useAuth';
import { Avatar } from '../components/Avatar';
import { Field } from '../components/Field';
import { ErrorMessage, Notice } from '../components/Message';

/** Mirrors the server's accepted image types. */
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif';

export function MyProfilePage() {
    const { profile, setProfile } = useAuth();
    const fileInput = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState<ApiError | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
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

    async function upload(file: File) {
        await run(async () => {
            setProfile(await profiles.uploadAvatar(file));
            if (fileInput.current) {
                fileInput.current.value = '';
            }
        }, 'Avatar updated.');
    }

    return (
        <>
            <h1>Your profile</h1>

            <ErrorMessage error={error} />
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
                        JPEG, PNG, WebP or GIF, up to 2 MB. Without one you get
                        a Gravatar generated from your email.
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
