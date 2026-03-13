"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, ShieldAlert } from "lucide-react";
import { permissionApi } from "../../utils/api/permissionApi";
import type { Permission } from "../../types/user";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { useTranslation } from "../../hooks/useTranslation";
import { DeleteConfirmationModal } from "../ui/DeleteConfirmationModal";
import { PermissionForm } from "./PermissionForm";
import { PermissionSearchBar } from "./PermissionSearchBar";
import { PermissionTable } from "./PermissionTable";
import { PageHeader } from "../ui/PageHeader";

export function PermissionList() {
    const t = useTranslation("Permissions");
    const { user: currentUser } = useAuth();

    // Search & filter
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOwner, setFilterOwner] = useState("ALL");

    // Form Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | undefined>();

    // Delete Modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

    // SWR Data Fetching
    const {
        data: rawPermissions,
        mutate: mutatePermissions,
        isLoading
    } = useSWR(
        '/api/permissions',
        () => permissionApi.getAll(),
        {
            onError: () => toast.error(t.table.errorFetch),
            revalidateOnFocus: false
        }
    );

    const permissions: Permission[] = Array.isArray(rawPermissions) ? rawPermissions : (rawPermissions?.data || []);
    const uniqueOwners = Array.from(new Set(permissions.map(p => p.owner).filter(Boolean))) as string[];

    const handleCreate = () => {
        setSelectedPermission(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setIsFormOpen(true);
    };

    const handleDeleteClick = (permission: Permission) => {
        setPermissionToDelete(permission);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!permissionToDelete) return;
        try {
            await permissionApi.delete(permissionToDelete.id);
            toast.success(t.delete.success);
            mutatePermissions();
        } catch (error) {
            console.error("Failed to delete permission:", error);
            toast.error(t.delete.error);
        } finally {
            setIsDeleteModalOpen(false);
            setPermissionToDelete(null);
        }
    };

    const filteredPermissions = permissions.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.owner?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesOwner = filterOwner === "ALL" || p.owner === filterOwner;
        return matchesSearch && matchesOwner;
    });

    // Permission checks
    const userPermissions = currentUser?.permissions || [];
    const isSuperAdmin = currentUser?.role === 'super-admin';
    const canCreate = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-permission') || userPermissions.includes('create-permission');
    const canUpdate = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-permission') || userPermissions.includes('update-permission');
    const canDelete = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-permission') || userPermissions.includes('delete-permission');

    return (
        <div className="space-y-6">
            <PageHeader
                title={t.title}
                description={t.subtitle}
                icon={ShieldAlert}
                actions={canCreate ? (
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t.addButton}
                    </button>
                ) : undefined}
            />

            <PermissionSearchBar
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                filterOwner={filterOwner}
                onFilterOwner={setFilterOwner}
                uniqueOwners={uniqueOwners}
                searchPlaceholder={t.searchPlaceholder}
            />

            <PermissionTable
                permissions={filteredPermissions}
                isLoading={isLoading}
                t={t}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            <PermissionForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => mutatePermissions()}
                initialData={selectedPermission}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={t.delete.confirmTitle}
                message={t.delete.confirmMessage}
            />
        </div>
    );
}
