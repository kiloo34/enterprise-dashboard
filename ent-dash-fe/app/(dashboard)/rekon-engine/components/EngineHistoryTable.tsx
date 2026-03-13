import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/Card';
import { Calendar, Download, RefreshCw, Layers, CheckCircle, XCircle, Clock, Copy, Search, FileText, Database } from 'lucide-react';
import { clsx } from "clsx";
import { StatusBadge, BadgeStatus } from '@/app/components/ui/StatusBadge';
import { SearchableSelect } from '@/app/components/ui/SearchableSelect';

interface ImportHistory {
    id: string;
    file_name: string;
    target_table: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
    total_rows: number;
    processed_rows: number;
    failed_rows: number;
    error_log: Record<string, unknown>;
    created_at: string;
}

interface DynamicEngineData {
    id?: number;
    [key: string]: any;
}

interface EngineHistoryTableProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: Record<string, any>;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    filterStatus: string;
    setFilterStatus: (val: string) => void;
    filterTable: string;
    setFilterTable: (val: string) => void;
    isDynamicMode: boolean;
    isDynamicLoading: boolean;
    dynamicColumns: string[];
    dynamicRows: DynamicEngineData[];
    filteredHistory: ImportHistory[];
    mutateHistory: () => void;
}

export function EngineHistoryTable({
    t,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterTable,
    setFilterTable,
    isDynamicMode,
    isDynamicLoading,
    dynamicColumns,
    dynamicRows,
    filteredHistory,
    mutateHistory
}: EngineHistoryTableProps) {
    return (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
            <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-800/60 mb-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">{t.historyTitle}</CardTitle>
                    <CardDescription className="text-xs mb-4 mt-2">
                        {t.historyDesc}
                    </CardDescription>
                </div>
                <button onClick={() => { if (!isDynamicMode && mutateHistory) mutateHistory(); }} className="mb-4 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors" title="Refresh Data">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 px-4 sm:px-0 pt-4 sm:pt-0">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-3 shadow-sm transition-all"
                        />
                    </div>
                    <div className="w-full sm:w-[200px]">
                        <SearchableSelect
                            options={[
                                { value: "ALL", label: t.statusFilter || "Semua Status" },
                                { value: "completed", label: t.status?.completed || "Completed" },
                                { value: "processing", label: t.status?.processing || "Processing" },
                                { value: "pending", label: t.status?.pending || "Pending" },
                                { value: "failed", label: t.status?.failed || "Failed" }
                            ]}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder={t.statusFilter || "Pilih Status..."}
                            searchPlaceholder="Cari status..."
                        />
                    </div>
                    <div className="w-full sm:w-[250px]">
                        <SearchableSelect
                            options={[
                                { value: "ALL", label: t.tableFilter || "Semua Tabel" },
                                { value: "engine_job_entry_log", label: t.tables?.engine_job_entry_log || "Job Entry Log" },
                                { value: "engine_job_log", label: t.tables?.engine_job_log || "Job Log" },
                                { value: "engine_process_group", label: t.tables?.engine_process_group || "Engine Group" },
                                { value: "engine_process_group_his", label: t.tables?.engine_process_group_his || "Engine Group History" },
                                { value: "engine_sts_load_data", label: t.tables?.engine_sts_load_data || "Engine Load Data" },
                                { value: "engine_sts_load_data_his", label: t.tables?.engine_sts_load_data_his || "Engine Load Data History" },
                                { value: "engine_sts_proses_rpt", label: t.tables?.engine_sts_proses_rpt || "Engine Process Report" },
                                { value: "engine_sts_proses_rpt_his", label: t.tables?.engine_sts_proses_rpt_his || "Engine Process Report History" }
                            ]}
                            value={filterTable}
                            onChange={setFilterTable}
                            placeholder={t.tableFilter || "Pilih Tabel..."}
                            searchPlaceholder="Cari tabel..."
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                {isDynamicMode ? (
                                    dynamicColumns.map((col) => (
                                        <th key={col} className="px-6 py-4 font-semibold tracking-wider">
                                            {col.replace(/_/g, ' ')}
                                        </th>
                                    ))
                                ) : (
                                    <>
                                        <th className="px-6 py-4 font-semibold tracking-wider">{t.table.file}</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">{t.table.table}</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider text-center">{t.table.status}</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider text-right">{t.table.processed}</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider text-right">{t.table.date}</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent">
                            {isDynamicMode && isDynamicLoading ? (
                                <tr>
                                    <td colSpan={dynamicColumns.length || 5} className="px-6 py-12 text-center text-slate-500">
                                        <RefreshCw className="w-8 h-8 opacity-20 animate-spin mx-auto mb-2" />
                                        <span className="text-sm">Memuat Data Tabel...</span>
                                    </td>
                                </tr>
                            ) : isDynamicMode && dynamicRows.length === 0 ? (
                                <tr>
                                    <td colSpan={dynamicColumns.length || 5} className="px-6 py-12 text-center text-slate-500">
                                        <Search className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                        <span className="text-sm">Tabel ini kosong atau tidak ada data.</span>
                                    </td>
                                </tr>
                            ) : isDynamicMode ? (
                                dynamicRows.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        {dynamicColumns.map((col) => {
                                            const val = row[col];
                                            const isDate = typeof val === 'string' && val.includes('T') && val.includes('-');

                                            // Attempt to style specific columns like status
                                            if (col === 'status' || col === 'status_desc' || col === 'status_flag') {
                                                let badgeStatus: BadgeStatus = 'default';
                                                const s = String(val).toLowerCase();
                                                if (s === 'end' || s.includes('success') || s === 's') badgeStatus = 'success';
                                                if (s === 'start' || s.includes('process') || s === 'p') badgeStatus = 'processing';
                                                if (s === 'error' || s.includes('fail') || s === 'e') badgeStatus = 'failed';
                                                return (
                                                    <td key={col} className="px-6 py-4">
                                                        <StatusBadge status={badgeStatus} label={String(val)} />
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={col} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    {isDate ? new Date(val).toLocaleString('id-ID', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    }) : String(val ?? '-')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <span className="text-sm">{t.table.empty}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((record: ImportHistory) => {
                                    const isProcessing = record.status === 'processing';
                                    const isPending = record.status === 'pending';
                                    const pct = record.total_rows > 0 ? Math.round((record.processed_rows / record.total_rows) * 100) : 0;

                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[180px]" title={record.file_name}>
                                                        {record.file_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    {record.target_table}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge
                                                    status={record.status as BadgeStatus}
                                                    showIcon={isProcessing}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isProcessing || isPending ? (
                                                    <div className="flex flex-col items-end gap-1.5 w-32 ml-auto">
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                            {isPending ? t.table.queuing : `${pct}% (${record.processed_rows.toLocaleString()})`}
                                                        </span>
                                                        {isProcessing && record.total_rows > 0 && (
                                                            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800 overflow-hidden">
                                                                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}% ` }}></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`font-medium ${record.failed_rows > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {record.processed_rows.toLocaleString()} <span className="text-slate-400 font-normal">/ {(record.total_rows || record.processed_rows).toLocaleString()}</span>
                                                        </span>
                                                        {record.failed_rows > 0 && (
                                                            <span className="text-[11px] font-semibold text-rose-500 mt-0.5 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-1.5 rounded">
                                                                {record.failed_rows.toLocaleString()} error
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                                {new Date(record.created_at).toLocaleString('id-ID', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
