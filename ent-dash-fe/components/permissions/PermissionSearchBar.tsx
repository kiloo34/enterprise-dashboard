"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { SearchableSelect } from '../ui/SearchableSelect';
import type { Permission } from '../../types/user';

interface PermissionSearchBarProps {
    searchQuery: string;
    onSearch: (val: string) => void;
    filterOwner: string;
    onFilterOwner: (val: string) => void;
    uniqueOwners: string[];
    searchPlaceholder: string;
}

export function PermissionSearchBar({
    searchQuery,
    onSearch,
    filterOwner,
    onFilterOwner,
    uniqueOwners,
    searchPlaceholder,
}: PermissionSearchBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="text-sm rounded-xl block w-full pl-11 p-3.5 shadow-sm transition-all outline-none border"
                    style={{
                        background: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--input-text)',
                    }}
                    placeholder={searchPlaceholder}
                />
            </div>
            <div className="flex gap-4 w-full sm:w-[220px]">
                <SearchableSelect
                    options={[
                        { value: 'ALL', label: 'Semua Owner' },
                        ...uniqueOwners.map(owner => ({ value: owner, label: owner })),
                    ]}
                    value={filterOwner}
                    onChange={onFilterOwner}
                    placeholder="Pilih Owner..."
                    searchPlaceholder="Cari owner..."
                />
            </div>
        </div>
    );
}
