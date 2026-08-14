"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string; code?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if available
        console.error("Global Error Boundary caught:", error);
    }, [error]);

    const title = error.code ? `Error Code: ${error.code}` : "Sistem Mengalami Kendala";
    const message = error.message || "Maaf, terjadi kesalahan internal sistem. Teknisi kami bekerja untuk memulihkannya.";

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
            <ErrorState
                title={title}
                message={message}
                onRetry={reset}
                actionLabel="Muat Ulang Halaman"
            />
        </div>
    );
}
