import useSWR from 'swr';
import { api } from '../utils/api';

// Types
export interface Position {
    id: number;
    name: string;
    level: number;
    is_active: boolean;
}

export interface OrgUnit {
    id: number;
    name: string;
    pluck_code: string;
    type: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    position?: Position;
    organization_unit?: OrgUnit;
    roles?: Role[];
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    description?: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
}

// Fetchers
const fetcher = (url: string) => api<any>(url);

// Hooks
export const usePositions = () => {
    const { data, error, isLoading, mutate } = useSWR<Position[]>('/api/positions', fetcher);
    return { positions: data || [], isLoading, isError: error, mutate };
};

export const useOrgUnits = () => {
    const { data, error, isLoading, mutate } = useSWR<OrgUnit[]>('/api/organization-units', fetcher);
    return { orgUnits: data || [], isLoading, isError: error, mutate };
};

export const useUsers = () => {
    const { data, error, isLoading, mutate } = useSWR<User[]>('/api/user/users', fetcher);
    return { users: data || [], isLoading, isError: error, mutate };
};

export const useRoles = () => {
    const { data, error, isLoading, mutate } = useSWR<Role[]>('/api/roles', fetcher);
    return { roles: data || [], isLoading, isError: error, mutate };
};

export const usePermissions = () => {
    const { data, error, isLoading, mutate } = useSWR<Permission[]>('/api/permissions', fetcher);
    return { permissions: data || [], isLoading, isError: error, mutate };
};

// API calls
export const IAMService = {
    // Positions
    createPosition: (data: Partial<Position>) => api('/api/positions', { method: 'POST', body: JSON.stringify(data) }),
    updatePosition: (id: number, data: Partial<Position>) => api(`/api/positions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePosition: (id: number) => api(`/api/positions/${id}`, { method: 'DELETE' }),

    // Org Units
    createOrgUnit: (data: Partial<OrgUnit>) => api('/api/organization-units', { method: 'POST', body: JSON.stringify(data) }),
    updateOrgUnit: (id: number, data: Partial<OrgUnit>) => api(`/api/organization-units/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteOrgUnit: (id: number) => api(`/api/organization-units/${id}`, { method: 'DELETE' }),

    // Users
    createUser: (data: any) => api<User>('/api/user/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: number, data: any) => api<User>(`/api/user/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteUser: (id: number) => api(`/api/user/users/${id}`, { method: 'DELETE' }),
    assignUserRoles: (id: number, roleIds: number[]) => api(`/api/user/users/${id}/roles`, { method: 'PUT', body: JSON.stringify({ role_ids: roleIds }) }),

    // Roles
    createRole: (data: { name: string; permission_ids: number[] }) => api<Role>('/api/roles', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id: number, data: { name?: string; permission_ids?: number[] }) => api<Role>(`/api/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRole: (id: number) => api(`/api/roles/${id}`, { method: 'DELETE' }),
};

export interface MenuItem {
    type: 'item' | 'dropdown' | 'section';
    id?: string;
    href?: string;
    icon?: string;
    label: string;
    items?: MenuItem[];
}

export const useNavigationMenus = () => {
    const { data, error, isLoading, mutate } = useSWR<MenuItem[]>('/api/navigation/menus', fetcher);
    return { menus: data || [], isLoading, isError: error, mutate };
};
