"use client";

import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Permission } from '../../types/user';
import { DataTable, DataTableColumn } from '../ui/DataTable';

interface PermissionTableTranslations {
    table: {
        name: string;
        owner: string;
        description: string;
        actions: string;
        loading: string;
        empty: string;
    };
    form: { editTitle: string };
    delete: { confirmTitle: string };
}

interface PermissionTableProps {
    permissions: Permission[];
    isLoading: boolean;
    t: PermissionTableTranslations;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (permission: Permission) => void;
    onDelete: (permission: Permission) => void;
}

export function PermissionTable({
    permissions,
    isLoading,
    t,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
}: PermissionTableProps) {
    const columns: DataTableColumn<Permission>[] = [
        {
            key: 'name',
            header: t.table.name,
            render: (p) => <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</div>,
        },
        {
            key: 'owner',
            header: t.table.owner,
            render: (p) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                    {p.owner || '-'}
                </span>
            ),
        },
        {
            key: 'description',
            header: t.table.description,
            render: (p) => (
                <div className="text-sm line-clamp-2 max-w-xs whitespace-normal" style={{ color: 'var(--text-muted)' }}>
                    {p.description || '-'}
                </div>
            ),
        },
        {
            key: 'actions',
            header: t.table.actions,
            align: 'right',
            render: (p) => (
                <div className="flex justify-end gap-2">
                    {canUpdate && (
                        <button
                            onClick={() => onEdit(p)}
                            className="p-2 hover:text-blue-600 rounded-lg transition-colors"
                            style={{ background: 'var(--group-card-bg)', color: 'var(--text-muted)' }}
                            title={t.form.editTitle}
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => onDelete(p)}
                            className="p-2 hover:text-red-500 rounded-lg transition-colors"
                            style={{ background: 'var(--group-card-bg)', color: 'var(--text-muted)' }}
                            title={t.delete.confirmTitle}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <DataTable<Permission>
            columns={columns}
            data={permissions}
            rowKey={(p) => p.id}
            isLoading={isLoading}
            emptyText={t.table.empty}
            skeletonRows={8}
        />
    );
}
