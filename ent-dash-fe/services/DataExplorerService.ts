import { api } from '@/utils/api';

// ── Types ───────────────────────────────────────────────────────────────────

export interface TableInfo {
    key: string;
    table_name: string;
    schema: string;
    display_name: string;
}

export interface ColumnSchema {
    name: string;
    type: string;
    nullable: boolean;
    primary_key: boolean;
    default: string | null;
}

export interface PaginatedResult<T = Record<string, unknown>> {
    data: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface QueryParams {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
}

// ── Service ─────────────────────────────────────────────────────────────────

const BASE = 'api/dw/engine/explorer';

export class DataExplorerService {
    static async getTables(): Promise<TableInfo[]> {
        return api<TableInfo[]>(`${BASE}/tables`);
    }

    static async getSchema(tableKey: string): Promise<ColumnSchema[]> {
        return api<ColumnSchema[]>(`${BASE}/${tableKey}/schema`);
    }

    static async getRecords(
        tableKey: string,
        params: QueryParams = {},
    ): Promise<PaginatedResult> {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.search) query.set('search', params.search);
        if (params.sort_by) query.set('sort_by', params.sort_by);
        if (params.sort_dir) query.set('sort_dir', params.sort_dir);
        const qs = query.toString();
        return api<PaginatedResult>(`${BASE}/${tableKey}${qs ? `?${qs}` : ''}`);
    }

    static async createRecord(
        tableKey: string,
        data: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
        return api<Record<string, unknown>>(`${BASE}/${tableKey}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async updateRecord(
        tableKey: string,
        recordId: number,
        data: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
        return api<Record<string, unknown>>(`${BASE}/${tableKey}/${recordId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async deleteRecord(tableKey: string, recordId: number): Promise<void> {
        await api(`${BASE}/${tableKey}/${recordId}`, { method: 'DELETE' });
    }
}
