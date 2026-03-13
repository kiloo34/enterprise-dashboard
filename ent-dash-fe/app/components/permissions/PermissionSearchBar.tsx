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
                    <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-11 p-3.5 shadow-sm transition-all"
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
