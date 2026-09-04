import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function UseCaseLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={["super-admin"]}>
            {children}
        </ProtectedRoute>
    );
}
