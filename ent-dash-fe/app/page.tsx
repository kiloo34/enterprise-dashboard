"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getRedirectPath } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";

export default function RootPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push("/login");
            } else {
                router.push(getRedirectPath(user));
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memuat dashboard...</p>
            </div>
        </div>
    );
}
