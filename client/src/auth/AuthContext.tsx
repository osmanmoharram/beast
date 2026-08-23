import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { ApiError, setUnauthorizedHandler, tokenStore } from '../api/client';
import { auth as authApi, type RegisterInput } from '../api/resources';
import { profiles } from '../api/resources';
import type { Profile, User } from '../api/types';
import { AuthContext, type AuthValue } from './context';

/**
 * Rebuilds the full Profile from an auth reply. The nested profile omits its
 * `user`, but the parent of that object is exactly the user it belongs to, so
 * the missing half is already in hand — cheaper and more direct than a second
 * request to /profiles/me for something the login response just delivered.
 */
function profileOf(user: User): Profile {
    return {
        ...user.profile,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
        },
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [ready, setReady] = useState(false);

    /**
     * A token in localStorage survives a reload but says nothing about whether
     * it is still valid — it carries a one hour expiry. Asking the API who it
     * belongs to is what separates a real session from a stale string, so the
     * app does that once before rendering any route.
     */
    useEffect(() => {
        if (!tokenStore.read()) {
            setReady(true);
            return;
        }

        const controller = new AbortController();

        profiles
            .me(controller.signal)
            .then(setProfile)
            .catch((cause: unknown) => {
                if (cause instanceof ApiError && cause.isUnauthorized) {
                    tokenStore.clear();
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setReady(true);
                }
            });

        return () => controller.abort();
    }, []);

    /**
     * Ends the session as soon as any request reports the token is no longer
     * good. Clearing the profile is what RequireAuth watches, so the next
     * render sends them to the login form instead of leaving a signed-in
     * shell around screens that can only error.
     */
    useEffect(() => {
        setUnauthorizedHandler(() => {
            tokenStore.clear();
            setProfile(null);
        });

        return () => setUnauthorizedHandler(null);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { accessToken, user } = await authApi.login(email, password);
        tokenStore.write(accessToken);
        setProfile(profileOf(user));
    }, []);

    const register = useCallback(async (input: RegisterInput) => {
        const { accessToken, user } = await authApi.register(input);
        tokenStore.write(accessToken);
        setProfile(profileOf(user));
    }, []);

    const logout = useCallback(() => {
        // Nothing to call: the API issues stateless JWTs and keeps no session
        // to end, so signing out is forgetting the token.
        tokenStore.clear();
        setProfile(null);
    }, []);

    const value = useMemo<AuthValue>(
        () => ({ profile, ready, login, register, logout, setProfile }),
        [profile, ready, login, register, logout],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
