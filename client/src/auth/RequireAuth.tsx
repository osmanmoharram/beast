import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { Spinner } from '../components/Spinner';

/**
 * Gate for the routes that need a session. It waits for the startup token
 * check rather than redirecting immediately — otherwise a reload on a
 * protected page bounces to the login screen before the app has worked out
 * that the visitor is already signed in.
 */
export function RequireAuth() {
    const { profile, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return <Spinner label="Checking your session" />;
    }

    if (!profile) {
        // `state` is what lets the login screen send them back where they
        // were aiming instead of dumping everyone on the home page.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
