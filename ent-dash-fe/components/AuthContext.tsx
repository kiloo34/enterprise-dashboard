"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "../services/AuthService";
import { ApiError } from "../utils/api";

/**
 * Role names from backend (Spatie Permission).
 */
export type Role = "super-admin" | "admin" | "administrator" | "direksi" | "divisi-operasi" | "member" | null;

/**
 * User profile stored in sessionStorage — TANPA accessToken.
 * accessToken disimpan di memory (useRef) saja untuk mencegah XSS.
 *
 * K3 fix: Memisahkan token dari storage. Token hanya ada di memori JS runtime,
 * bukan di sessionStorage yang bisa dibaca XSS attack.
 */
interface UserProfile {
    email: string;
    name: string;
    role: Role;
    permissions: string[];
    unitCode: string | null;
    positionName: string | null;
    positionLevel: number | null;
    uiSettings?: {
        theme?: string;
        size?: string;
        language?: string;
    };
}

/**
 * Full user object dengan accessToken — hanya ada di React state (memory).
 */
interface User extends UserProfile {
    accessToken: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key constants — sentralisasi untuk menghindari typo
const PROFILE_KEY = "auth-profile"; // Hanya profile (tanpa token)

/**
 * Determine redirect path based on unit_code from backend.
 * - DIR_UTAMA → dashboard j-prime (direksi)
 * - DIV_OPS   → dashboard divisi operasi (rekon QRIS)
 * - others    → root (super-admin / admin management)
 */
export type UserInfoSubset = { role: Role; unitCode: string | null };

export function getRedirectPath(user: UserInfoSubset | null): string {
    if (!user) return "/login";

    // Priority 1: Superadmin/Admin always to the new Admin Dashboard
    if (user.role === "super-admin" || user.role === "admin" || user.role === "administrator") {
        return "/admin/dashboard";
    }

    // Priority 2: Unit-based redirect
    switch (user.unitCode) {
        case "DIR_UTAMA":
        case "DIR_TI":
        case "SEVP_TI":
        case "EDM":
            return "/direksi/kinerja-keuangan";
        case "DIV_OPS":
            return "/divisi-operasi/summary";
        default:
            return "/direksi/kinerja-keuangan"; // Fallback to avoid root loading loop
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    /**
     * K3 fix: accessToken disimpan di useRef (memory) SAJA.
     * Tidak masuk ke sessionStorage → aman dari XSS.
     * Konsekuensi: refresh browser akan logout user (user harus login ulang).
     * Trade-off yang acceptable untuk security yang lebih baik.
     */
    const tokenRef = useRef<string | null>(null);

    // Expose token getter/setter secara global sehingga utils/api.ts bisa akses tanpa
    // perlu melewati React context (yang hanya bisa dipakai di dalam komponen).
    if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__getAuthToken = () => tokenRef.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__setAuthToken = (token: string) => {
            tokenRef.current = token;
        };
    }

    useEffect(() => {
        const initAuth = async () => {
            const storedProfile = sessionStorage.getItem(PROFILE_KEY);
            if (storedProfile) {
                try {
                    const profile: UserProfile = JSON.parse(storedProfile);
                    // K2 fix: Coba dapatkan access token baru via silent refresh
                    // karena token di memory hilang setelah refresh halaman.
                    if (!tokenRef.current) {
                        try {
                            const response = await AuthService.refreshToken();
                            tokenRef.current = response.accessToken;
                            setUser({ ...profile, accessToken: response.accessToken });
                        } catch (e) {
                            // Only clear session for ACTUAL auth failures (401)
                            // Network errors (status 0) = IAM is temporarily down;
                            // keep the profile so the user isn't kicked out.
                            const isAuthError = e instanceof ApiError && (e.status === 401 || e.status === 403);
                            if (isAuthError) {
                                console.warn("Silent refresh: token invalid — clearing session.", e);
                                sessionStorage.removeItem(PROFILE_KEY);
                            } else {
                                // Service is temporarily unavailable — restore session from
                                // storage so the user stays logged in. The next API call
                                // that succeeds will repopulate the memory token.
                                console.warn("Silent refresh: service unavailable — keeping session.", e);
                                setUser({ ...profile, accessToken: "" });
                            }
                        }
                    } else {
                        setUser({ ...profile, accessToken: tokenRef.current });
                    }
                } catch {
                    sessionStorage.removeItem(PROFILE_KEY);
                }
            }
            setIsLoading(false);
        };
        
        initAuth();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        const response = await AuthService.login(email, password);

        // K3: Token hanya ke memory (tokenRef), tidak ke storage
        tokenRef.current = response.accessToken;

        const profile: UserProfile = {
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as Role,
            permissions: response.user.permissions || [],
            unitCode: response.user.unitCode,
            positionName: response.user.positionName,
            positionLevel: response.user.positionLevel,
            uiSettings: response.user.uiSettings,
        };

        const newUser: User = { ...profile, accessToken: response.accessToken };

        setUser(newUser);
        // Simpan hanya profile (tanpa token) ke sessionStorage
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

        router.push(getRedirectPath(newUser));
    };

    const logout = async () => {
        tokenRef.current = null;
        setUser(null);
        sessionStorage.removeItem(PROFILE_KEY);
        await AuthService.logout(); // K2: Clear HttpOnly cookie in backend
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
