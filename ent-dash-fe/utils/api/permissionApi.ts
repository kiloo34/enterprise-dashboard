/**
 * permissionApi — Permission Management API Client
 *
 * Migrated from Axios (K3 incompatible) to the shared api() utility
 * which reads the in-memory token via window.__getAuthToken().
 */
import { api } from '../api';
import type { Permission } from '../../types/role';

type ListResponse<T> = T[] | { data: T[] };

export const permissionApi = {
    getAll: () =>
        api<ListResponse<Permission>>('/api/permissions'),

    getById: (id: number) =>
        api<Permission>(`/api/permissions/${id}`),

    create: (data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) =>
        api<Permission>('/api/permissions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: number, data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) =>
        api<Permission>(`/api/permissions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: number) =>
        api<void>(`/api/permissions/${id}`, {
            method: 'DELETE',
        }),
};
