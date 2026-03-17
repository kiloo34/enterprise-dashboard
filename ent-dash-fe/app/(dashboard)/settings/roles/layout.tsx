"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function RolesLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const isAuthorized = !isLoading && isAuthenticated && user && (
        user.role === "super-admin" ||
        user.permissions?.includes("manage-rbac") ||
        user.permissions?.includes("manage-role") ||
        user.permissions?.includes("view-role")
    );

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            router.push("/login");
            return;
        }

        // Allow if super-admin or has manage-rbac or specific role permissions
        const hasAccess = user.role === "super-admin" ||
            user.permissions?.includes("manage-rbac") ||
            user.permissions?.includes("manage-role") ||
            user.permissions?.includes("view-role");

        if (!hasAccess) {
            router.push("/");
            return;
        }
    }, [isAuthenticated, isLoading, user, router]);

    if (!isAuthorized) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return <>{children}</>;
}
