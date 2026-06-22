/**
 * Auth Service
 *
 * Handles all authentication-related communication with the backend.
 * Following the Feature Service pattern from Unified Coding Rules.
 */

import { api } from "../utils/api";

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    user: {
        name: string;
        email: string;
        role: string;
        permissions: string[];
        unitCode: string | null;
        positionName: string | null;
        positionLevel: number | null;
        uiSettings?: {
            theme?: string;
            size?: string;
            language?: string;
        };
    };
}

interface RawLoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: LoginResponse["user"];
}

export class AuthService {
    /**
     * Submit login credentials to the backend.
     * The backend returns a token + full user profile in a single response.
     */
    static async login(email: string, password: string): Promise<LoginResponse> {
        const raw = await api<RawLoginResponse>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            credentials: "include", // Ensure cookie is saved
        });

        return {
            accessToken: raw.access_token,
            tokenType: raw.token_type,
            user: raw.user,
        };
    }

    /**
     * K2 fix: Request token baru menggunakan refresh token cookie
     */
    static async refreshToken(): Promise<LoginResponse> {
        const raw = await api<RawLoginResponse>("/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Important: send HttpOnly cookie
            showErrorToast: false, // Silent failure, handled by interceptor/AuthContext
        });

        return {
            accessToken: raw.access_token,
            tokenType: raw.token_type,
            user: raw.user,
        };
    }

    /**
     * Clear auth session in backend to remove cookie
     */
    static async logout(): Promise<void> {
        try {
            await api("/api/auth/logout", {
                method: "POST",
                credentials: "include",
                showErrorToast: false,
            });
        } catch (e) {
            console.error("Logout backend failed", e);
        }
    }
}
