import useSWR from "swr";
import { api } from "@/utils/api";
import { EngineLog, ReconStats } from "@/types/recon";

export function useReconLogs(filters: {
    engineName?: string;
    logLevel?: string;
    module?: string;
    searchQuery?: string;
    liveTail?: boolean;
}) {
    const queryParams = new URLSearchParams({
        limit: "100",
        ...(filters.engineName !== "ALL" && filters.engineName && { engineName: filters.engineName }),
        ...(filters.logLevel !== "ALL" && filters.logLevel && { logLevel: filters.logLevel }),
        ...(filters.module !== "ALL" && filters.module && { module: filters.module }),
        ...(filters.searchQuery && { searchQuery: filters.searchQuery }),
    }).toString();

    const { data, error, isValidating, mutate } = useSWR<EngineLog[]>(
        `api/engine/monitor/logs?${queryParams}`,
        (url) => api<EngineLog[]>(url).then((res) => res || []),
        { refreshInterval: filters.liveTail ? 5000 : 0 }
    );

    return {
        logs: data || [],
        isLoading: !error && !data,
        isError: error,
        isValidating,
        mutate,
    };
}

export function useReconStats(liveTail: boolean = false) {
    const { data, error, mutate } = useSWR<ReconStats>(
        "api/engine/monitor/stats",
        (url) => api<ReconStats>(url).then((res) => res || {
            totalLogs: 0,
            errorTrend: 0,
            warningCount: 0,
            mostActiveEngine: "-",
            mostActivePercent: 0,
        }),
        { refreshInterval: liveTail ? 10000 : 0 }
    );

    return {
        stats: data,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}
