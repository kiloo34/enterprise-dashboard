import React, { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, ChevronUp } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

import { useAuth } from "../../AuthContext";

import { TranslationSchema } from "../../../utils/locales/types";

interface UserProfileProps {
    translations: TranslationSchema["Sidebar"];
}

export function UserProfile({ translations }: UserProfileProps) {
    const t = translations;

    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsProfileOpen(false);
        logout();
    };

    return (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 relative" ref={dropdownRef}>
            {/* Dropdown Menu */}
            {isProfileOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            {t.profile}
                        </button>
                        <Link
                            href="/settings"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            {t.accountSettings}
                        </Link>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-2"></div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            {t.signOut}
                        </button>
                    </div>
                </div>
            )}

            <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={clsx(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all",
                    isProfileOpen ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={`https://ui-avatars.com/api/?name=${user?.name || "User"}&background=E5E7EB&color=374151`}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700"
                />
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name || "Guest"}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider font-bold">
                        {user?.role?.replace("_", " ")}
                    </p>
                </div>
                <ChevronUp className={clsx(
                    "w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200",
                    isProfileOpen ? "rotate-0" : "rotate-180"
                )} />
            </div>
        </div>
    );
}
