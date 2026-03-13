"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "../services/AuthService";

/**
 * Role names from backend (Spatie Permission).
 */
export type Role = "super-admin" | "admin" | "administrator" | "member" | null;

interface User {
    email: string;
    name: string;
    role: Role;
    permissions: string[];
    unitCode: string | null;
    positionName: string | null;
    positionLevel: number | null;
    accessToken: string;
    uiSettings?: {
        theme?: string;
        size?: string;
        language?: string;
    };
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Determine redirect path based on unit_code from backend.
 * - DIR_UTAMA → dashboard j-prime (direksi)
 * - DIV_OPS   → dashboard divisi operasi (rekon QRIS)
 * - others    → root (super-admin / admin management)
 */
function getRedirectPath(unitCode: string | null): string {
    switch (unitCode) {
        case "DIR_UTAMA":
            return "/direksi/kinerja-keuangan";
        case "DIV_OPS":
            return "/divisi-operasi/rekon-qris";
        default:
            return "/";
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setTimeout(() => {
            const storedUser = sessionStorage.getItem("auth-user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                    sessionStorage.removeItem("auth-user");
                }
            }
            setIsLoading(false);
        }, 0);
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        const response = await AuthService.login(email, password);

        const newUser: User = {
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as Role,
            permissions: response.user.permissions || [],
            unitCode: response.user.unitCode,
            positionName: response.user.positionName,
            positionLevel: response.user.positionLevel,
            accessToken: response.accessToken,
            uiSettings: response.user.uiSettings,
        };

        setUser(newUser);
        sessionStorage.setItem("auth-user", JSON.stringify(newUser));

        router.push(getRedirectPath(newUser.unitCode));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem("auth-user");
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
