import React from 'react';
import { User } from '../../../../types/user';
import { Edit2, Trash2, ListTodo } from 'lucide-react';
import { DataTable, DataTableColumn } from '../../../../components/ui/DataTable';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface UserTableTranslations {
    table: {
        info: string;
        positionUnit: string;
        roles: string;
        actions: string;
        loading: string;
        /** Key from locale: `table.empty` */
        empty: string;
    };
    form: { editTitle: string };
    delete: { confirmTitle: string };
}

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    t: UserTableTranslations;
    canUpdate: boolean;
    canDelete: boolean;
    canManageRBAC: boolean;
    /** Called when the user clicks the Edit button for a row */
    onEdit: (user: User) => void;
    /** Called when the user clicks the Delete button for a row */
    onDelete: (user: User) => void;
}

// ─── Cell sub-components ──────────────────────────────────────────────────────

function UserInfoCell({ user }: { user: User }) {
    const initial = user.name.charAt(0).toUpperCase();
    return (
        <div className="flex items-center gap-3">
            <div
                className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shadow-sm shrink-0"
                aria-hidden
            >
                {initial}
            </div>
            <div className="min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {user.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</div>
                {user.phone && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.phone}</div>
                )}
            </div>
        </div>
    );
}

function UserPositionCell({ user }: { user: User }) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="text-gray-900 dark:text-white font-medium text-sm truncate max-w-[160px]">
                {user.position?.name || '-'}
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm w-fit max-w-[160px] truncate">
                {user.organization_unit?.name || '-'}
            </span>
        </div>
    );
}

function UserRolesCell({ user }: { user: User }) {
    if (!user.roles || user.roles.length === 0) {
        return <span className="text-gray-400 text-xs italic">-</span>;
    }
    return (
        <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px] mx-auto">
            {user.roles.map(role => (
                <span
                    key={role.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 shadow-sm"
                    title={role.name}
                >
                    {role.name.replace('view-dashboard-', '')}
                </span>
            ))}
        </div>
    );
}

interface UserActionButtonsProps {
    user: User;
    canUpdate: boolean;
    canDelete: boolean;
    canManageRBAC: boolean;
    editTitle: string;
    deleteTitle: string;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

function UserActionButtons({
    user, canUpdate, canDelete, canManageRBAC,
    editTitle, deleteTitle, onEdit, onDelete
}: UserActionButtonsProps) {
    return (
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {canManageRBAC && (
                <button
                    onClick={() => { /* Module mapping — not yet implemented */ }}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                    title="Mapping Module"
                    aria-label="Mapping Module"
                >
                    <ListTodo className="w-4 h-4" />
                </button>
            )}
            {canUpdate && (
                <button
                    onClick={() => onEdit(user)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title={editTitle}
                    aria-label={`${editTitle} ${user.name}`}
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            )}
            {canDelete && (
                <button
                    onClick={() => onDelete(user)}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title={deleteTitle}
                    aria-label={`${deleteTitle} ${user.name}`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UserTable({
    users, isLoading, t,
    canUpdate, canDelete, canManageRBAC,
    onEdit, onDelete,
}: UserTableProps) {
    const columns: DataTableColumn<User>[] = [
        {
            key: 'info',
            header: t.table.info,
            render: (user) => <UserInfoCell user={user} />,
        },
        {
            key: 'position_unit',
            header: t.table.positionUnit,
            render: (user) => <UserPositionCell user={user} />,
        },
        {
            key: 'roles',
            header: t.table.roles,
            align: 'center',
            render: (user) => <UserRolesCell user={user} />,
        },
        {
            key: 'actions',
            header: t.table.actions,
            align: 'right',
            render: (user) => (
                <UserActionButtons
                    user={user}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    canManageRBAC={canManageRBAC}
                    editTitle={t.form.editTitle}
                    deleteTitle={t.delete.confirmTitle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ),
        },
    ];

    return (
        <DataTable<User>
            columns={columns}
            data={users}
            rowKey={(u) => u.id}
            isLoading={isLoading}
            emptyText={t.table.empty}
            skeletonRows={6}
            className="[&_tr]:group"
        />
    );
}
