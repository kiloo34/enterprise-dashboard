"use client";

import React, { useMemo, useEffect, useState } from "react";
import { Calendar, FileSpreadsheet, FileIcon, Bell, Menu, Sun, Moon } from "lucide-react";
import { useTranslation } from "../../../hooks/useTranslation";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/SettingsContext";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const tHeader = useTranslation("Header");
    const tSidebar = useTranslation("Sidebar");
    const pathname = usePathname();
    const { theme, setTheme } = useSettings();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const pageTitle = useMemo(() => {
        if (!pathname || pathname === "/") return tSidebar.direkturUtama;
        if (pathname.startsWith("/direksi/kinerja-keuangan")) return tSidebar.direkturUtama;
        if (pathname.includes("/divisi-operasi/rekon-qris-rintis")) return tSidebar.rekonQrisRintis;
        if (pathname.includes("/divisi-operasi/rekon-qris-on-us")) return tSidebar.rekonQrisOnus;
        if (pathname.includes("/divisi-operasi/rekon-qris")) return tSidebar.rekonQris;
        if (pathname.includes("/divisi-operasi/summary")) return "Operations Summary";
        if (pathname.includes("/settings/roles")) return tSidebar.manageRbac;
        if (pathname.includes("/settings/users")) return tSidebar.manageUser;
        if (pathname.includes("/settings/system-config")) return "Konfigurasi Sistem";
        if (pathname === "/settings") return tSidebar.settings;

        return tHeader.title;
    }, [pathname, tHeader, tSidebar]);

    return (
        <header
            className="h-20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all border-b backdrop-blur-md"
            style={{
                background: 'color-mix(in srgb, var(--card-bg) 80%, transparent)',
                borderColor: 'var(--card-border)',
            }}
        >
            {/* Title & Menu Toggle */}
            <div className="flex items-center gap-4 lg:gap-6">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-lg transition-colors hover:bg-[var(--card-bg-hover)]"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <Menu className="w-6 h-6" />
                </button>

                <h2 className="text-lg lg:text-xl font-bold truncate max-w-[200px] sm:max-w-none" style={{ color: 'var(--text-primary)' }}>
                    {pageTitle}
                </h2>

                <div className="hidden md:block w-px h-6" style={{ background: 'var(--card-border)' }}></div>

                <div className="hidden sm:flex items-center gap-2 text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Calendar className="w-4 h-4" />
                    <span className="truncate">{tHeader.asOf}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4 font-bold">
                <button className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded-lg text-[10px] lg:text-sm transition-colors shadow-sm whitespace-nowrap active:scale-95">
                    <FileSpreadsheet className="w-4 h-4" />
                    {tHeader.export}
                </button>
                <button
                    className="flex lg:hidden items-center justify-center p-2 rounded-lg border transition-colors hover:bg-[var(--card-bg-hover)]"
                    style={{
                        background: 'var(--btn-secondary-bg)',
                        color: 'var(--btn-secondary-text)',
                        borderColor: 'var(--btn-secondary-border)',
                    }}
                >
                    <FileIcon className="w-5 h-5" />
                </button>
                <button
                    className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border hover:bg-[var(--card-bg-hover)]"
                    style={{
                        background: 'var(--btn-secondary-bg)',
                        color: 'var(--btn-secondary-text)',
                        borderColor: 'var(--btn-secondary-border)',
                    }}
                >
                    <FileIcon className="w-4 h-4" />
                    PDF
                </button>
                <button className="transition-colors ml-1 lg:ml-2 relative group p-2 rounded-full hover:bg-[var(--card-bg-hover)]" style={{ color: 'var(--text-muted)' }}>
                    <Bell className="w-5 h-5 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" style={{ border: '2px solid var(--card-bg)' }}></span>
                </button>
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="transition-colors ml-1 lg:ml-2 relative group p-2 rounded-full hover:bg-[var(--card-bg-hover)]"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Toggle Dark Mode"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                        ) : (
                            <Moon className="w-5 h-5 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                        )}
                    </button>
                )}
            </div>
        </header>
    );
}
