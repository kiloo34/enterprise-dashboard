import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { UserProfile } from "./UserProfile";
import { SidebarHeader } from "./components/SidebarHeader";
import { SidebarSearch } from "./components/SidebarSearch";
import { SidebarNavItem } from "./components/SidebarNavItem";
import { SidebarMenuDropdown } from "./components/SidebarMenuDropdown";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase, Settings, UploadCloud, BarChart2, Database, Activity, FileText, HelpCircle, UserMinus, TrendingDown, LucideIcon } from "lucide-react";
import { useNavigationMenus, MenuItem } from "../../../services/IAMService";

const IconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Briefcase,
    Settings,
    UploadCloud,
    BarChart2,
    Database,
    Activity,
    FileText,
    HelpCircle,
    UserMinus,
    TrendingDown,
};

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

// --- Extracted as a proper React component to comply with Rules of Hooks ---
interface MenuDropdownItemProps {
    item: MenuItem;
    idx: number;
    t: Record<string, string>;
    pathname: string;
    isCollapsed: boolean;
}

const getTranslatedLabel = (label: string, t: Record<string, string>) => {
    const key = label.startsWith('t.') ? label.slice(2) : label;
    return t[key as keyof typeof t] || label;
};

function MenuDropdownItem({ item, idx, t, pathname, isCollapsed }: MenuDropdownItemProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isActive = item.items?.some(subItem =>
        pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(subItem.href || ''))
    ) || false;

    useEffect(() => {
        if (isActive && !isCollapsed) {
            setIsDropdownOpen(true);
        }
    }, [isActive, isCollapsed]);

    const Icon = item.icon && IconMap[item.icon] ? IconMap[item.icon] : LayoutDashboard;
    const translatedLabel = getTranslatedLabel(item.label, t);

    return (
        <SidebarMenuDropdown
            key={idx}
            icon={Icon}
            label={translatedLabel}
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
            active={isActive}
        >
            {item.items?.map((subItem, subIdx) => {
                const SubIcon = subItem.icon && IconMap[subItem.icon] ? IconMap[subItem.icon] : LayoutDashboard;
                const subLabel = getTranslatedLabel(subItem.label, t);
                return (
                    <SidebarNavItem
                        key={subItem.href || subIdx}
                        href={subItem.href || '#'}
                        icon={SubIcon}
                        label={subLabel}
                        active={pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(subItem.href || ''))}
                        isSubItem
                    />
                );
            })}
        </SidebarMenuDropdown>
    );
}
// --------------------------------------------------------------------------

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
    const { t, pathname, searchQuery, setSearchQuery } = useSidebarNavigation();
    const { menus, isLoading } = useNavigationMenus();

    const renderMenuItem = (item: MenuItem, idx: number) => {
        const Icon = item.icon && IconMap[item.icon] ? IconMap[item.icon] : LayoutDashboard;
        const translatedLabel = getTranslatedLabel(item.label, t);

        if (item.type === 'item') {
            return (
                <SidebarNavItem
                    key={item.href || idx}
                    href={item.href || '#'}
                    icon={Icon}
                    label={translatedLabel}
                    active={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href || ''))}
                />
            );
        }

        if (item.type === 'section') {
            return (
                <div key={idx} className="space-y-4 pt-4">
                    <div className="px-3 flex items-center gap-2 mb-2">
                        <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>{translatedLabel}</span>
                        <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                    </div>
                    <div className="space-y-1">
                        {item.items?.map((subItem, subIdx) => {
                            const SubIcon = subItem.icon && IconMap[subItem.icon] ? IconMap[subItem.icon] : LayoutDashboard;
                            const subLabel = getTranslatedLabel(subItem.label, t);
                            return (
                                <SidebarNavItem
                                    key={subItem.href || subIdx}
                                    href={subItem.href || '#'}
                                    icon={SubIcon}
                                    label={subLabel}
                                    active={pathname === subItem.href || (subItem.href !== '/' && pathname.startsWith(subItem.href || ''))}
                                />
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (item.type === 'dropdown') {
            return (
                <MenuDropdownItem
                    key={idx}
                    item={item}
                    idx={idx}
                    t={t}
                    pathname={pathname}
                    isCollapsed={isCollapsed}
                />
            );
        }

        return null;
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 lg:hidden z-40 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={clsx(
                    "fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-screen",
                    "transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[72px]" : "w-72",
                    "border-r shadow-sm",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                }}
            >
                <SidebarHeader
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    setIsOpen={setIsOpen}
                />

                {isCollapsed ? (
                    <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto overflow-x-hidden flex flex-col items-center">
                        {menus.map((item, idx) => {
                            const Icon = item.icon && IconMap[item.icon] ? IconMap[item.icon] : LayoutDashboard;
                            let isActive = false;
                            if (item.type === 'item') {
                                isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href || ''));
                            } else if (item.items) {
                                isActive = item.items.some(sub => pathname === sub.href || (sub.href !== '/' && pathname.startsWith(sub.href || '')));
                            }

                            const href = item.type === 'item' ? item.href : (item.items?.[0]?.href || '#');

                            return (
                                <Link
                                    key={idx}
                                    href={href || '#'}
                                    title={item.label}
                                    className={clsx(
                                        "flex items-center justify-center w-10 h-10 rounded-xl transition-colors",
                                        isActive
                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "hover:bg-[var(--card-bg-hover)]"
                                    )}
                                    style={!isActive ? { color: 'var(--text-muted)' } : undefined}
                                >
                                    <Icon className="w-5 h-5" />
                                </Link>
                            );
                        })}

                        <Link
                            href="/settings"
                            title={t.settings}
                            className={clsx(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-colors mt-auto",
                                pathname.startsWith("/settings")
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                    : "hover:bg-[var(--card-bg-hover)]"
                            )}
                            style={!pathname.startsWith("/settings") ? { color: 'var(--text-muted)' } : undefined}
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    </nav>
                ) : (
                    <>
                        <SidebarSearch value={searchQuery} onChange={setSearchQuery} />

                        <div className="flex-1 px-4 py-2 space-y-4 overflow-y-auto">

                            {isLoading ? (
                                <div className="py-8 text-center px-4">
                                    <p className="text-sm italic animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading menu...</p>
                                </div>
                            ) : menus.length === 0 ? (
                                <div className="py-8 text-center px-4">
                                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{t.noResults || "No menus available"}</p>
                                </div>
                            ) : (
                                menus.map((item, idx) => renderMenuItem(item, idx))
                            )}

                            <div className="space-y-4 pt-4">
                                <div className="px-3 flex items-center gap-2 mb-2">
                                    <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>System</span>
                                    <div className="h-px flex-1" style={{ background: 'var(--card-border)' }} />
                                </div>

                                <SidebarNavItem
                                    href="/settings"
                                    icon={Settings}
                                    label={t.settings}
                                    active={pathname.startsWith("/settings")}
                                />
                                <SidebarNavItem
                                    href="#"
                                    icon={HelpCircle}
                                    label={t.support}
                                    active={false}
                                />
                            </div>
                        </div>
                    </>
                )}

                <UserProfile translations={t} />
            </aside>
        </>
    );
}
