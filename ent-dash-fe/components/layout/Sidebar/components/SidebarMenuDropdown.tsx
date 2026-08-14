"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

interface SidebarMenuDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
    show?: boolean;
    isLevel2?: boolean;
    active?: boolean;
}

export function SidebarMenuDropdown({
    isOpen,
    onToggle,
    icon: Icon,
    label,
    children,
    show = true,
    isLevel2 = false,
    active = false
}: SidebarMenuDropdownProps) {
    if (!show) return null;

    return (
        <div className="space-y-1">
            <button
                onClick={onToggle}
                className={clsx(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all group relative",
                    (isOpen || active)
                        ? "text-blue-600 dark:text-blue-400"
                        : "hover:bg-[var(--card-bg-hover)]",
                    active && !isOpen && "bg-blue-600/5 dark:bg-blue-500/10",
                    isLevel2 ? "text-[13px] font-medium" : "text-sm font-semibold"
                )}
                style={!(isOpen || active) ? { color: 'var(--text-muted)' } : undefined}
            >
                {active && !isOpen && (
                    <div className="absolute left-0 w-1 h-5 bg-blue-600 dark:bg-blue-500 rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                    <Icon className={clsx(
                        "transition-colors duration-200",
                        isLevel2 ? "w-4 h-4" : "w-5 h-5",
                        (isOpen || active) ? "text-blue-600 dark:text-blue-400" : ""
                    )} />
                    <span className="truncate">{label}</span>
                </div>
                <ChevronDown className={clsx(
                    "w-4 h-4 transition-transform duration-300 ease-out",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className={clsx(
                    "mt-0.5 space-y-0.5 py-0.5 animate-in slide-in-from-top-1 fade-in duration-200",
                    isLevel2 ? "ml-6 pl-2 border-l" : "ml-4 pl-0"
                )}
                style={isLevel2 ? { borderColor: 'var(--card-border)' } : undefined}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
