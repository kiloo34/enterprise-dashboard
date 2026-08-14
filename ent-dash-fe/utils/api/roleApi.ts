/**
 * roleApi — Role Management API Client
 *
 * Migrated from Axios (K3 incompatible) to the shared api() utility
 * which reads the in-memory token via window.__getAuthToken().
 */
import { api } from '../api';
import type { Role, Permission, RoleFormData } from '../../types/role';

// The backend can return a plain array OR a paginated { data: T[] } envelope
type ListResponse<T> = T[] | { data: T[] };

export const roleApi = {
    getRoles: (search?: string) =>
        api<ListResponse<Role>>('/api/roles', {
            params: search ? { search } : undefined,
        }),

    getRole: (id: number) =>
        api<Role>(`/api/roles/${id}`),

    createRole: (data: RoleFormData) =>
        api<Role>('/api/roles', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateRole: (id: number, data: RoleFormData) =>
        api<Role>(`/api/roles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteRole: (id: number) =>
        api<void>(`/api/roles/${id}`, {
            method: 'DELETE',
        }),

    getPermissions: () =>
        api<ListResponse<Permission>>('/api/permissions'),
};
