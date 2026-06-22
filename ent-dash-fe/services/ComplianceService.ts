import { api } from '../utils/api';

export interface AnomalyAlert {
    user_id: number;
    ip_address: string;
    incident_type: string;
    count: number;
    severity: string;
}

export interface ComplianceReport {
    health_score: number;
    retention_gaps: number;
    breach_alerts: AnomalyAlert[];
    timestamp: string;
}

interface ComplianceResponse {
    status: string;
    data: ComplianceReport;
}

export const ComplianceService = {
    /**
     * Fetch the holistic UU PDP compliance report.
     */
    async getReport(): Promise<ComplianceReport> {
        try {
            const response = await api<ComplianceResponse>('/v1/compliance/report', {
                method: 'GET'
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch compliance report:", error);
            throw error;
        }
    }
};
