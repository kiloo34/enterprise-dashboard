/**
 * Centralized API Utility
 *
 * Handles all outgoing fetch requests with consistent headers,
 * authentication tokens, and error handling.
 *
 * Throws `ApiError` for non-2xx responses — consumers can:
 *   - Check `error.status` for the HTTP code
 *   - Check `error.fieldErrors` for Laravel validation field errors (422)
 *   - Check `error.code` for app-level error codes
 */

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
}

export async function api<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...rest } = options;

    // Construct URL — supports both relative (/api/...) and absolute (http://...) paths.
    // Intelligently handle cases where both BASE_URL and endpoint might have "/api"
    let rawUrl = "";
    const cleanBase = BASE_URL.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    if (cleanBase.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
        // Remove duplicate /api
        rawUrl = `${cleanBase}${cleanEndpoint.substring(4)}`;
    } else {
        rawUrl = `${cleanBase}${cleanEndpoint}`;
    }
    
    // Fallback if BASE_URL is empty: use absolute origin to bypass Next.js internal proxy timeout limit 
    if (!cleanBase && typeof window !== 'undefined') {
        const origin = window.location.origin; // e.g. http://localhost:80
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

    // Get Auth Token
    const authData = typeof window !== "undefined" ? sessionStorage.getItem("auth-user") : null;
    let token = "";
    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            token = parsed.accessToken || "";
        } catch (e) {
            console.error("Failed to parse auth data for API token", e);
        }
    }

    // Default Headers (Use a headers object we can mutate easily)
    const requestHeaders = new Headers(headers as HeadersInit);

    if (!requestHeaders.has("Accept")) {
        requestHeaders.set("Accept", "application/json");
    }

    if (token) {
        requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    // Handle Content-Type specifically for FormData
    const isFormData = rest.body instanceof FormData;
    if (isFormData) {
        // Let the browser set the Content-Type automatically with boundaries
        requestHeaders.delete("Content-Type");
    } else if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
        ...rest,
        headers: requestHeaders,
    };

    try {
        const response = await fetch(url.toString(), config);

        if (response.status === 401) {
            // Removed forced redirect to allow components to handle 401 gracefully
            throw new ApiError("Sesi Anda telah berakhir atau tidak valid (401 Unauthorized)", 401);
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));

            // Laravel validation errors (422) contain per-field messages
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
        // Re-throw ApiError as-is; wrap unknown errors
        if (error instanceof ApiError) throw error;
        console.error(`API Request to ${endpoint} failed:`, error);
        throw new ApiError(
            error instanceof Error ? error.message : 'Network error',
            0
        );
    }
}
