'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Shield, Plus } from 'lucide-react';
import { useRoleManagement } from './hooks/useRoleManagement';
import { useTranslation } from '../../../hooks/useTranslation';
import { RoleTable } from '../../../components/roles/RoleTable';
import { RoleSearchBar } from '../../../components/roles/RoleSearchBar';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DeleteConfirmationModal } from '../../../components/ui/DeleteConfirmationModal';
import { PageError } from '../../../components/ui/PageError';

// ✦ Lazy-load the heavy RoleForm (contains permission tree + react-hook-form + zod)
const RoleForm = dynamic(
    () => import('../../../components/roles/RoleForm').then(m => ({ default: m.RoleForm })),
    { ssr: false, loading: () => null }
);

export default function RolesPage() {
    const tc = useTranslation('Common');
    const {
        t,
        filteredRoles, permissions, isLoading,
        rolesError, mutateRoles,
        search, setSearch,
        filterGuard, setFilterGuard,
        isFormOpen, selectedRole, isSubmitting,
        isDeleteModalOpen, setIsDeleteModalOpen,
        roleToDelete, isDeleting,
        canCreate, canUpdate, canDelete,
        handleOpenForm, handleCloseForm,
        handleDeleteClick, executeDelete, handleSubmitRole,
    } = useRoleManagement();

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title={t.title}
                description={t.subtitle}
                icon={Shield}
                actions={canCreate ? (
                    <button
                        onClick={() => handleOpenForm()}
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t.addButton}
                    </button>
                ) : undefined}
            />

            <RoleSearchBar
                search={search}
                onSearchChange={setSearch}
                filterGuard={filterGuard}
                onGuardChange={setFilterGuard}
                searchPlaceholder={t.searchPlaceholder}
            />

            {rolesError ? (
                <PageError
                    code={rolesError?.status || rolesError?.response?.status}
                    message={rolesError?.response?.data?.message || rolesError?.message}
                    onRetry={() => mutateRoles()}
                />
            ) : (
                <RoleTable
                    roles={filteredRoles}
                    isLoading={isLoading}
                    t={t}
                    tc={tc}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={(role) => handleOpenForm(role)}
                    onDelete={handleDeleteClick}
                />
            )}


            <RoleForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={handleSubmitRole}
                role={selectedRole}
                permissions={permissions}
                isSubmitting={isSubmitting}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={executeDelete}
                itemName={roleToDelete?.name || 'role ini'}
                isSubmitting={isDeleting}
            />
        </div>
    );
}
