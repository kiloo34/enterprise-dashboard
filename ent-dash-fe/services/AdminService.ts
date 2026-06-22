import useSWR from 'swr';
import { api } from '../utils/api';

export interface RecentImport {
    id: number;
    file_name: string;
    target_table: string;
    status: string;
    total_rows: number | null;
    processed_rows: number | null;
    failed_rows: number | null;
    created_at: string | null;
}

export interface RecentUser {
    id: number;
    name: string;
    email: string;
    created_at: string | null;
}

export interface AdminSystemStats {
    users: {
        total: number;
        recent_30_days: number;
        recent_list: RecentUser[];
    };
    organization: {
        total_units: number;
    };
    imports: {
        total: number;
        completed: number;
        failed: number;
        pending: number;
        recent_list: RecentImport[];
    };
}

const fetcher = (url: string) => api<AdminSystemStats>(url);

export const useAdminStats = () => {
    const { data, error, isLoading, mutate } = useSWR<AdminSystemStats>(
        '/api/admin/system-stats',
        fetcher,
        { refreshInterval: 30000 } // refresh every 30 seconds
    );

    return {
        stats: data,
        isLoading,
        isError: !!error,
        mutate,
    };
};
