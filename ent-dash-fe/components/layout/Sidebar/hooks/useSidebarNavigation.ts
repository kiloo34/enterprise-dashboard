
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../../AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

export function useSidebarNavigation() {
    const pathname = usePathname();
    const { user } = useAuth();
    const t = useTranslation("Sidebar");
    const [searchQuery, setSearchQuery] = useState("");

    // Dropdown states
    const [isDashboardOpen, setIsDashboardOpen] = useState(true);
    const [isDireksiOpen, setIsDireksiOpen] = useState(false);
    const [isOperasiOpen, setIsOperasiOpen] = useState(false);
    const [isAccessOpen, setIsAccessOpen] = useState(false);
    const [isEngineOpen, setIsEngineOpen] = useState(false);

    const permissions = user?.permissions || [];
    const role = user?.role;
    const isAdmin = role === "admin" || role === "super-admin" || role === "administrator";
    const isDireksiRole = role === "direksi";
    const isOperasiRole = role === "divisi-operasi";

    const unitCode = user?.unitCode || "";
    const isDireksiUnit = ["DIR_UTAMA", "DIR_TI", "SEVP_TI"].includes(unitCode);
    const isOperasiUnit = ["DIV_OPS"].includes(unitCode);
    const isEDMUnit = unitCode === "EDM";

    // --- Permissions ---
    const canViewDashboardKeuangan = permissions.some((p: string) => p.startsWith('view-dashboard-keuangan-'));
    const canViewKeuanganKinerja = permissions.includes('view-dashboard-keuangan-j-prime') || permissions.includes('view-dashboard-keuangan-grafik-lr');

    const canViewDashboardOperasi = permissions.some((p: string) => p.startsWith('view-dashboard-operasi-'));
    const canViewOperasiSummary = permissions.some((p: string) => p.startsWith('view-dashboard-operasi-'));
    const canViewRekonQrisAj = permissions.includes('view-dashboard-operasi-rekon-qris-aj');
    const canViewRekonQrisRintis = permissions.includes('view-dashboard-operasi-rekon-qris-rintis') || permissions.includes('view-dashboard-operasi-rekon-qris-prima');
    const canViewRekonQrisOnUs = permissions.includes('view-dashboard-operasi-rekon-qris-onus');

    const canViewEngineMonitoring = permissions.some((p: string) => p.startsWith('view-sts-') || p.startsWith('view-engine-') || p.startsWith('view-job-'));

    const canManageRbac = isAdmin || permissions.some((p: string) => p.includes("role") || p.includes("permission") || p.includes("rbac"));
    const canManageUser = isAdmin || permissions.some((p: string) => p.includes("user"));
    const canManageOrgUnit = isAdmin || permissions.some((p: string) => p.includes("organization-unit"));
    const canManageAccess = canManageRbac || canManageUser || canManageOrgUnit;

    // --- Active States ---
    const isDashboardActive = pathname === "/" || pathname.startsWith("/direksi") || pathname.startsWith("/divisi-operasi");
    const isDireksiActive = pathname === "/" || pathname.startsWith("/direksi");
    const isOperasiActive = pathname.startsWith("/divisi-operasi");
    const isEngineActive = pathname.startsWith("/engine") || pathname.startsWith("/rekon-engine");
    const isImportActive = pathname.startsWith("/rekon-engine/import");
    const isAccessActive = pathname.startsWith("/settings/users") || pathname.startsWith("/settings/roles") || pathname.startsWith("/settings/permissions");

    // --- Auto Expand/Collapse ---
    useEffect(() => {
        if (canViewDashboardKeuangan || canViewDashboardOperasi || canViewEngineMonitoring || canManageAccess) {
            if (searchQuery?.length > 0) {
                const searchLower = searchQuery.toLowerCase();
                const matchesDireksi = t.direkturUtama?.toLowerCase().includes(searchLower) || false;
                const matchesOperasi =
                    (t.rekonQris?.toLowerCase().includes(searchLower) ||
                        t.rekonQrisRintis?.toLowerCase().includes(searchLower) ||
                        t.rekonQrisOnus?.toLowerCase().includes(searchLower)) || false;
                const matchesEngine = t.engine?.toLowerCase().includes(searchLower) ||
                    t.reconciliation?.toLowerCase().includes(searchLower) ||
                    t.importData?.toLowerCase().includes(searchLower) || false;

                // eslint-disable-next-line react-hooks/set-state-in-effect
                if (matchesDireksi || matchesOperasi) setIsDashboardOpen(true);
                if (matchesEngine) setIsEngineOpen(true);
                if (matchesDireksi) setIsDireksiOpen(true);
                if (matchesOperasi) setIsOperasiOpen(true);
                return;
            }

            // Explicitly set open/closed based on active status
            setIsDashboardOpen(isDashboardActive);
            setIsDireksiOpen(isDireksiActive);
            setIsOperasiOpen(isOperasiActive);
            setIsEngineOpen(isEngineActive);
            setIsAccessOpen(isAccessActive);
        }
    }, [pathname, isDashboardActive, isDireksiActive, isOperasiActive, isEngineActive, isAccessActive, canViewDashboardKeuangan, canViewDashboardOperasi, canViewEngineMonitoring, canManageAccess, searchQuery, t.direkturUtama, t.direksi, t.rekonQris, t.rekonQrisOnus, t.rekonQrisRintis, t.divisiOperasi, t.engine, t.reconciliation]);

    // --- Filtering Logic ---
    const searchLower = searchQuery?.toLowerCase() || "";
    const showDireksi = !searchQuery || t.direkturUtama?.toLowerCase().includes(searchLower) || t.direksi?.toLowerCase().includes(searchLower);
    const showOperasi = t.rekonQrisOnus?.toLowerCase().includes(searchLower) || t.divisiOperasi?.toLowerCase().includes(searchLower) || t.rekonQris?.toLowerCase().includes(searchLower) || t.rekonQrisRintis?.toLowerCase().includes(searchLower);
    const showEngine = !searchQuery ||
        t.engine?.toLowerCase().includes(searchLower) ||
        t.reconciliation?.toLowerCase().includes(searchLower) ||
        t.importData?.toLowerCase().includes(searchLower);
    const hasResults = showDireksi || showOperasi || showEngine;

    return {
        // Translation
        t,
        pathname,

        // Search
        searchQuery,
        setSearchQuery,
        hasResults,
        showDireksi,
        showOperasi,
        showEngine,

        // Open States & Toggles
        isDashboardOpen,
        setIsDashboardOpen,
        isDireksiOpen,
        setIsDireksiOpen,
        isOperasiOpen,
        setIsOperasiOpen,
        isAccessOpen,
        setIsAccessOpen,
        isEngineOpen,
        setIsEngineOpen,

        // Active States
        isDashboardActive,
        isDireksiActive,
        isOperasiActive,
        isEngineActive,
        isImportActive,
        isAccessActive,

        // Permissions
        canViewDashboardKeuangan,
        canViewDashboardOperasi,
        canViewEngineMonitoring,
        canManageAccess,
        canViewKeuanganKinerja,
        canViewOperasiSummary,
        canViewRekonQrisAj,
        canViewRekonQrisRintis,
        canViewRekonQrisOnUs,
        canManageUser,
        canManageRbac,
        isDireksiRole,
        isOperasiRole,
        isDireksiUnit,
        isOperasiUnit,
        isEDMUnit,
        isAdmin,
        user,
    };
}
