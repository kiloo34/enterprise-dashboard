"use client";

import React from 'react';
import { Shield, Edit2, Trash2 } from 'lucide-react';
import { Role } from '../../types/role';
import { DataTable, DataTableColumn } from '../ui/DataTable';

interface RoleTableTranslations {
    table: {
        name: string;
        guard: string;
        permsCount: string;
        actions: string;
        loading: string;
        empty: string;
        permsSuffix: string;
        adminDeleteTooltip: string;
    };
}

interface RoleTableProps {
    roles: Role[];
    isLoading: boolean;
    t: RoleTableTranslations;
    tc: { edit: string; delete: string };
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
}

export function RoleTable({
    roles,
    isLoading,
    t,
    tc,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
}: RoleTableProps) {
    const columns: DataTableColumn<Role>[] = [
        {
            key: 'name',
            header: t.table.name,
            render: (role) => (
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="font-bold tracking-tight text-[15px]" style={{ color: 'var(--text-primary)' }}>{role.name}</div>
                </div>
            ),
        },
        {
            key: 'guard_name',
            header: t.table.guard,
            render: (role) => (
                <span 
                    className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm"
                    style={{ background: 'var(--group-card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
                >
                    {role.guard_name}
                </span>
            ),
        },
        {
            key: 'permissions_count',
            header: t.table.permsCount,
            render: (role) => (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-500/5 text-[var(--brand-primary)] border border-blue-500/10">
                    {role.permissions?.length || 0} {t.table.permsSuffix}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t.table.actions,
            align: 'right',
            render: (role) => (
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    {canUpdate && (
                        <button
                            onClick={() => onEdit(role)}
                            className="p-2 text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all duration-300"
                            title={tc.edit}
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => onDelete(role)}
                            className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
                            disabled={role.name.toLowerCase() === 'administrator'}
                            title={role.name.toLowerCase() === 'administrator' ? t.table.adminDeleteTooltip : tc.delete}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <DataTable<Role>
            columns={columns}
            data={roles}
            rowKey={(role) => role.id}
            isLoading={isLoading}
            emptyText={t.table.empty}
            emptyIcon={<Shield className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />}
            skeletonRows={5}
            className="[&_tr]:group"
        />
    );
}
