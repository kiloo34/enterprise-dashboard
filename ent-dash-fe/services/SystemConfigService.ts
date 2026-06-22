import useSWR, { mutate } from 'swr';
import { api } from '../utils/api';

export type ConfigValueType = 'string' | 'integer' | 'boolean' | 'list' | 'json';

export interface SystemConfig {
    id: number;
    key: string;
    value: string;
    value_type: ConfigValueType;
    description: string | null;
    is_editable: boolean;
    is_sensitive: boolean;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface SystemConfigUpdate {
    value: string;
    description?: string;
}

export interface BulkUpdateItem {
    key: string;
    value: string;
}

const fetcher = (url: string) => api<SystemConfig[]>(url);

export const useSystemConfigs = () => {
    const { data, error, isLoading } = useSWR<SystemConfig[]>(
        '/api/system-config',
        fetcher,
        { revalidateOnFocus: false }
    );
    return { configs: data || [], isLoading, isError: error };
};

export const SystemConfigService = {
    getAll: () => api<SystemConfig[]>('/api/system-config'),

    updateOne: async (key: string, body: SystemConfigUpdate): Promise<SystemConfig> => {
        const result = await api<SystemConfig>(`/api/system-config/${key}`, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        await mutate('/api/system-config');
        return result;
    },

    bulkUpdate: async (items: BulkUpdateItem[]): Promise<SystemConfig[]> => {
        const result = await api<SystemConfig[]>('/api/system-config', {
            method: 'PUT',
            body: JSON.stringify({ items }),
        });
        await mutate('/api/system-config');
        return result;
    },

    refreshCache: async (): Promise<void> => {
        await api('/api/system-config/refresh-cache', { method: 'POST' });
    },
};
