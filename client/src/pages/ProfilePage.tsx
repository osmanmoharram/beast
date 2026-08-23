import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { profiles } from '../api/resources';
import type { Profile } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { ErrorMessage } from '../components/Message';

export function ProfilePage() {
    const { id } = useParams();
    const profileId = Number(id);
    const load = useCallback(
        (signal: AbortSignal) => profiles.find(profileId, signal),
        [profileId],
    );
    const { data, error, loading } = useAsync<Profile>(load, [profileId]);

    if (loading) {
        return <Spinner label="Loading profile" />;
    }

    if (error || !data) {
        return <ErrorMessage error={error} />;
    }

    return (
        <article className="card">
            <div className="byline">
                <Avatar src={data.avatarUrl} name={data.displayName} size={72} />
                <span>
                    <h1 style={{ margin: 0 }}>{data.displayName}</h1>@
                    {data.user.username}
                </span>
            </div>
            {data.birthDate && (
                <p className="muted">
                    Born {new Date(data.birthDate).toLocaleDateString()}
                </p>
            )}
            <p className="muted">
                Joined {new Date(data.createdAt).toLocaleDateString()}
            </p>
        </article>
    );
}
