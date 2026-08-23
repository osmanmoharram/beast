import { useEffect, useState } from 'react';

/**
 * Holds a value back until it stops changing, so typing a six-letter search
 * term costs one request instead of six.
 */
export function useDebounced<T>(value: T, delay = 300): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
