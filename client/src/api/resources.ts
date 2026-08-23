import { api, query } from './client';
import type {
    AuthResponse,
    Comment,
    Paginated,
    Post,
    Profile,
    SuccessResponse,
} from './types';

export type RegisterInput = {
    displayName: string;
    username: string;
    email: string;
    password: string;
    confirm: string;
};

export const auth = {
    register: (input: RegisterInput) =>
        api.post<AuthResponse>('/auth/register', input),
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { email, password }),
};

export type PostInput = { title: string; body: string };

export const posts = {
    list: (
        params: { q?: string; page?: number; limit?: number },
        signal?: AbortSignal,
    ) => api.get<Paginated<Post>>(`/posts${query(params)}`, signal),
    find: (id: number, signal?: AbortSignal) =>
        api.get<Post>(`/posts/${id}`, signal),
    create: (input: PostInput) => api.post<Post>('/posts', input),
    update: (id: number, input: Partial<PostInput>) =>
        api.patch<SuccessResponse>(`/posts/${id}`, input),
    remove: (id: number) => api.delete<SuccessResponse>(`/posts/${id}`),
};

export const comments = {
    list: (
        postId: number,
        params: { page?: number; limit?: number },
        signal?: AbortSignal,
    ) =>
        api.get<Paginated<Comment>>(
            `/posts/${postId}/comments${query(params)}`,
            signal,
        ),
    create: (postId: number, body: string) =>
        api.post<Comment>(`/posts/${postId}/comments`, { body }),
    update: (postId: number, id: number, body: string) =>
        api.patch<SuccessResponse>(`/posts/${postId}/comments/${id}`, {
            body,
        }),
    remove: (postId: number, id: number) =>
        api.delete<SuccessResponse>(`/posts/${postId}/comments/${id}`),
};

export type ProfileInput = {
    displayName?: string;
    /** ISO date; the API validates that it is in the past. */
    birthDate?: string;
};

export const profiles = {
    list: (params: { page?: number; limit?: number }, signal?: AbortSignal) =>
        api.get<Paginated<Profile>>(`/profiles${query(params)}`, signal),
    me: (signal?: AbortSignal) => api.get<Profile>('/profiles/me', signal),
    find: (id: number, signal?: AbortSignal) =>
        api.get<Profile>(`/profiles/${id}`, signal),
    update: (id: number, input: ProfileInput) =>
        api.patch<SuccessResponse>(`/profiles/${id}`, input),
    uploadAvatar: (file: File) => {
        const form = new FormData();
        form.append('avatar', file);

        return api.postForm<Profile>('/profiles/me/avatar', form);
    },
    removeAvatar: () => api.delete<Profile>('/profiles/me/avatar'),
};
