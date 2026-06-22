import React from 'react';
import { User } from '@/types/user';
import { Edit2, Trash2, ListTodo } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';

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
        <div className="flex items-center gap-4">
            <div
                className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shadow-inner shrink-0 border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 transition-transform duration-500"
                aria-hidden
            >
                {initial}
            </div>
            <div className="min-w-0">
                <div className="font-bold tracking-tight text-[15px]" style={{ color: 'var(--text-primary)' }}>
                    {user.name}
                </div>
                <div className="text-xs font-semibold mt-0.5 truncate opacity-70" style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
                {user.phone && (
                    <div className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-50" style={{ color: 'var(--text-muted)' }}>{user.phone}</div>
                )}
            </div>
        </div>
    );
}

function UserPositionCell({ user }: { user: User }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="font-bold text-sm tracking-tight truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
                {user.position?.name || '-'}
            </div>
            <span 
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm w-fit max-w-[180px] truncate"
                style={{ background: 'var(--group-card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-muted)' }}
            >
                {user.organization_unit?.name || '-'}
            </span>
        </div>
    );
}

function UserRolesCell({ user }: { user: User }) {
    if (!user.roles || user.roles.length === 0) {
        return <span className="text-[10px] font-bold opacity-30 italic uppercase" style={{ color: 'var(--text-muted)' }}>-</span>;
    }
    return (
        <div className="flex flex-wrap gap-2 justify-center max-w-[240px] mx-auto">
            {user.roles.map(role => (
                <span
                    key={role.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.05em] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm hover:bg-blue-500/20 transition-colors"
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
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            {canManageRBAC && (
                <button
                    onClick={() => { /* Module mapping — not yet implemented */ }}
                    className="p-2 text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all duration-300"
                    title="Mapping Module"
                >
                    <ListTodo className="w-4 h-4" />
                </button>
            )}
            {canUpdate && (
                <button
                    onClick={() => onEdit(user)}
                    className="p-2 text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all duration-300"
                    title={editTitle}
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            )}
            {canDelete && (
                <button
                    onClick={() => onDelete(user)}
                    className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                    title={deleteTitle}
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
