

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DireksiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute 
            allowedRoles={["super-admin", "admin", "member", "direksi"]} 
            requiredUnitCodes={["DIR_UTAMA", "DIR_TI", "SEVP_TI"]}
        >
            {children}
        </ProtectedRoute>
    );
}
