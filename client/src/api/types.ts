/**
 * The shapes the Nest API answers with. Hand-written rather than generated:
 * the server has no OpenAPI output yet, so these are the contract until it
 * does, and a mismatch shows up here rather than three components deep.
 */

export type UserSummary = {
    id: number;
    username: string;
    email: string;
};

export type Profile = {
    id: number;
    displayName: string;
    /** Always present: the API falls back to a generated Gravatar. */
    avatarUrl: string;
    birthDate: string | null;
    user: UserSummary;
    createdAt: string;
    updatedAt: string;
};

/**
 * The profile as it arrives nested in an auth reply. It has no `user`: the
 * parent object is the user, and serialising the link back would be a cycle.
 * /profiles/me returns the full Profile instead, so the two are not the same
 * shape and the difference has to survive into the types — reading
 * `profile.user` off this one is how it silently becomes undefined.
 */
export type NestedProfile = Omit<Profile, 'user'>;

export type User = UserSummary & {
    profile: NestedProfile;
    createdAt: string;
    updatedAt: string;
};

export type Post = {
    id: number;
    title: string;
    body: string;
    author: UserSummary;
    createdAt: string;
    updatedAt: string;
};

export type Comment = {
    id: number;
    body: string;
    author: UserSummary;
    createdAt: string;
    updatedAt: string;
};

export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    pages: number;
};

export type Paginated<T> = {
    data: T[];
    meta: PaginationMeta;
};

export type AuthResponse = {
    user: User;
    accessToken: string;
};

export type SuccessResponse = {
    code: number;
    message: string;
};
