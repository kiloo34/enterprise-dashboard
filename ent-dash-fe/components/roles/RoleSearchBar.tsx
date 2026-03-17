"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { SearchableSelect } from '../ui/SearchableSelect';

const GUARD_OPTIONS = [
    { value: 'ALL', label: 'Semua Guard' },
    { value: 'web', label: 'web' },
    { value: 'api', label: 'api' },
] as const;

interface RoleSearchBarProps {
    search: string;
    /** Called when the search query changes */
    onSearchChange: (val: string) => void;
    filterGuard: string;
    /** Called when the guard filter changes */
    onGuardChange: (val: string) => void;
    searchPlaceholder: string;
}

export function RoleSearchBar({
    search,
    onSearchChange,
    filterGuard,
    onGuardChange,
    searchPlaceholder,
}: RoleSearchBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" aria-hidden />
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-11 p-3.5 shadow-sm transition-all"
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                />
            </div>

            {/* Guard Filter */}
            <div className="flex gap-4 w-full sm:w-[200px]">
                <SearchableSelect
                    options={[...GUARD_OPTIONS]}
                    value={filterGuard}
                    onChange={onGuardChange}
                    placeholder="Pilih Guard..."
                    searchPlaceholder="Cari guard..."
                    aria-label="Filter berdasarkan guard"
                />
            </div>
        </div>
    );
}
