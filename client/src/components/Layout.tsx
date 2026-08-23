import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Avatar } from './Avatar';

export function Layout() {
    const { profile, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="shell">
            <header className="topbar">
                <Link to="/" className="brand">
                    beast
                </Link>

                <nav className="topbar__nav">
                    <NavLink to="/posts">Posts</NavLink>
                    <NavLink to="/profiles">People</NavLink>
                </nav>

                <div className="topbar__account">
                    {profile ? (
                        <>
                            <Link to="/me" className="topbar__me">
                                <Avatar
                                    src={profile.avatarUrl}
                                    name={profile.displayName}
                                    size={32}
                                />
                                <span>{profile.displayName}</span>
                            </Link>
                            <button
                                type="button"
                                className="button button--ghost"
                                onClick={() => {
                                    logout();
                                    navigate('/posts');
                                }}
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Sign in</Link>
                            <Link to="/register" className="button">
                                Create account
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}
