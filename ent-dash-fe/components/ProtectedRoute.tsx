"use client";

import { useAuth, Role } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
    /**
     * If provided, only users whose unitCode matches this value can access the route.
     * Users with other unitCodes will be redirected to their own dashboard.
     */
    requiredUnitCode?: string;
    /**
     * PBAC Extension: If provided, only users whose positionName strictly matches
     * will be granted access (Bypassed if user is global admin)
     */
    allowedPositions?: string[];
}

export function ProtectedRoute({ children, allowedRoles, requiredUnitCode, allowedPositions }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isGlobalAdmin = user?.role === "super-admin" || user?.role === "admin";
    const isAuthorized = !isLoading && isAuthenticated && !!user &&
        (!allowedRoles || allowedRoles.includes(user.role)) &&
        (!requiredUnitCode || user.unitCode === requiredUnitCode || isGlobalAdmin) &&
        (!allowedPositions || (user.positionName && allowedPositions.includes(user.positionName)) || isGlobalAdmin);

    useEffect(() => {
        if (isLoading) return;

        // 1. Not authenticated → go to login
        if (!isAuthenticated || !user) {
            router.push("/login");
            return;
        }

        // 2. Role not in allowed list → redirect to login
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            router.push("/login");
            return;
        }

        // 3. unitCode mismatch → redirect user to their own dashboard
        // Bypass strict unitCode checking for global administrative roles
        const isGlobalAdmin = user.role === "super-admin" || user.role === "admin";

        if (requiredUnitCode && user.unitCode !== requiredUnitCode && !isGlobalAdmin) {
            if (user.unitCode === "DIR_UTAMA") {
                router.push("/direksi/kinerja-keuangan");
            } else if (user.unitCode === "DIV_OPS") {
                router.push("/divisi-operasi/rekon-qris");
            } else {
                // super-admin or admin with no specific unit dashboard
                router.push("/");
            }
            return;
        }

        // 4. Position mismatch (PBAC) → block functional specialist from accessing management dashboards
        if (allowedPositions && (!user.positionName || !allowedPositions.includes(user.positionName)) && !isGlobalAdmin) {
            if (user.unitCode === "DIR_UTAMA") {
                router.push("/direksi/kinerja-keuangan");
            } else if (user.unitCode === "DIV_OPS") {
                router.push("/divisi-operasi/rekon-qris"); // Petugas (bukan VP) hanya bisa masuk sini
            } else {
                router.push("/");
            }
            return;
        }

    }, [isAuthenticated, isLoading, user, allowedRoles, requiredUnitCode, allowedPositions, router, pathname]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memeriksa hak akses...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
