import { api } from '../utils/api';

export interface AuditLog {
    id: number;
    user_id?: number;
    action: string;
    target_type: string;
    target_id?: string;
    ip_address?: string;
    user_agent?: string;
    endpoint?: string;
    method?: string;
    status_code?: number;
    details?: any;
    payload?: any;
    created_at: string;
}

export const AuditService = {
    async getAuditLogs(skip = 0, limit = 100): Promise<AuditLog[]> {
        try {
            return await api<AuditLog[]>(`/v1/audit-logs?skip=${skip}&limit=${limit}`, {
                method: 'GET'
            });
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            throw error;
        }
    }
};
