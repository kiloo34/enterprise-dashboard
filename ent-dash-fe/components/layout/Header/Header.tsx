"use client";

import React, { useMemo } from "react";
import { Calendar, FileSpreadsheet, FileIcon, Bell, Menu } from "lucide-react";
import { useTranslation } from "../../../hooks/useTranslation";
import { usePathname } from "next/navigation";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const tHeader = useTranslation("Header");
    const tSidebar = useTranslation("Sidebar");
    const pathname = usePathname();

    const pageTitle = useMemo(() => {
        if (!pathname || pathname === "/") return tSidebar.direkturUtama;
        if (pathname.startsWith("/direksi/kinerja-keuangan")) return tSidebar.direkturUtama;
        if (pathname.includes("/divisi-operasi/rekon-qris-rintis")) return tSidebar.rekonQrisRintis;
        if (pathname.includes("/divisi-operasi/rekon-qris-on-us")) return tSidebar.rekonQrisOnus;
        if (pathname.includes("/divisi-operasi/rekon-qris")) return tSidebar.rekonQris;
        if (pathname.includes("/divisi-operasi/summary")) return "Operations Summary";
        if (pathname.includes("/settings/roles")) return tSidebar.manageRbac;
        if (pathname.includes("/settings/users")) return tSidebar.manageUser;
        if (pathname === "/settings") return tSidebar.settings;

        return tHeader.title;
    }, [pathname, tHeader, tSidebar]);

    return (
        <header className="h-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-colors">
            {/* Title & Menu Toggle */}
            <div className="flex items-center gap-4 lg:gap-6">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px] sm:max-w-none">
                    {pageTitle}
                </h2>

                <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-gray-800"></div>

                <div className="hidden sm:flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs lg:text-sm">
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
                <button className="flex lg:hidden items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <FileIcon className="w-5 h-5" />
                </button>
                <button className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors border border-gray-200 dark:border-gray-700">
                    <FileIcon className="w-4 h-4" />
                    PDF
                </button>
                <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-1 lg:ml-2 relative group">
                    <Bell className="w-5 h-5 lg:w-5 lg:h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
                </button>
            </div>
        </header>
    );
}
