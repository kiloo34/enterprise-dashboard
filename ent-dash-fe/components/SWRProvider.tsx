'use client';

import { SWRConfig } from 'swr';
import { toast } from 'sonner';
import { ApiError } from '../utils/api';

interface SWRProviderProps {
    children: React.ReactNode;
}

/**
 * Global SWR configuration provider.
 * Wrap around the app (or dashboard) to apply consistent fetching behavior:
 *  - deduplicates identical requests within 5 seconds
 *  - retries failed requests up to 2 times
 *  - shows a global toast on unhandled errors
 *  - redirects to /login on 401
 */
export function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                // Dedup identical in-flight requests within 5 s
                dedupingInterval: 5000,
                // Only retry twice before giving up
                errorRetryCount: 2,
                // Exponential back-off: 1st retry after 3 s, 2nd after 6 s
                errorRetryInterval: 3000,
                // Don't revalidate when user re-focuses the browser tab
                revalidateOnFocus: false,
                // Show a global toast for any error not handled by the consumer
                onError(error: unknown) {
                    if (error instanceof ApiError) {
                        // 401 is already handled in api.ts (redirect to /login)
                        if (error.status === 401) return;
                        // Suppress 422 — those are form validation errors, handled inline
                        if (error.status === 422) return;
                        toast.error(error.message || 'Terjadi kesalahan saat memuat data');
                    } else if (error instanceof Error) {
                        toast.error(error.message);
                    }
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
