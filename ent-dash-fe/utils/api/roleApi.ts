import axios from 'axios';
import { RoleFormData } from '../../types/role';

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

// Add request interceptor for tokens and smart URL joining
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

export const roleApi = {
    // Get all roles
    getRoles: async (search?: string) => {
        const response = await axiosInstance.get('/api/roles', {
            params: { search }
        });
        return response.data;
    },

    // Get a specific role
    getRole: async (id: number) => {
        const response = await axiosInstance.get(`/api/roles/${id}`);
        return response.data;
    },

    // Create a new role
    createRole: async (data: RoleFormData) => {
        const response = await axiosInstance.post('/api/roles', data);
        return response.data;
    },

    // Update a role
    updateRole: async (id: number, data: RoleFormData) => {
        const response = await axiosInstance.put(`/api/roles/${id}`, data);
        return response.data;
    },

    // Delete a role
    deleteRole: async (id: number) => {
        const response = await axiosInstance.delete(`/api/roles/${id}`);
        return response.data;
    },

    // Get all permissions (for the form mapping)
    getPermissions: async () => {
        const response = await axiosInstance.get('/api/permissions');
        return response.data;
    }
};
