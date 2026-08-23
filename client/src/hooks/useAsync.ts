import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/client';

export type AsyncState<T> = {
    data: T | null;
    error: ApiError | null;
    loading: boolean;
    /** Refetches with the current inputs — used after a mutation. */
    reload: () => void;
};

/**
 * Runs a request whenever its dependencies change and reports the three states
 * a screen has to render. The AbortSignal is the point of the cleanup: without
 * it a slow first request can resolve after a fast second one and overwrite
 * newer data with older, which is exactly what a search box provokes.
 */
export function useAsync<T>(
    run: (signal: AbortSignal) => Promise<T>,
    deps: unknown[],
): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [loading, setLoading] = useState(true);
    const [nonce, setNonce] = useState(0);

    const reload = useCallback(() => setNonce((n) => n + 1), []);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        run(controller.signal)
            .then((result) => {
                if (!controller.signal.aborted) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    cause instanceof ApiError
                        ? cause
                        : new ApiError(0, [
                              cause instanceof Error
                                  ? cause.message
                                  : 'Network error',
                          ]),
                );
                setLoading(false);
            });

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, nonce]);

    return { data, error, loading, reload };
}
