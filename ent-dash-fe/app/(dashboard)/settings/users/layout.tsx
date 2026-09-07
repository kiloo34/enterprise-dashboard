"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

// C4 fix: Ganti custom useEffect auth logic dengan ProtectedRoute yang sudah teruji.
// Sebelumnya: setState di dalam useEffect → cascading renders (ESLint error).
export default function UsersLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute
            allowedRoles={["super-admin", "admin"]}
        >
            {children}
        </ProtectedRoute>
    );
}
