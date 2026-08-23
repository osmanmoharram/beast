import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { profiles } from '../api/resources';
import type { Paginated, Profile } from '../api/types';
import { useAsync } from '../hooks/useAsync';
import { Avatar } from '../components/Avatar';
import { Pagination } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { Empty, ErrorMessage } from '../components/Message';

export function ProfilesPage() {
    const [page, setPage] = useState(1);
    const load = useCallback(
        (signal: AbortSignal) => profiles.list({ page }, signal),
        [page],
    );
    const { data, error, loading } = useAsync<Paginated<Profile>>(load, [page]);

    return (
        <>
            <h1>People</h1>
            <ErrorMessage error={error} />
            {loading && !data && <Spinner label="Loading people" />}
            {data?.data.length === 0 && <Empty>Nobody here yet.</Empty>}

            {data?.data.map((profile) => (
                <article className="card" key={profile.id}>
                    <div className="byline">
                        <Avatar
                            src={profile.avatarUrl}
                            name={profile.displayName}
                        />
                        <span>
                            <Link to={`/profiles/${profile.id}`}>
                                <strong>{profile.displayName}</strong>
                            </Link>
                            <br />@{profile.user.username}
                        </span>
                    </div>
                </article>
            ))}

            {data && <Pagination meta={data.meta} onChange={setPage} />}
        </>
    );
}
