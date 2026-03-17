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
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{role.name}</div>
            ),
        },
        {
            key: 'guard_name',
            header: t.table.guard,
            render: (role) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                    {role.guard_name}
                </span>
            ),
        },
        {
            key: 'permissions_count',
            header: t.table.permsCount,
            render: (role) => (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {role.permissions?.length || 0} {t.table.permsSuffix}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t.table.actions,
            align: 'right',
            render: (role) => (
                <div className="flex justify-end gap-2">
                    {canUpdate && (
                        <button
                            onClick={() => onEdit(role)}
                            className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={tc.edit}
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => onDelete(role)}
                            className="p-2 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
            emptyIcon={<Shield className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
            skeletonRows={5}
        />
    );
}
