import { api } from '@/utils/api';

export interface ColumnDefinition {
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
    primary_key: boolean;
}

const BASE = 'api/dw/dictionary';

export const getSchemas = async (): Promise<string[]> => {
    return api<string[]>(`${BASE}/schemas`);
};

export const getTables = async (schema: string): Promise<string[]> => {
    return api<string[]>(`${BASE}/${schema}/tables`);
};

export const getTableColumns = async (schema: string, tableName: string): Promise<ColumnDefinition[]> => {
    return api<ColumnDefinition[]>(`${BASE}/${schema}/tables/${tableName}/columns`);
};
