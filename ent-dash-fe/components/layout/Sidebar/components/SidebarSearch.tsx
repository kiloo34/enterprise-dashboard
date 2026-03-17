"use client";

import React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useTranslation } from "../../../../hooks/useTranslation";

interface SidebarSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
    const { searchPlaceholder } = useTranslation("Common");

    return (
        <div className="px-4 my-4">
            <div className="relative group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-3.5 h-3.5 transition-colors" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100/50 dark:border-gray-700/30 focus:border-blue-500/30 rounded-xl outline-none transition-all placeholder-gray-400 dark:text-gray-400 dark:text-gray-200"
                />
                {value && (
                    <button
                        onClick={() => onChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
