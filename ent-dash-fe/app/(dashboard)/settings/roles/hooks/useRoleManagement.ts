import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { roleApi } from '../../../../utils/api/roleApi';
import { Role, Permission, RoleFormData } from '../../../../types/role';
import { useAuth } from '../../../../components/AuthContext';
import { useTranslation } from '../../../../hooks/useTranslation';
import { toast } from 'sonner';

export function useRoleManagement() {
    const t = useTranslation('Roles');
    const { user: currentUser } = useAuth();

    // UI State
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterGuard, setFilterGuard] = useState('ALL');

    // Form Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(id);
    }, [search]);

    // Data Fetching
    const { data: rolesData, mutate: mutateRoles, isLoading: isLoadingRoles, error: rolesError } = useSWR(
        ['/api/roles', debouncedSearch],
        ([, s]) => roleApi.getRoles(s),
        { revalidateOnFocus: false }
    );

    const { data: permsData } = useSWR(
        '/api/permissions',
        () => roleApi.getPermissions(),
        { revalidateOnFocus: false }
    );

    // Normalized data
    const roles: Role[] = Array.isArray(rolesData) ? rolesData : rolesData?.data || [];
    const permissions: Permission[] = Array.isArray(permsData) ? permsData : permsData?.data || [];
    const filteredRoles = roles.filter(r => filterGuard === 'ALL' || r.guard_name === filterGuard);

    // Permission checks
    const userPermissions = currentUser?.permissions || [];
    const isSuperAdmin = currentUser?.role === 'super-admin';
    const canCreate = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-role') || userPermissions.includes('create-role');
    const canUpdate = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-role') || userPermissions.includes('update-role');
    const canDelete = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-role') || userPermissions.includes('delete-role');

    // --- Handlers ---
    const handleOpenForm = (role?: Role) => {
        setSelectedRole(role);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setTimeout(() => setSelectedRole(undefined), 300);
    };

    const handleDeleteClick = (role: Role) => {
        if (role.name.toLowerCase() === 'administrator') {
            toast.error(t.table.adminDeleteError);
            return;
        }
        setRoleToDelete(role);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!roleToDelete) return;
        setIsDeleting(true);
        try {
            await roleApi.deleteRole(roleToDelete.id);
            toast.success(t.delete.success);
            mutateRoles();
            setIsDeleteModalOpen(false);
            setRoleToDelete(null);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || t.delete.error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmitRole = async (data: RoleFormData) => {
        setIsSubmitting(true);
        try {
            if (selectedRole) {
                await roleApi.updateRole(selectedRole.id, data);
                toast.success(t.form.successUpdate);
            } else {
                await roleApi.createRole(data);
                toast.success(t.form.successCreate);
            }
            handleCloseForm();
            mutateRoles();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || t.form.errorSave);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        t,
        // data
        filteredRoles,
        permissions,
        isLoading: isLoadingRoles,
        rolesError,
        mutateRoles,
        // ui state
        search, setSearch,
        filterGuard, setFilterGuard,
        isFormOpen, selectedRole,
        isSubmitting,
        isDeleteModalOpen, setIsDeleteModalOpen,
        roleToDelete, isDeleting,
        // permission checks
        canCreate, canUpdate, canDelete,
        // handlers
        handleOpenForm,
        handleCloseForm,
        handleDeleteClick,
        executeDelete,
        handleSubmitRole,
    };
}
