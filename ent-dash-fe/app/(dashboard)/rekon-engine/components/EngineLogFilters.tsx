'use client';

import React from 'react';
import { RefreshCw, Download, Search } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { clsx } from 'clsx';

// ─── Filter options ──────────────────────────────────────────────────────────
const ENGINE_OPTIONS = [
    { value: 'ALL', label: 'Semua Engine' },
    { value: 'qris', label: 'QRIS' },
    { value: 'bifast', label: 'BI-FAST' },
    { value: 'atm', label: 'ATM' },
    { value: 'switching', label: 'Switching' },
    { value: 'settlement', label: 'Settlement' },
    { value: 'rtgs', label: 'RTGS' },
];

const LOG_LEVEL_OPTIONS = [
    { value: 'ALL', label: 'Semua Level' },
    { value: 'ERROR', label: 'ERROR — Gagal' },
    { value: 'WARN', label: 'WARN — Peringatan' },
    { value: 'INFO', label: 'INFO — Selesai' },
    { value: 'DEBUG', label: 'DEBUG — Detail' },
];

const MODULE_OPTIONS = [
    { value: 'ALL', label: 'Semua Modul' },
    { value: 'Initialization', label: 'Initialization' },
    { value: 'Data Extraction', label: 'Data Extraction' },
    { value: 'Matching Logic', label: 'Matching Logic' },
    { value: 'Reconciliation Process', label: 'Reconciliation Process' },
    { value: 'Status Update', label: 'Status Update' },
    { value: 'Summary Calculation', label: 'Summary Calculation' },
    { value: 'Cleanup', label: 'Cleanup' },
];

interface EngineLogFiltersProps {
    searchQuery: string;
    onSearchChange: (v: string) => void;
    engineName: string;
    onEngineChange: (v: string) => void;
    logLevel: string;
    onLevelChange: (v: string) => void;
    module: string;
    onModuleChange: (v: string) => void;
    liveTail: boolean;
    onLiveTailChange: (v: boolean) => void;
    onExport: () => void;
    onRefresh: () => void;
    isRefreshing?: boolean;
}

export function EngineLogFilters({
    searchQuery, onSearchChange,
    engineName, onEngineChange,
    logLevel, onLevelChange,
    module, onModuleChange,
    liveTail, onLiveTailChange,
    onExport, onRefresh, isRefreshing,
}: EngineLogFiltersProps) {
    return (
        <div className="rounded-2xl border shadow-sm dark:shadow-xl overflow-hidden transition-all backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--card-bg) 70%, transparent)', borderColor: 'var(--card-border)' }}>
            {/* Search bar */}
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--card-border)' }}>
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" style={{ color: 'var(--text-muted)' }} aria-hidden />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Cari log berdasarkan pesan, run ID, atau modul..."
                        className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-semibold"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
                    />
                </div>
            </div>

            {/* Filters + actions */}
            <div className="px-6 py-4 flex flex-wrap items-center gap-6">
                {/* Dropdowns */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Nama Engine</label>
                        <SearchableSelect
                            options={ENGINE_OPTIONS}
                            value={engineName}
                            onChange={onEngineChange}
                            placeholder="Semua Engine"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-muted)' }}>Log Level</label>
                        <SearchableSelect
                            options={LOG_LEVEL_OPTIONS}
                            value={logLevel}
                            onChange={onLevelChange}
                            placeholder="Semua Level"
                        />
                    </div>
                </div>

                {/* Live Tail toggle */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl border shadow-inner dark:shadow-none" style={{ background: 'var(--card-bg-hover)', borderColor: 'var(--card-border)' }}>
                    <span className="text-xs font-bold uppercase tracking-tight" style={{ color: 'var(--text-muted)' }}>Live Tail</span>
                    <button
                        role="switch"
                        aria-checked={liveTail}
                        onClick={() => onLiveTailChange(!liveTail)}
                        className={clsx(
                            "relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40",
                            liveTail ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-gray-200 dark:bg-white/10"
                        )}
                    >
                        <span className={clsx(
                            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
                            liveTail ? "translate-x-5" : "translate-x-0"
                        )} />
                    </button>
                    {liveTail && (
                        <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-black border rounded-xl transition-all shadow-sm dark:shadow-none hover:bg-[var(--btn-secondary-hover-bg)]"
                        style={{ background: 'var(--btn-secondary-bg)', color: 'var(--btn-secondary-text)', borderColor: 'var(--btn-secondary-border)' }}
                    >
                        <Download className="w-4 h-4" />
                        EXPORT
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                        <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
                        REFRESH
                    </button>
                </div>
            </div>
        </div>
    );
}
