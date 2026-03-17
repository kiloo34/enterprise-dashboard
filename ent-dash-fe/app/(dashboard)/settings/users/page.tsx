"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { useUserManagement } from './hooks/useUserManagement';
import { UserHeader } from './components/UserHeader';
import { UserFilterBar } from './components/UserFilterBar';
import { UserTable } from './components/UserTable';

// ✦ Lazy-load the heavy UserForm (org tree, role/permission checkboxes, zod)
const UserForm = dynamic(
    () => import('@/components/users/UserForm').then(m => ({ default: m.UserForm })),
    { ssr: false, loading: () => null }
);

export default function UsersPage() {
    const {
        t, users, roles, positions, units, permissions,
        isLoading, searchQuery, setSearchQuery,
        isFormOpen, isSubmitting,
        filterRole, setFilterRole, filterUnit, setFilterUnit,
        isDeleteModalOpen, setIsDeleteModalOpen, userToDelete, isDeleting,
        selectedUser, canCreate, canUpdate, canDelete, canManageRBAC,
        handleOpenForm, handleCloseForm, handleSubmitForm,
        handleDeleteClick, executeDelete
    } = useUserManagement();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <UserHeader
                t={t}
                canCreate={canCreate}
                onAdd={() => handleOpenForm()}
            />

            <UserFilterBar
                t={t}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterRole={filterRole}
                onRoleChange={setFilterRole}
                filterUnit={filterUnit}
                onUnitChange={setFilterUnit}
                roles={roles}
                units={units}
            />

            <UserTable
                users={users}
                isLoading={isLoading}
                t={t}
                canUpdate={canUpdate}
                canDelete={canDelete}
                canManageRBAC={canManageRBAC}
                onEdit={handleOpenForm}
                onDelete={handleDeleteClick}
            />

            {/* Modals */}
            <UserForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={handleSubmitForm}
                user={selectedUser}
                roles={roles}
                permissions={permissions}
                positions={positions}
                organizationUnits={units}
                users={users} /* For hierarchy dropdown in form */
                isSubmitting={isSubmitting}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                itemName={userToDelete?.name || 'user ini'}
                isSubmitting={isDeleting}
            />
        </div>
    );
}
