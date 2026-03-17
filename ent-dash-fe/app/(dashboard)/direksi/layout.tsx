

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DireksiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={["super-admin", "admin", "member"]} requiredUnitCode="DIR_UTAMA">
            {children}
        </ProtectedRoute>
    );
}
