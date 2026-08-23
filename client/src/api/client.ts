const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Where the token lives. localStorage is readable by any script on the page,
 * so an XSS bug hands an attacker a valid session — the accepted trade for a
 * bearer-token API with no refresh flow. Moving to an httpOnly cookie is a
 * server change (a refresh endpoint and a Set-Cookie), not a client one.
 */
const TOKEN_KEY = 'beast.accessToken';

export const tokenStore = {
    read: (): string | null => localStorage.getItem(TOKEN_KEY),
    write: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * Nest answers a failed request with `message` as either a string or, when
 * ValidationPipe rejected the body, an array of one string per broken rule.
 */
type ErrorBody = {
    message?: string | string[];
    error?: string;
    statusCode?: number;
};

export class ApiError extends Error {
    readonly status: number;

    /** Every validation message, for a form that wants to list them all. */
    readonly messages: string[];

    constructor(status: number, messages: string[]) {
        super(messages[0] ?? `Request failed with status ${status}`);
        this.name = 'ApiError';
        this.status = status;
        this.messages = messages;
    }

    /** A 401 means the token is missing, expired or malformed. */
    get isUnauthorized(): boolean {
        return this.status === 401;
    }
}

async function toApiError(response: Response): Promise<ApiError> {
    let body: ErrorBody = {};

    try {
        body = (await response.json()) as ErrorBody;
    } catch {
        // A gateway or a crash can answer with something that is not JSON;
        // the status is still worth reporting.
    }

    const { message } = body;
    const messages =
        typeof message === 'string'
            ? [message]
            : Array.isArray(message) && message.length > 0
              ? message
              : [response.statusText || 'Request failed'];

    return new ApiError(response.status, messages);
}

type RequestOptions = {
    method?: string;
    /** Serialised as JSON. Use `form` for multipart instead. */
    body?: unknown;
    form?: FormData;
    signal?: AbortSignal;
};

async function request<T>(
    path: string,
    { method = 'GET', body, form, signal }: RequestOptions = {},
): Promise<T> {
    const token = tokenStore.read();
    const headers: Record<string, string> = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Content-Type is set only for JSON. Letting the browser set it for
    // FormData is not a style choice: multipart needs a boundary parameter
    // that only the browser knows, and overriding the header drops it.
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
        signal,
    });

    if (!response.ok) {
        throw await toApiError(response);
    }

    // 204, and any other empty body, would make response.json() throw.
    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

export const api = {
    get: <T>(path: string, signal?: AbortSignal) =>
        request<T>(path, { signal }),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'POST', body }),
    postForm: <T>(path: string, form: FormData) =>
        request<T>(path, { method: 'POST', form }),
    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Builds `?page=1&limit=20`, dropping anything undefined or blank so a
 * cleared search box does not send `q=` and match on the empty string.
 */
export function query(params: Record<string, string | number | undefined>) {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
            search.set(key, String(value));
        }
    }

    const queryString = search.toString();

    return queryString ? `?${queryString}` : '';
}
