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
        });

        return {
            accessToken: raw.access_token,
            tokenType: raw.token_type,
            user: raw.user,
        };
    }

    /**
     * Clear auth session
     */
    static logout(): void {
        sessionStorage.removeItem("auth-user");
    }
}
