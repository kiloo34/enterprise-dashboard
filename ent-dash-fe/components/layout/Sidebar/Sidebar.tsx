"use client";

import React from "react";
import {
    LayoutDashboard,
    FileText,
    BarChart2,
    Briefcase,
    Users,
    Settings,
    HelpCircle,
    Shield,
    Database,
    UploadCloud,
    PanelLeftClose,
    PanelLeftOpen,
    Monitor,
} from "lucide-react";
import clsx from "clsx";
import { UserProfile } from "./UserProfile";
import { SidebarHeader } from "./components/SidebarHeader";
import { SidebarSearch } from "./components/SidebarSearch";
import { SidebarNavItem } from "./components/SidebarNavItem";
import { SidebarMenuDropdown } from "./components/SidebarMenuDropdown";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";
import Link from "next/link";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
    const {
        t, pathname,
        searchQuery, setSearchQuery, hasResults, showDireksi, showOperasi, showEngine,
        isDashboardOpen, setIsDashboardOpen, isDireksiOpen, setIsDireksiOpen,
        isOperasiOpen, setIsOperasiOpen, isAccessOpen, setIsAccessOpen,
        isEngineOpen, setIsEngineOpen,
        isDashboardActive, isDireksiActive, isOperasiActive,
        isEngineActive,
        isImportActive,
        isAccessActive,
        canViewDashboardKeuangan, canViewDashboardOperasi, canViewEngineMonitoring,
        canManageAccess, canViewKeuanganKinerja, canViewOperasiSummary,
        canViewRekonQrisAj, canViewRekonQrisRintis, canViewRekonQrisOnUs,
        canManageUser, canManageRbac,
        isDireksiRole, isOperasiRole, isDireksiUnit, isOperasiUnit, isEDMUnit, isAdmin,
        user,
    } = useSidebarNavigation();

    // Icon-only mini nav items for collapsed mode
    const collapsedNavItems = [
        canViewDashboardKeuangan && { href: "/direksi/kinerja-keuangan", icon: LayoutDashboard, label: t.dashboard, active: isDashboardActive },
        canViewDashboardOperasi && { href: "/divisi-operasi/summary", icon: Briefcase, label: t.divisiOperasi, active: isOperasiActive },
        canViewEngineMonitoring && { href: "/rekon-engine/import", icon: UploadCloud, label: t.importData, active: isImportActive },
        canViewEngineMonitoring && { href: "/rekon-engine", icon: Database, label: t.monitoring, active: isEngineActive },
        canViewEngineMonitoring && { href: "/engine/data-explorer", icon: Database, label: "Data Explorer", active: pathname === "/engine/data-explorer" },
        canManageAccess && { href: "/settings/users", icon: Shield, label: t.manageAccess, active: isAccessActive },
        { href: "/settings", icon: Settings, label: t.settings, active: pathname === "/settings" },
        { href: "#", icon: HelpCircle, label: t.support, active: false },
    ].filter(Boolean) as { href: string; icon: React.ElementType; label: string; active: boolean }[];

    return (
        <aside
            className={clsx(
                "fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out lg:translate-x-0 border-r backdrop-blur-md",
                isCollapsed ? "w-16" : "w-64",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ background: 'color-mix(in srgb, var(--card-bg) 90%, transparent)', borderColor: 'var(--card-border)' }}
        >
            {/* Header: logo + collapse toggle */}
            {isCollapsed ? (
                <div className="flex flex-col items-center justify-center h-20 px-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="bg-blue-600 p-1.5 rounded-lg text-white mb-1 shadow-sm">
                        <BarChart2 className="w-5 h-5" />
                    </div>
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="flex p-1 rounded-md transition-colors hover:bg-[var(--card-bg-hover)] hover:text-blue-600"
                        style={{ color: 'var(--text-muted)' }}
                        title="Expand sidebar"
                    >
                        <PanelLeftOpen className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <SidebarHeader setIsOpen={setIsOpen} setIsCollapsed={setIsCollapsed} />
                </div>
            )}

            {/* Collapsed: icon-only rail */}
            {isCollapsed ? (
                <nav className="flex-1 flex flex-col items-center gap-1 py-4 overflow-y-auto">
                    {collapsedNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            className={clsx(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                                item.active
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "hover:bg-[var(--card-bg-hover)]"
                            )}
                            style={!item.active ? { color: 'var(--text-muted)' } : undefined}
                        >
                            <item.icon className="w-5 h-5" />
                        </Link>
                    ))}
                </nav>
            ) : (
                <>
                    <SidebarSearch value={searchQuery} onChange={setSearchQuery} />

                    <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">
                        {!hasResults && (
                            <div className="py-8 text-center px-4">
                                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{t.noResults}</p>
                            </div>
                        )}

                        {(canViewDashboardKeuangan || canViewDashboardOperasi) && (
                            hasResults && (
                                <SidebarMenuDropdown
                                    isOpen={isDashboardOpen}
                                    onToggle={() => setIsDashboardOpen(!isDashboardOpen)}
                                    icon={LayoutDashboard}
                                    label={t.dashboard}
                                    active={isDashboardActive}
                                >
                                    {/* Direksi Menu: Flatten if Direksi Role/Unit or if Admin in Direksi Unit */}
                                    {canViewDashboardKeuangan && (
                                        (isDireksiRole || (isAdmin && isDireksiUnit)) ? (
                                            canViewKeuanganKinerja && (
                                                <SidebarNavItem
                                                    href="/direksi/kinerja-keuangan"
                                                    icon={BarChart2}
                                                    label={t.direkturUtama}
                                                    active={pathname === "/direksi/kinerja-keuangan" || pathname === "/"}
                                                    isSubItem
                                                />
                                            )
                                        ) : (
                                            <SidebarMenuDropdown
                                                isOpen={isDireksiOpen}
                                                onToggle={() => setIsDireksiOpen(!isDireksiOpen)}
                                                icon={Users}
                                                label={t.direksi}
                                                show={showDireksi}
                                                isLevel2
                                                active={isDireksiActive}
                                            >
                                                {canViewKeuanganKinerja && (
                                                    <SidebarNavItem
                                                        href="/direksi/kinerja-keuangan"
                                                        icon={BarChart2}
                                                        label={t.direkturUtama}
                                                        active={pathname === "/direksi/kinerja-keuangan" || pathname === "/"}
                                                        isSubItem
                                                    />
                                                )}
                                            </SidebarMenuDropdown>
                                        )
                                    )}

                                    {/* Operasi Menu: Flatten if Operasi Role/Unit or if Admin in Operasi Unit */}
                                    {canViewDashboardOperasi && (
                                        (isOperasiRole || (isAdmin && isOperasiUnit)) ? (
                                            <>
                                                {canViewOperasiSummary && (
                                                    <SidebarNavItem
                                                        href="/divisi-operasi/summary"
                                                        icon={BarChart2}
                                                        label={t.summary}
                                                        active={pathname.startsWith("/divisi-operasi/summary")}
                                                        isSubItem
                                                    />
                                                )}
                                                {canViewRekonQrisAj && <SidebarNavItem href="/divisi-operasi/rekon-qris-aj" icon={FileText} label={t.rekonQris} active={pathname.startsWith("/divisi-operasi/rekon-qris-aj")} isSubItem />}
                                                {canViewRekonQrisRintis && <SidebarNavItem href="/divisi-operasi/rekon-qris-rintis" icon={FileText} label={t.rekonQrisRintis} active={pathname.startsWith("/divisi-operasi/rekon-qris-rintis")} isSubItem />}
                                                {canViewRekonQrisOnUs && <SidebarNavItem href="/divisi-operasi/rekon-qris-on-us" icon={FileText} label={t.rekonQrisOnus} active={pathname.startsWith("/divisi-operasi/rekon-qris-on-us")} isSubItem />}
                                            </>
                                        ) : (
                                            <SidebarMenuDropdown
                                                isOpen={isOperasiOpen}
                                                onToggle={() => setIsOperasiOpen(!isOperasiOpen)}
                                                icon={Briefcase}
                                                label={t.divisiOperasi}
                                                show={showOperasi}
                                                isLevel2
                                                active={isOperasiActive}
                                            >
                                                {canViewOperasiSummary && (
                                                    <SidebarNavItem
                                                        href="/divisi-operasi/summary"
                                                        icon={BarChart2}
                                                        label={t.summary}
                                                        active={pathname.startsWith("/divisi-operasi/summary")}
                                                        isSubItem
                                                    />
                                                )}
                                                {canViewRekonQrisAj && <SidebarNavItem href="/divisi-operasi/rekon-qris-aj" icon={FileText} label={t.rekonQris} active={pathname.startsWith("/divisi-operasi/rekon-qris-aj")} isSubItem />}
                                                {canViewRekonQrisRintis && <SidebarNavItem href="/divisi-operasi/rekon-qris-rintis" icon={FileText} label={t.rekonQrisRintis} active={pathname.startsWith("/divisi-operasi/rekon-qris-rintis")} isSubItem />}
                                                {canViewRekonQrisOnUs && <SidebarNavItem href="/divisi-operasi/rekon-qris-on-us" icon={FileText} label={t.rekonQrisOnus} active={pathname.startsWith("/divisi-operasi/rekon-qris-on-us")} isSubItem />}
                                            </SidebarMenuDropdown>
                                        )
                                    )}
                                </SidebarMenuDropdown>
                            )
                        )}

                        {canViewEngineMonitoring && showEngine && (
                            <SidebarMenuDropdown
                                icon={Settings}
                                label={t.engine}
                                isOpen={isEngineOpen}
                                onToggle={() => setIsEngineOpen(!isEngineOpen)}
                                active={isEngineActive || isImportActive}
                            >
                                <SidebarNavItem
                                    href="/rekon-engine/import"
                                    icon={UploadCloud}
                                    label={t.importData}
                                    active={pathname === "/rekon-engine/import"}
                                    isSubItem
                                />
                                <SidebarNavItem
                                    href="/rekon-engine"
                                    icon={BarChart2}
                                    label={t.monitoring}
                                    active={pathname === "/rekon-engine"}
                                    isSubItem
                                />
                                <SidebarNavItem
                                    href="/engine/data-explorer"
                                    icon={Database}
                                    label="Data Explorer"
                                    active={pathname === "/engine/data-explorer"}
                                    isSubItem
                                />
                            </SidebarMenuDropdown>
                        )}

                        <div className="space-y-4 pt-4">
                            <div className="px-3 flex items-center gap-2 mb-2">
                                <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>System</span>
                                <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                            </div>

                            <div className="space-y-1">
                                {isAdmin && (
                                    <SidebarNavItem
                                        href="/admin/dashboard"
                                        icon={Shield}
                                        label="Admin Dashboard"
                                        active={pathname === "/admin/dashboard"}
                                    />
                                )}
                                {/* System Monitoring — super-admin only */}
                                {user?.role === "super-admin" && (
                                    <SidebarNavItem
                                        href="/admin/monitoring"
                                        icon={Monitor}
                                        label="System Monitoring"
                                        active={pathname === "/admin/monitoring"}
                                    />
                                )}
                                {canManageAccess && (
                                    <SidebarMenuDropdown
                                        isOpen={isAccessOpen}
                                        onToggle={() => setIsAccessOpen(!isAccessOpen)}
                                        icon={Shield}
                                        label={t.manageAccess}
                                        active={isAccessActive}
                                    >
                                        <div className="pl-2">
                                            {canManageUser && <SidebarNavItem href="/settings/users" icon={Users} label={t.manageUser} active={pathname.startsWith("/settings/users")} isSubItem />}
                                            {canManageRbac && (
                                                <>
                                                    <SidebarNavItem href="/settings/roles" icon={Shield} label={t.manageRbac} active={pathname.startsWith("/settings/roles")} isSubItem />
                                                    <SidebarNavItem href="/settings/permissions" icon={Shield} label={t.managePermission} active={pathname.startsWith("/settings/permissions")} isSubItem />
                                                </>
                                            )}
                                        </div>
                                    </SidebarMenuDropdown>
                                )}

                                {isAdmin && (
                                    <SidebarNavItem
                                        href="/settings/system-config"
                                        icon={Database}
                                        label="Konfigurasi Sistem"
                                        active={pathname.startsWith("/settings/system-config")}
                                    />
                                )}

                                <SidebarNavItem href="/settings" icon={Settings} label={t.settings} active={pathname === "/settings"} />
                                <SidebarNavItem href="#" icon={HelpCircle} label={t.support} />
                            </div>
                        </div>
                    </div>

                    <UserProfile translations={t} />
                </>
            )}
        </aside>
    );
}


