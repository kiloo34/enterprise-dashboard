/**
 * Dashboard Service
 * 
 * Handles all dashboard-related data fetching operations.
 * Following the Feature Service pattern from Unified Coding Rules.
 */
import { api } from "../utils/api";

export interface QrisStatsResponse {
    totalTransactions: number;
    settledAmount: number;
    unsettledAmount: number;
    totalDiscrepancyAmount: number;
}

export class DashboardService {
    /**
     * Fetch QRIS reconciliation stats from the backend
     */
    static async getQrisStats(): Promise<QrisStatsResponse> {
        return await api<QrisStatsResponse>("/api/dashboard/qris-stats");
    }
}
