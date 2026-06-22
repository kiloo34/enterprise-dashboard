"use client";

import React, { useState, useCallback } from "react";
import { Database, RefreshCw, Layers } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EngineLogStats } from "./components/EngineLogStats";
import { EngineLogFilters } from "./components/EngineLogFilters";
import { EngineLogTable } from "./components/EngineLogTable";
import { EngineLogDetailModal } from "./components/EngineLogDetailModal";
import { useReconLogs, useReconStats } from "@/services/ReconService";
import { EngineLog } from "@/types/recon";
import clsx from "clsx";
import { exportToCSV } from "@/utils/export";
import { useDebounce } from "@/hooks/useDebounce";

const TIME_RANGES = [
    { label: "24j", hours: 24 },
    { label: "7h", hours: 24 * 7 },
    { label: "30h", hours: 24 * 30 },
] as const;

type TimeRangeLabel = (typeof TIME_RANGES)[number]["label"];

export default function RekonEnginePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [engineName, setEngineName] = useState("ALL");
    const [logLevel, setLogLevel] = useState("ALL");
    const [module, setModule] = useState("ALL");
    const [liveTail, setLiveTail] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRangeLabel>("30h");
    const [selectedLog, setSelectedLog] = useState<EngineLog | null>(null);

    const { logs, isLoading, isValidating, mutate: mutateLogs } = useReconLogs({
        engineName,
        logLevel,
        module,
        searchQuery: debouncedSearchQuery,
        liveTail,
    });

    const { stats, isLoading: statsLoading, mutate: mutateStats } = useReconStats(liveTail);

    const handleRefresh = useCallback(() => {
        mutateLogs();
        mutateStats();
    }, [mutateLogs, mutateStats]);

    const handleExport = useCallback(() => {
        const formattedData = logs.map((l) => ({
            "Timestamp": l.timestamp,
            "Nama Engine": l.engineName,
            "Run ID": l.runId,
            "Level": l.level,
            "Tabel Log": l.tableName,
            "Tabel Histori": l.historyTable,
            "Modul": l.module,
            "Pesan": l.message
        }));
        
        exportToCSV(formattedData, `engine-rekon-log-${timeRange}`);
    }, [logs, timeRange]);

    return (
        <div className="min-h-screen bg-transparent p-6 lg:p-8 space-y-8 overflow-x-hidden">
            <PageHeader
                title="Monitoring Engine Rekonsiliasi"
                description="Memantau histori eksekusi (engine_*_his) dan log detail (engine_*_log) dari schema rekon secara real-time."
                icon={Layers}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 p-1 rounded-xl shadow-sm border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                            {TIME_RANGES.map(({ label }) => (
                                <button
                                    key={label}
                                    onClick={() => setTimeRange(label)}
                                    className={clsx(
                                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        timeRange === label ? "shadow-sm" : "hover:text-[var(--text-primary)]"
                                    )}
                                    style={{
                                        background: timeRange === label ? 'var(--card-bg-hover)' : 'transparent',
                                        color: timeRange === label ? 'var(--text-primary)' : 'var(--text-muted)'
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isValidating}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold disabled:opacity-50 shadow-sm border hover:bg-[var(--btn-secondary-hover-bg)]"
                            style={{
                                background: 'var(--btn-secondary-bg)',
                                borderColor: 'var(--btn-secondary-border)',
                                color: 'var(--btn-secondary-text)'
                            }}
                        >
                            <RefreshCw className={clsx("w-4 h-4", isValidating && "animate-spin")} />
                            Refresh
                        </button>
                    </div>
                }
            />

            {/* Stats Section */}
            <EngineLogStats
                totalLogs={stats?.totalLogs || 0}
                errorTrend={stats?.errorTrend || 0}
                warningCount={stats?.warningCount || 0}
                mostActiveEngine={stats?.mostActiveEngine || "-"}
                mostActivePercent={stats?.mostActivePercent || 0}
                isLoading={statsLoading}
            />

            {/* Filters Section */}
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
                isRefreshing={isValidating}
            />

            {/* Table Section */}
            <div className="rounded-2xl shadow-sm overflow-hidden transition-all border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <EngineLogTable logs={logs} isLoading={isLoading} onViewDetail={setSelectedLog} />
            </div>

            {/* Detail Modal */}
            <EngineLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
}
