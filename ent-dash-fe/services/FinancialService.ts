import useSWR from 'swr';
import { api } from '../utils/api';

export interface FinancialIndicator {
    id: number;
    slug: string;
    label: string;
    category: string;
    level: number;
    is_bold: boolean;
    is_link: boolean;
    is_ratio: boolean;
    is_visible?: boolean;
    deleted_at?: string | null;
    urut?: number;
    kelompok?: string;
    jenis?: string;
}

export interface FinancialMetric {
    indicator: FinancialIndicator;
    report_date: string;
    value: number | null;
    target_nominal: number | null;
    wil?: string;
    nama_wil?: string;
    cab?: string;
    nama_cab?: string;
    is_ajp: boolean;
    history: (number | null)[];
    dtd_nominal: number | null;
    dtd_pct: number | null;
    mtd_nominal: number | null;
    mtd_pct: number | null;
    ytd_nominal: number | null;
    ytd_pct: number | null;
    yoy_nominal: number | null;
    yoy_pct: number | null;
}

const fetcher = (url: string) => api<{ metrics: FinancialMetric[], dates: string[] }>(url);

export const useFinancialDashboard = (category?: string) => {
    const url = `/api/dashboard/financial${category ? `?category=${category}` : ''}`;
    const { data, error, isLoading, mutate } = useSWR<{ metrics: FinancialMetric[], dates: string[] }>(url, fetcher);

    return {
        metrics: data?.metrics || [],
        dates: data?.dates || [],
        isLoading,
        isError: error,
        mutate
    };
};

export const FinancialService = {
    // Add additional specialized methods if needed
};
