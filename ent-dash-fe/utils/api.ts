import { toast } from 'sonner';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Structured error type ────────────────────────────────────────────────────
export class ApiError extends Error {
    status: number;
    code?: string;
    /** Per-field validation errors, keyed by field name (from Laravel 422 responses) */
    fieldErrors?: Record<string, string[]>;

    constructor(
        message: string,
        status: number,
        options?: { code?: string; fieldErrors?: Record<string, string[]> }
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = options?.code;
        this.fieldErrors = options?.fieldErrors;
    }
}

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
    /** Whether to show a global error toast. Defaults to true. Set to false to handle errors locally. */
    showErrorToast?: boolean;
}

export async function api<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, showErrorToast = true, ...rest } = options;

    let rawUrl = "";
    const cleanBase = BASE_URL.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    if (cleanBase.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
        rawUrl = `${cleanBase}${cleanEndpoint.substring(4)}`;
    } else {
        rawUrl = `${cleanBase}${cleanEndpoint}`;
    }
    
    if (!cleanBase && typeof window !== 'undefined') {
        const origin = window.location.origin;
        rawUrl = `${origin}${cleanEndpoint}`;
    } else if (!cleanBase) {
        rawUrl = endpoint;
    }

    let urlWithParams = rawUrl;
    if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        urlWithParams = `${rawUrl}?${searchParams.toString()}`;
    }
    const url = urlWithParams;

    // K3 fix: Ambil token dari memory (window.__getAuthToken) — bukan dari sessionStorage.
    // __getAuthToken di-expose oleh AuthContext via useRef, aman dari XSS.
    let token = "";
    if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memToken = (window as any).__getAuthToken?.();
        if (memToken) {
            token = memToken;
        }
    }


    const requestHeaders = new Headers(headers as HeadersInit);

    if (!requestHeaders.has("Accept")) {
        requestHeaders.set("Accept", "application/json");
    }

    if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    const isFormData = rest.body instanceof FormData;
    if (isFormData) {
        requestHeaders.delete("Content-Type");
    } else if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
        ...rest,
        headers: requestHeaders,
        credentials: rest.credentials || "include", // K2 fix: Always send cookies (refresh_token)
    };

    try {
        const response = await fetch(url.toString(), config);

        if (response.status === 401) {
            // Prevent infinite loop if the request that failed WAS the refresh request
            if (url.toString().includes('/api/auth/refresh')) {
                if (typeof window !== "undefined") {
                    sessionStorage.removeItem("auth-user");
                    sessionStorage.removeItem("auth-profile");
                    if (!window.location.pathname.startsWith('/login')) {
                        window.location.href = "/login?session_expired=1";
                    }
                }
                throw new ApiError("Sesi Anda telah berakhir. Silakan login kembali.", 401);
            }

            // K2 fix: Attempt Silent Refresh
            try {
                // Gunakan native fetch untuk menghindari circular dependency dengan AuthService
                const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });

                // ── Refresh returned a non-2xx (e.g. 401 = token truly expired) ──
                if (!refreshRes.ok) {
                    // Only invalidate session when the refresh token is actually rejected (4xx)
                    // A 5xx means the auth service is down — don't log the user out.
                    if (refreshRes.status >= 400 && refreshRes.status < 500) {
                        if (typeof window !== "undefined") {
                            sessionStorage.removeItem("auth-user");
                            sessionStorage.removeItem("auth-profile");
                            if (!window.location.pathname.startsWith('/login')) {
                                window.location.href = "/login?session_expired=1";
                            }
                        }
                        throw new ApiError("Sesi Anda telah berakhir. Silakan login kembali.", 401);
                    }
                    // 5xx / service down — propagate as a regular (non-session-ending) error
                    throw new ApiError(`Auth service unavailable (${refreshRes.status})`, refreshRes.status);
                }

                const refreshData = await refreshRes.json();
                const newToken = refreshData.access_token;

                // Update token in memory
                if (typeof window !== "undefined") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((window as any).__setAuthToken) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (window as any).__setAuthToken(newToken);
                    }
                }

                // Retry original request with new token
                requestHeaders.set("Authorization", `Bearer ${newToken}`);
                const retryConfig = { ...config, headers: requestHeaders };
                const retryResponse = await fetch(url.toString(), retryConfig);
                
                if (!retryResponse.ok) {
                     throw new Error("Retry failed"); // Fallback to normal error handling
                }
                
                return await retryResponse.json() as T;
            } catch (refreshError) {
                // ── Network error (ECONNRESET, Failed to fetch, etc.) ──
                // The auth service is unreachable — do NOT end the session.
                // Just propagate the error so the caller can show a toast.
                if (refreshError instanceof ApiError) {
                    throw refreshError; // Already handled above (either 4xx redirect or 5xx)
                }
                // TypeError / network failure — service is down, keep session alive
                throw new ApiError(
                    "Koneksi ke server gagal. Periksa jaringan Anda.",
                    0
                );
            }
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));

            if (response.status === 422 && errorBody.errors) {
                throw new ApiError(
                    errorBody.message || 'Validasi gagal',
                    422,
                    { fieldErrors: errorBody.errors, code: errorBody.code }
                );
            }

            throw new ApiError(
                errorBody.message || `HTTP error ${response.status}`,
                response.status,
                { code: errorBody.code }
            );
        }

        return await response.json() as T;
    } catch (error) {
        if (error instanceof ApiError) {
            // Global toast for non-validation errors
            if (showErrorToast && error.status !== 422 && error.status !== 401) {
                toast.error(error.message);
            }
            throw error;
        }
        
        const message = error instanceof Error ? error.message : 'Kesalahan Jaringan';
        if (showErrorToast) {
            toast.error(message);
        }
        
        throw new ApiError(message, 0);
    }
}

