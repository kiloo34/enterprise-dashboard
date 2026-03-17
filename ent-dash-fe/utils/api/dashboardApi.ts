import axios from 'axios';

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


