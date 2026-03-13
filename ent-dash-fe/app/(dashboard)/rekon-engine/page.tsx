'use client';

import React, { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Database } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EngineLogStats } from './components/EngineLogStats';
import { EngineLogFilters } from './components/EngineLogFilters';
import { EngineLogTable, EngineLog } from './components/EngineLogTable';
import { EngineLogDetailModal } from './components/EngineLogDetailModal';
import { api } from '@/app/utils/api';

// ─── Time range selector options ─────────────────────────────────────────────
const TIME_RANGES = [
    { label: '24j', hours: 24 },
    { label: '7h', hours: 24 * 7 },
    { label: '30h', hours: 24 * 30 },
] as const;
type TimeRangeLabel = (typeof TIME_RANGES)[number]['label'];

export default function RekonEnginePage() {
    // ─── Filter state ─────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [engineName, setEngineName] = useState('ALL');
    const [logLevel, setLogLevel] = useState('ALL');
    const [module, setModule] = useState('ALL');
    const [liveTail, setLiveTail] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRangeLabel>('30h');
    const [selectedLog, setSelectedLog] = useState<EngineLog | null>(null);

    // ─── API Fetching w/ SWR ──────────────────────────────────────────────────
    const queryParams = new URLSearchParams({
        limit: '100',
        ...(engineName !== 'ALL' && { engineName }),
        ...(logLevel !== 'ALL' && { logLevel }),
        ...(module !== 'ALL' && { module }),
        ...(searchQuery && { searchQuery }),
    }).toString();

    const {
        data: logs = [],
        isValidating: isRefreshing,
        mutate: mutateLogs
    } = useSWR<EngineLog[]>(
        `api/engine/monitor/logs?${queryParams}`,
        (url) => api<EngineLog[]>(url).then(res => res || []),
        { refreshInterval: liveTail ? 5000 : 0 }
    );

    const {
        data: statsData,
        mutate: mutateStats
    } = useSWR(
        'api/engine/monitor/stats',
        (url) => api<any>(url).then(res => res || {}),
        { refreshInterval: liveTail ? 10000 : 0 }
    );

    // ─── Stats Fallback ───────────────────────────────────────────────────────
    const stats = {
        totalLogs: statsData?.totalLogs || 0,
        errorTrend: statsData?.errorTrend || 0,
        warningCount: statsData?.warningCount || 0,
        mostActiveEngine: statsData?.mostActiveEngine || '-',
        mostActivePercent: statsData?.mostActivePercent || 0,
    };

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleRefresh = useCallback(() => {
        mutateLogs();
        mutateStats();
    }, [mutateLogs, mutateStats]);

    const handleExport = useCallback(() => {
        const headers = ['Timestamp', 'Nama Engine', 'Run ID', 'Level', 'Tabel Log', 'Tabel Histori', 'Modul', 'Pesan'];
        const rows = logs.map(l => [
            l.timestamp,
            l.engineName,
            l.runId,
            l.level,
            `"${l.tableName}"`,
            `"${l.historyTable}"`,
            `"${l.module}"`,
            `"${l.message.replace(/"/g, '""')}"`,
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `engine-rekon-log-${timeRange}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [logs, timeRange]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-5">

            {/* ── Header + Time range selector ──────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                    <PageHeader
                        title="Monitoring Engine Rekonsiliasi"
                        description="Memantau histori eksekusi (engine_*_his) dan log detail (engine_*_log) dari schema rekon."
                        icon={Database}
                    />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start mt-1">
                    {TIME_RANGES.map(({ label }) => (
                        <button
                            key={label}
                            onClick={() => setTimeRange(label)}
                            className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${timeRange === label
                                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                    <button className="px-3.5 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-all">
                        Custom
                    </button>
                </div>
            </div>

            {/* ── Stat cards ────────────────────────────────────────────── */}
            <EngineLogStats {...stats} />

            {/* ── Filter toolbar ────────────────────────────────────────── */}
            <EngineLogFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                engineName={engineName}
                onEngineChange={setEngineName}
                logLevel={logLevel}
                onLevelChange={setLogLevel}
                module={module}
                onModuleChange={setModule}
                liveTail={liveTail}
                onLiveTailChange={setLiveTail}
                onExport={handleExport}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* ── Log table ─────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <EngineLogTable
                    logs={logs}
                    isLoading={isRefreshing}
                    onViewDetail={setSelectedLog}
                />
            </div>

            {/* ── Detail modal ──────────────────────────────────────────── */}
            <EngineLogDetailModal
                log={selectedLog}
                onClose={() => setSelectedLog(null)}
            />
        </div>
    );
}
