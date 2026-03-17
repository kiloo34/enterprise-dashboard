import axios from 'axios';
import { UserFormData } from '../../types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};

    try {
        const storedUser = sessionStorage.getItem('auth-user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user && user.accessToken) {
                return { Authorization: `Bearer ${user.accessToken}` };
            }
        }
    } catch (e) {
        console.error('Failed to parse auth user for token', e);
    }

    return {};
};

const axiosInstance = axios.create({
    baseURL: API_URL.replace(/\/+$/, ''),
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use((config) => {
    // Smart URL joining to avoid double /api
    if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
        config.url = config.url.substring(4);
    }

    const headers = getAuthHeaders();
    if (headers.Authorization) {
        config.headers.Authorization = headers.Authorization;
    }
    return config;
});

// Add response interceptor to handle 401 Unauthorized
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('auth-user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const userApi = {
    // Get all users
    getUsers: async (search?: string) => {
        const response = await axiosInstance.get('/api/users', {
            params: { search }
        });
        return response.data;
    },

    // Get a specific user
    getUser: async (id: number) => {
        const response = await axiosInstance.get(`/api/users/${id}`);
        return response.data;
    },

    // Create a new user
    createUser: async (data: UserFormData) => {
        const response = await axiosInstance.post('/api/users', data);
        return response.data;
    },

    // Update a user
    updateUser: async (id: number, data: UserFormData) => {
        const response = await axiosInstance.put(`/api/users/${id}`, data);
        return response.data;
    },

    // Delete a user
    deleteUser: async (id: number) => {
        const response = await axiosInstance.delete(`/api/users/${id}`);
        return response.data;
    },

    // Get lookups for dropdowns (Roles, Positions, OrganizationUnits)
    getLookups: async () => {
        // Fetch parallel data for dependent dropdowns
        const [rolesRes, positionsRes, unitsRes] = await Promise.all([
            axiosInstance.get('/api/roles'), // Assuming this returns roles via role resource
            // Mocks for now, since we haven't created the endpoints for positions and units. 
            // In a real app we'd query /api/positions and /api/organization-units 
            axiosInstance.get('/api/positions').catch(() => ({ data: { data: [] } })),
            axiosInstance.get('/api/organization-units').catch(() => ({ data: { data: [] } }))
        ]);

        return {
            roles: rolesRes.data?.data || [],
            positions: positionsRes.data?.data || [],
            organizationUnits: unitsRes.data?.data || []
        };
    }
};
