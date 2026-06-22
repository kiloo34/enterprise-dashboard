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
        <div className="rounded-2xl border shadow-sm dark:shadow-xl overflow-hidden transition-all backdrop-blur-sm p-4 lg:p-5 flex flex-col sm:flex-row gap-4 lg:gap-6" style={{ background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)', borderColor: 'var(--card-border)' }}>
            {/* Search Input */}
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" aria-hidden />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 transition-all font-semibold"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                />
            </div>

            {/* Guard Filter */}
            <div className="w-full sm:w-[200px]">
                <SearchableSelect
                    options={[...GUARD_OPTIONS]}
                    value={filterGuard}
                    onChange={onGuardChange}
                    placeholder="Pilih Guard..."
                    searchPlaceholder="Cari guard..."
                />
            </div>
        </div>
    );
}
