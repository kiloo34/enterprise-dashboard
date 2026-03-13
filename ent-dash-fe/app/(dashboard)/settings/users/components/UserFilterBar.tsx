import React from 'react';
import { Search } from 'lucide-react';
import { Role, OrganizationUnit } from '../../../../types/user';
import { SearchableSelect } from '../../../../components/ui/SearchableSelect';

interface UserFilterBarTranslations {
    searchPlaceholder: string;
}

interface UserFilterBarProps {
    t: UserFilterBarTranslations;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filterRole: string;
    onRoleChange: (role: string) => void;
    filterUnit: string;
    onUnitChange: (unit: string) => void;
    roles: Role[];
    units: OrganizationUnit[];
}

export function UserFilterBar({
    t,
    searchQuery,
    onSearchChange,
    filterRole,
    onRoleChange,
    filterUnit,
    onUnitChange,
    roles,
    units,
}: UserFilterBarProps) {
    const roleOptions = [
        { value: 'ALL', label: 'Semua Akses (Role)' },
        ...roles.map(r => ({ value: r.name, label: r.name })),
    ];

    const unitOptions = [
        { value: 'ALL', label: 'Semua Unit' },
        ...units.map(u => ({ value: u.name, label: u.name })),
    ];

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" aria-hidden />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-11 p-3.5 shadow-sm transition-all"
                    placeholder={t.searchPlaceholder}
                    aria-label={t.searchPlaceholder}
                />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-4 w-full sm:w-auto">
                <div className="w-full sm:w-[200px]">
                    <SearchableSelect
                        options={roleOptions}
                        value={filterRole}
                        onChange={onRoleChange}
                        placeholder="Semua Akses (Role)"
                        searchPlaceholder="Cari role..."
                        aria-label="Filter berdasarkan role"
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <SearchableSelect
                        options={unitOptions}
                        value={filterUnit}
                        onChange={onUnitChange}
                        placeholder="Semua Unit"
                        searchPlaceholder="Cari unit..."
                        aria-label="Filter berdasarkan unit kerja"
                    />
                </div>
            </div>
        </div>
    );
}
