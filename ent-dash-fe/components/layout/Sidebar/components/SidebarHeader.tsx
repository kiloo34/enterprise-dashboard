"use client";

import { useTranslation } from "../../../../hooks/useTranslation";
import { BarChart2, X, PanelLeftClose } from "lucide-react";

interface SidebarHeaderProps {
    setIsOpen: (open: boolean) => void;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function SidebarHeader({ setIsOpen, setIsCollapsed }: SidebarHeaderProps) {
    const { appTitle } = useTranslation("Common");

    return (
        <div className="flex items-center justify-between w-full p-4 h-20">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white shrink-0 shadow-sm shadow-blue-500/20">
                    <BarChart2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <h1 className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                        {appTitle}
                    </h1>
                    {/* Toggle Button for Desktop - Next to Title */}
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="hidden lg:flex p-1 rounded-md transition-all shrink-0 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        style={{ color: 'var(--text-muted)' }}
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Close Button for Mobile */}
            <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-1.5 rounded-lg transition-colors shrink-0 hover:bg-[var(--card-bg-hover)]"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Close sidebar"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}
