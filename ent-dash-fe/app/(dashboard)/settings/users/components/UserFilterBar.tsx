import React from 'react';
import { Search } from 'lucide-react';
import { Role, OrganizationUnit } from '@/types/user';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

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
        <div className="rounded-2xl border shadow-sm dark:shadow-xl overflow-hidden transition-all backdrop-blur-sm p-4 lg:p-5 flex flex-col sm:flex-row gap-4 lg:gap-6" style={{ background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)', borderColor: 'var(--card-border)' }}>
            {/* Search Input */}
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--brand-primary)] transition-colors" aria-hidden />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 transition-all font-semibold"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
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
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <SearchableSelect
                        options={unitOptions}
                        value={filterUnit}
                        onChange={onUnitChange}
                        placeholder="Semua Unit"
                        searchPlaceholder="Cari unit..."
                    />
                </div>
            </div>
        </div>
    );
}
