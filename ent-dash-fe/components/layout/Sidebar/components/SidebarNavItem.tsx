"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface SidebarNavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    active?: boolean;
    isSubItem?: boolean;
}

export function SidebarNavItem({ href, icon: Icon, label, active, isSubItem }: SidebarNavItemProps) {
    return (
        <Link
            href={href}
            className={clsx(
                "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 relative",
                active
                    ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "hover:bg-[var(--card-bg-hover)]",
                isSubItem ? "text-[13px]" : "text-sm"
            )}
            style={!active ? { color: 'var(--text-muted)' } : undefined}
        >
            {active && (
                <div className="absolute left-0 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
            )}
            <Icon className={clsx(
                "transition-transform duration-200 group-hover:scale-110",
                isSubItem ? "w-4 h-4" : "w-5 h-5",
                active ? "text-blue-600 dark:text-blue-400" : ""
            )} />
            <span className="truncate">{label}</span>
        </Link>
    );
}
