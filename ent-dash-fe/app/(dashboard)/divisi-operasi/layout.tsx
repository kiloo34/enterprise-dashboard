

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function OperasiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={["super-admin", "admin", "member"]} requiredUnitCodes={["DIV_OPS"]}>
            {children}
        </ProtectedRoute>
    );
}
