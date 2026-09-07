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
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 w-3.5 h-3.5 transition-colors" style={{ color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm rounded-xl outline-none transition-all border focus:border-blue-500/30"
                    style={{
                        background: 'var(--group-card-bg)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--text-primary)',
                    }}
                />
                {value && (
                    <button
                        onClick={() => onChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-colors hover:text-blue-500"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label="Clear search"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
