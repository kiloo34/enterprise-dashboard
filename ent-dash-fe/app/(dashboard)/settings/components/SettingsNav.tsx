"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Palette,
    Users,
    Shield,
    Lock,
    Settings,
    Languages,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/components/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

interface NavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
    return (
        <Link
            href={href}
            className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors duration-150 w-full",
                active
                    ? "bg-[var(--card-bg)] font-semibold shadow-sm"
                    : "hover:bg-[var(--card-bg-hover)] font-normal"
            )}
            style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}
        >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
        </Link>
    );
}

interface SectionProps {
    label: string;
    children: React.ReactNode;
}

function NavSection({ label, children }: SectionProps) {
    return (
        <div className="space-y-0.5">
            <p
                className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ color: "var(--text-muted)" }}
            >
                {label}
            </p>
            {children}
        </div>
    );
}

export function SettingsNav() {
    const pathname = usePathname();
    const { user } = useAuth();
    const t = useTranslation("Settings");

    const role = user?.role;
    const permissions = user?.permissions || [];
    const isAdmin = role === "admin" || role === "super-admin" || role === "administrator";
    const isSuperAdmin = role === "super-admin";

    const canManageRbac = isAdmin || permissions.some((p: string) => p.includes("role") || p.includes("permission"));
    const canManageUser = isAdmin || permissions.some((p: string) => p.includes("user"));
    const canManageAccess = canManageRbac || canManageUser;

    return (
        <nav className="flex flex-col">
            {/* Personal */}
            <NavSection label={t.navPersonal}>
                <NavItem
                    href="/settings"
                    icon={Palette}
                    label={t.navAppearance}
                    active={pathname === "/settings"}
                />
            </NavSection>

            {/* Workspace — only shown if user has at least one admin capability */}
            {(canManageAccess || isAdmin || isSuperAdmin) && (
                <NavSection label={t.navWorkspace}>
                    {canManageUser && (
                        <NavItem
                            href="/settings/users"
                            icon={Users}
                            label={t.navUsers}
                            active={pathname.startsWith("/settings/users")}
                        />
                    )}
                    {canManageRbac && (
                        <NavItem
                            href="/settings/roles"
                            icon={Shield}
                            label={t.navRoles}
                            active={pathname.startsWith("/settings/roles")}
                        />
                    )}
                    {canManageRbac && (
                        <NavItem
                            href="/settings/permissions"
                            icon={Lock}
                            label={t.navPermissions}
                            active={pathname.startsWith("/settings/permissions")}
                        />
                    )}
                    {isAdmin && (
                        <NavItem
                            href="/settings/system-config"
                            icon={Settings}
                            label={t.navSystemConfig}
                            active={pathname.startsWith("/settings/system-config")}
                        />
                    )}
                    {isSuperAdmin && (
                        <NavItem
                            href="/settings/translations"
                            icon={Languages}
                            label={t.navTranslations}
                            active={pathname.startsWith("/settings/translations")}
                        />
                    )}
                </NavSection>
            )}
        </nav>
    );
}
