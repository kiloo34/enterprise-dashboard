import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { User, Role, Position, OrganizationUnit, UserFormData, Permission } from '@/types/user';
import { userApi } from '@/utils/api/userApi';
import { permissionApi } from '@/utils/api/permissionApi';
import { useAuth } from '@/components/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

// Helper for lookups
const fetchLookups = async () => {
    const [lookups, permRes] = await Promise.all([
        userApi.getLookups(),
        permissionApi.getAll()
    ]);
    return { lookups, permRes };
};

export function useUserManagement() {
    const t = useTranslation("Users");
    const { user: currentUser } = useAuth();

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterUnit, setFilterUnit] = useState('ALL');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form Selection
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

    // Debounce Search Query
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Data Fetching via SWR
    const {
        data: rawUsers,
        error: _usersError,
        mutate: mutateUsers,
        isLoading: isLoadingUsers
    } = useSWR(
        ['/api/users', debouncedSearch],
        ([, search]) => userApi.getUsers(search),
        {
            onError: () => toast.error(t.table.loading),
            revalidateOnFocus: false // Prevents excessive table refetching when switching tabs
        }
    );

    const {
        data: lookupsData,
        isLoading: isLoadingLookups
    } = useSWR(
        '/api/lookups_and_permissions',
        fetchLookups,
        {
            revalidateOnFocus: false, // Lookups rarely change
            revalidateIfStale: false
        }
    );

    // Normalize Data
    const users: User[] = Array.isArray(rawUsers) ? rawUsers : (rawUsers?.data || []);
    const roles: Role[] = lookupsData?.lookups?.roles || [];
    const positions: Position[] = lookupsData?.lookups?.positions || [];
    const units: OrganizationUnit[] = lookupsData?.lookups?.organizationUnits || [];

    const rawPerms = lookupsData?.permRes;
    const permissions: Permission[] = Array.isArray(rawPerms) ? rawPerms : (rawPerms?.data || []);

    const isLoading = isLoadingUsers || isLoadingLookups;

    // --- Form Handlers ---
    const handleOpenForm = (user?: User) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setTimeout(() => setSelectedUser(undefined), 300);
    };

    const handleSubmitForm = async (data: UserFormData) => {
        setIsSubmitting(true);
        try {
            if (selectedUser) {
                await userApi.updateUser(selectedUser.id, data);
                toast.success(t.form.successUpdate);
            } else {
                await userApi.createUser(data);
                toast.success(t.form.successCreate);
            }
            mutateUsers(); // Optimistic refetch using SWR
            handleCloseForm();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message || t.form.errorSave);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Delete Handlers ---
    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await userApi.deleteUser(userToDelete.id);
            toast.success(t.delete.success);
            mutateUsers(); // Revalidate SWR Cache
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        } catch (error) {
            toast.error(t.delete.error);
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Derived State & Permissions ---
    const userPermissions = currentUser?.permissions || [];
    const isSuperAdmin = currentUser?.role === 'super-admin';
    const canCreate = isSuperAdmin || userPermissions.includes('manage-user') || userPermissions.includes('create-user');
    const canUpdate = isSuperAdmin || userPermissions.includes('manage-user') || userPermissions.includes('update-user');
    const canDelete = isSuperAdmin || userPermissions.includes('manage-user') || userPermissions.includes('delete-user');
    const canManageRBAC = isSuperAdmin || userPermissions.includes('manage-rbac') || userPermissions.includes('manage-user');

    const filteredUsers = users.filter((user) => {
        const matchesRole = filterRole === 'ALL' || user.roles?.some((r) => r.name === filterRole);
        const matchesUnit = filterUnit === 'ALL' || user.organization_unit?.name === filterUnit;
        return matchesRole && matchesUnit;
    });

    return {
        t,
        users: filteredUsers,
        roles,
        positions,
        units,
        permissions,
        isLoading,
        searchQuery,
        setSearchQuery,
        isFormOpen,
        isSubmitting,
        filterRole,
        setFilterRole,
        filterUnit,
        setFilterUnit,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        userToDelete,
        isDeleting,
        selectedUser,
        canCreate,
        canUpdate,
        canDelete,
        canManageRBAC,
        handleOpenForm,
        handleCloseForm,
        handleSubmitForm,
        handleDeleteClick,
        executeDelete
    };
}
