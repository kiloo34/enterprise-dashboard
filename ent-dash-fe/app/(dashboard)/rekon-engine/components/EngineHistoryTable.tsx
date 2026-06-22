'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { RefreshCw, RotateCcw, Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Loader2, Clock, Terminal, SkipForward } from 'lucide-react';
import { StatusBadge, BadgeStatus } from '@/components/ui/StatusBadge';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface ImportHistory {
    id: string;
    file_name: string;
    target_table: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | 'cancelled';
    total_rows: number;
    processed_rows: number;
    failed_rows: number;
    error_log: Record<string, unknown> | null;
    created_at: string;
    updated_at?: string;
}

interface DynamicEngineData {
    id?: number;
    [key: string]: unknown;
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
    onRetry?: (id: string) => Promise<void>;
    onCancel?: (id: string) => Promise<void>;
    onResetStuck?: () => Promise<void>;
}

// ─── Expandable Row Detail ─────────────────────────────────────────────────────
function ImportDetailPanel({ record, onRetry, onCancel }: { 
    record: ImportHistory; 
    onRetry?: (id: string) => Promise<void>;
    onCancel?: (id: string) => Promise<void>;
}) {
    const [retrying, setRetrying] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const isStuck = record.status === 'processing' && record.updated_at &&
        (Date.now() - new Date(record.updated_at).getTime()) > 5 * 60 * 1000; // 5 min

    const errorSummary: { message: string, count: number }[] = (() => {
        if (!record.error_log) return [];
        const log = record.error_log as any;
        
        // Handle new aggregated format: { errors: { "msg": count }, ... }
        if (log.errors && typeof log.errors === 'object') {
            return Object.entries(log.errors as Record<string, number>)
                .map(([message, count]) => ({ message, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
        }
        
        // Handle old single message format
        if (log.message) return [{ message: log.message, count: record.failed_rows || 1 }];
        if (typeof log === 'string') return [{ message: log, count: record.failed_rows || 1 }];
        
        return [];
    })();

    const traceback: string | null = (() => {
        if (!record.error_log || typeof record.error_log !== 'object') return null;
        return (record.error_log as Record<string, unknown>).traceback as string | null;
    })();

    const pct = record.total_rows > 0 ? Math.round((record.processed_rows / record.total_rows) * 100) : 0;
    const canRetry = record.status === 'failed' || record.status === 'partial' || isStuck;
    const canCancel = record.status === 'processing' || record.status === 'pending';

    const handleRetry = async () => {
        if (!onRetry) return;
        setRetrying(true);
        try { await onRetry(record.id); } finally { setRetrying(false); }
    };

    const handleCancel = async () => {
        if (!onCancel) return;
        if (!confirm('Apakah Anda yakin ingin membatalkan import ini?')) return;
        setCancelling(true);
        try { await onCancel(record.id); } finally { setCancelling(false); }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-6 py-4 space-y-4">
            {/* Row Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center transition-all hover:border-blue-300 dark:hover:border-blue-900 shadow-sm hover:shadow-md">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Baris</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{(record.total_rows || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center transition-all hover:border-emerald-300 dark:hover:border-emerald-900 shadow-sm hover:shadow-md">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Berhasil</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{(record.processed_rows || 0).toLocaleString()}</div>
                </div>
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center transition-all hover:border-rose-300 dark:hover:border-rose-900 shadow-sm hover:shadow-md">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gagal</div>
                    <div className={`text-lg font-bold ${record.failed_rows > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {(record.failed_rows || 0).toLocaleString()}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-center transition-all hover:border-blue-300 dark:hover:border-blue-900 shadow-sm hover:shadow-md">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Progress</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{pct}%</div>
                </div>
            </div>

            {/* Progress bar for active/partial */}
            {(record.status === 'processing' || record.status === 'partial') && record.total_rows > 0 && (
                <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                        <span>Status Pemrosesan</span>
                        <span>{record.processed_rows.toLocaleString()} / {record.total_rows.toLocaleString()} baris</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)] ${record.status === 'partial' ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-600 to-blue-400 animate-pulse'}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Stuck warning */}
            {isStuck && (
                <div className="flex items-start gap-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 shadow-sm">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
                    <div>
                        <div className="font-semibold mb-0.5">Mendeteksi Aktivitas Terhenti</div>
                        <p className="opacity-90">Import ini sepertinya macet (tidak ada aktivitas lebih dari 5 menit). Sistem mungkin mengalami kendala koneksi atau beban kerja tinggi. Gunakan tombol <strong>Retry</strong> di sebelah kanan untuk memulai ulang file ini.</p>
                    </div>
                </div>
            )}

            {/* Top Errors Summary */}
            {errorSummary.length > 0 && (
                <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        <Terminal className="w-4 h-4" />
                        <span>Ringkasan Kesalahan ({errorSummary.length} Pola Terdeteksi)</span>
                    </div>
                    <div className="grid gap-2">
                        {errorSummary.map((err, idx) => (
                            <div key={idx} className="bg-slate-900/95 dark:bg-slate-950 border-l-4 border-rose-500 text-rose-100 rounded-r-lg p-3 shadow-lg group hover:bg-slate-900 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed flex-1 break-all">
                                        <span className="text-rose-400/60 mr-2">[{idx + 1}]</span>
                                        {err.message}
                                    </div>
                                    <div className="shrink-0 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-rose-400">
                                        {err.count.toLocaleString()} rows
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {traceback && (
                        <div className="bg-slate-900/50 dark:bg-slate-950/50 rounded-lg p-3 mt-2 border border-slate-800">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Backtrace Diagnostik</div>
                            <div className="text-[10px] font-mono text-slate-400 max-h-32 overflow-y-auto whitespace-pre leading-normal">
                                {traceback}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Dibuat: {new Date(record.created_at).toLocaleString('id-ID')}</span>
                {record.updated_at && (
                    <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Diperbarui: {new Date(record.updated_at).toLocaleString('id-ID')}</span>
                )}
                <span className="font-mono text-slate-400 dark:text-slate-500">ID: {record.id}</span>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
                {canCancel && onCancel && (
                    <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                    >
                        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" rotate={90} />}
                        {cancelling ? 'Membatalkan...' : 'Cancel Import'}
                    </button>
                )}

                {canRetry && onRetry && (
                    <button
                        onClick={handleRetry}
                        disabled={retrying}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        {retrying ? 'Memulai ulang...' : 'Retry Import'}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
    mutateHistory,
    onRetry,
    onCancel,
    onResetStuck,
}: EngineHistoryTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [resettingStuck, setResettingStuck] = useState(false);

    const toggleRow = (id: string) => setExpandedRow(prev => prev === id ? null : id);

    const handleResetStuck = async () => {
        if (!onResetStuck) return;
        setResettingStuck(true);
        try { await onResetStuck(); } finally { setResettingStuck(false); }
    };

    const hasStuck = filteredHistory.some(r =>
        r.status === 'processing' && r.updated_at &&
        (Date.now() - new Date(r.updated_at).getTime()) > 5 * 60 * 1000
    );

    return (
        <Card className="shadow-sm h-full border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <CardHeader className="pb-0 border-b mb-4 flex flex-row items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
                <div>
                    <CardTitle className="text-lg" style={{ color: 'var(--text-primary)' }}>{t.historyTitle}</CardTitle>
                    <CardDescription className="text-xs mb-4 mt-2" style={{ color: 'var(--text-muted)' }}>
                        {t.historyDesc}
                    </CardDescription>
                </div>
                <div className="mb-4 flex items-center gap-2">
                    {hasStuck && onResetStuck && (
                        <button
                            onClick={handleResetStuck}
                            disabled={resettingStuck}
                            title="Reset semua import yang macet"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors disabled:opacity-60"
                        >
                            {resettingStuck ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />}
                            Reset Macet
                        </button>
                    )}
                    <button 
                        onClick={() => { if (!isDynamicMode && mutateHistory) mutateHistory(); }} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors" 
                        title="Refresh Data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 px-4 sm:px-0 pt-4 sm:pt-0">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-9 p-3 shadow-sm transition-all border"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                        />
                    </div>
                    <div className="w-full sm:w-[200px]">
                        <SearchableSelect
                            options={[
                                { value: "ALL", label: t.statusFilter || "Semua Status" },
                                { value: "completed", label: t.status?.completed || "Completed" },
                                { value: "processing", label: t.status?.processing || "Processing" },
                                { value: "pending", label: t.status?.pending || "Pending" },
                                { value: "failed", label: t.status?.failed || "Failed" },
                                { value: "partial", label: t.status?.partial || "Partial" },
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
                                { value: "engine_sts_load_data", label: t.tables?.engine_sts_load_data || "Engine Load Data" },
                                { value: "engine_sts_proses_rpt", label: t.tables?.engine_sts_proses_rpt || "Engine Process Report" },
                            ]}
                            value={filterTable}
                            onChange={setFilterTable}
                            placeholder={t.tableFilter || "Pilih Tabel..."}
                            searchPlaceholder="Cari tabel..."
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs uppercase" style={{ background: 'var(--card-bg-hover)', color: 'var(--text-secondary)' }}>
                            <tr>
                                {isDynamicMode ? (
                                    dynamicColumns.map((col) => (
                                        <th key={col} className="px-6 py-4 font-semibold tracking-wider">
                                            {col.replace(/_/g, ' ')}
                                        </th>
                                    ))
                                ) : (
                                    <>
                                        <th className="px-4 py-4 w-8"></th>
                                        <th className="px-4 py-4 font-semibold tracking-wider">{t.table?.file || 'File'}</th>
                                        <th className="px-4 py-4 font-semibold tracking-wider">{t.table?.table || 'Tabel'}</th>
                                        <th className="px-4 py-4 font-semibold tracking-wider text-center">{t.table?.status || 'Status'}</th>
                                        <th className="px-4 py-4 font-semibold tracking-wider text-right">{t.table?.processed || 'Diproses'}</th>
                                        <th className="px-4 py-4 font-semibold tracking-wider text-right">{t.table?.date || 'Tanggal'}</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                            {isDynamicMode && isDynamicLoading ? (
                                <tr>
                                    <td colSpan={dynamicColumns.length || 6} className="px-6 py-12 text-center text-slate-500">
                                        <RefreshCw className="w-8 h-8 opacity-20 animate-spin mx-auto mb-2" />
                                        <span className="text-sm">Memuat Data Tabel...</span>
                                    </td>
                                </tr>
                            ) : isDynamicMode && dynamicRows.length === 0 ? (
                                <tr>
                                    <td colSpan={dynamicColumns.length || 6} className="px-6 py-12 text-center text-slate-500">
                                        <Search className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                        <span className="text-sm">Tabel ini kosong atau tidak ada data.</span>
                                    </td>
                                </tr>
                            ) : isDynamicMode ? (
                                dynamicRows.map((row, idx) => (
                                    <tr key={String(row.id ?? idx)} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        {dynamicColumns.map((col) => {
                                            const val = row[col];
                                            const isDate = typeof val === 'string' && val.includes('T') && val.includes('-');
                                            return (
                                                <td key={col} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    {isDate ? new Date(val as string).toLocaleString('id-ID', {
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
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <span className="text-sm">{t.table?.empty || 'Tidak ada data.'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((record: ImportHistory) => {
                                    const isProcessing = record.status === 'processing';
                                    const isPending = record.status === 'pending';
                                    const isExpanded = expandedRow === record.id;
                                    const pct = record.total_rows > 0 ? Math.round((record.processed_rows / record.total_rows) * 100) : 0;
                                    const isStuck = isProcessing && record.updated_at &&
                                        (Date.now() - new Date(record.updated_at).getTime()) > 5 * 60 * 1000;

                                    return (
                                        <React.Fragment key={record.id}>
                                            <tr
                                                onClick={() => toggleRow(record.id)}
                                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'} ${isStuck ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                                            >
                                                {/* Expand toggle */}
                                                <td className="px-4 py-4">
                                                    <div className="text-slate-400">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </div>
                                                </td>
                                                {/* File */}
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[160px]" title={record.file_name}>
                                                            {record.file_name}
                                                        </span>
                                                        {isStuck && (
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">⚠ Mungkin macet</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Table */}
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 max-w-[140px] truncate">
                                                        {record.target_table}
                                                    </span>
                                                </td>
                                                {/* Status */}
                                                <td className="px-4 py-4 text-center">
                                                    <StatusBadge
                                                        status={record.status as BadgeStatus}
                                                        showIcon={isProcessing}
                                                    />
                                                </td>
                                                {/* Progress */}
                                                <td className="px-4 py-4 text-right">
                                                    {isProcessing || isPending ? (
                                                        <div className="flex flex-col items-end gap-1.5 w-32 ml-auto">
                                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                {isPending ? (t.table?.queuing || 'Mengantri...') : `${pct}% (${record.processed_rows.toLocaleString()}/${record.total_rows.toLocaleString()})`}
                                                            </span>
                                                            {isProcessing && record.total_rows > 0 && (
                                                                <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800 overflow-hidden">
                                                                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 animate-pulse" style={{ width: `${pct}%` }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className={`font-medium ${record.failed_rows > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                                                {record.processed_rows.toLocaleString()}{' '}
                                                                <span className="text-slate-400 font-normal">/ {(record.total_rows || record.processed_rows).toLocaleString()}</span>
                                                            </span>
                                                            {record.failed_rows > 0 && (
                                                                <span className="text-[11px] font-semibold text-rose-500 mt-0.5 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-1.5 rounded">
                                                                    {record.failed_rows.toLocaleString()} error
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                {/* Date */}
                                                <td className="px-4 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                                    {new Date(record.created_at).toLocaleString('id-ID', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                            </tr>
                                            {/* Expandable detail row */}
                                            {isExpanded && (
                                                <tr className="bg-slate-50 dark:bg-slate-900/30">
                                                    <td colSpan={6} className="p-0">
                                                        <ImportDetailPanel 
                                                            record={record} 
                                                            onRetry={onRetry} 
                                                            onCancel={onCancel}
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
