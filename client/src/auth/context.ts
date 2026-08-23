import { createContext } from 'react';
import type { Profile } from '../api/types';
import type { RegisterInput } from '../api/resources';

export type AuthValue = {
    profile: Profile | null;
    /** False only while the stored token is being checked at startup. */
    ready: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => void;
    /** Replaces the cached profile after an edit or an avatar upload. */
    setProfile: (profile: Profile) => void;
};

/**
 * Kept apart from the provider component: a module that exports both a
 * component and a non-component breaks React Fast Refresh, which then reloads
 * the whole page on every edit instead of swapping the component.
 */
export const AuthContext = createContext<AuthValue | null>(null);
