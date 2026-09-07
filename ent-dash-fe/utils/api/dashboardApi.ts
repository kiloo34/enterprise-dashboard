/**
 * dashboardApi — Dashboard Data API Client
 *
 * Migrated from Axios (K3 incompatible) to the shared api() utility
 * which reads the in-memory token via window.__getAuthToken().
 */
import { api } from '../api';

export const dashboardApi = {
    // Add dashboard-specific API methods here as needed.
    // Example: getStats: () => api<unknown>('/api/admin/system-stats'),
};
