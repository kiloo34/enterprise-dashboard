/**
 * userApi — User Management API Client
 *
 * Migrated from Axios (K3 incompatible) to the shared api() utility
 * which reads the in-memory token via window.__getAuthToken().
 * This ensures the Bearer token is always sourced from memory (not sessionStorage),
 * consistent with the K3 security fix in AuthContext.
 */
import { api } from '../api';
import type { User, Role, OrganizationUnit, Position, UserFormData } from '../../types/user';

// The backend can return a plain array OR a paginated { data: T[] } envelope
type ListResponse<T> = T[] | { data: T[] };

interface LookupsResponse {
    roles: Role[];
    positions: Position[];
    organizationUnits: OrganizationUnit[];
}

export const userApi = {
    /** Get all users with optional search */
    getUsers: (search?: string) =>
        api<ListResponse<User>>('/api/users', {
            params: search ? { search } : undefined,
        }),

    /** Get a single user by ID */
    getUser: (id: number) =>
        api<User>(`/api/users/${id}`),

    /** Create a new user */
    createUser: (data: UserFormData) =>
        api<User>('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /** Update an existing user */
    updateUser: (id: number, data: UserFormData) =>
        api<User>(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** Delete a user */
    deleteUser: (id: number) =>
        api<void>(`/api/users/${id}`, {
            method: 'DELETE',
        }),

    /** Get lookup data: roles, positions, org-units */
    getLookups: async (): Promise<LookupsResponse> => {
        const [rolesRes, positionsRes, unitsRes] = await Promise.allSettled([
            api<ListResponse<Role>>('/api/roles'),
            api<ListResponse<Position>>('/api/positions'),
            api<ListResponse<OrganizationUnit>>('/api/organization-units'),
        ]);

        const extractData = <T>(res: PromiseSettledResult<ListResponse<T>>): T[] => {
            if (res.status === 'rejected') return [];
            const val = res.value;
            if (Array.isArray(val)) return val;
            return (val as { data: T[] }).data ?? [];
        };

        return {
            roles: extractData(rolesRes),
            positions: extractData(positionsRes),
            organizationUnits: extractData(unitsRes),
        };
    },
};
