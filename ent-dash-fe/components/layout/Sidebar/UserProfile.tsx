"use client";

import React, { useState } from "react";
import { User, LogOut, Settings, ChevronUp } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

import { useAuth } from "../../AuthContext";
import { TranslationSchema } from "../../../utils/locales/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileProps {
    translations: TranslationSchema["Sidebar"];
}

export function UserProfile({ translations }: UserProfileProps) {
    const t = translations;

    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        setIsProfileOpen(false);
        logout();
    };

    return (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 relative">
            <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DropdownMenuTrigger asChild>
                    <div
                        className={clsx(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer outline-none transition-all",
                            isProfileOpen ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        role="button"
                        tabIndex={0}
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
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56 mb-2 z-[150]" side="top" align="center" sideOffset={12}>
                    <DropdownMenuItem className="cursor-pointer gap-2 p-2">
                        <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t.profile}</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="cursor-pointer gap-2 p-2" asChild>
                        <Link href="/settings">
                            <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">{t.accountSettings}</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem 
                        onSelect={(e: Event) => {
                            e.preventDefault();
                            handleLogout();
                        }}
                        className="cursor-pointer gap-2 p-2 text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-900/20"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-bold">{t.signOut}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
