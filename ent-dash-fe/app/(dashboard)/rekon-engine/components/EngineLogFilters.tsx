'use client';

import React from 'react';
import { RefreshCw, Download, Search } from 'lucide-react';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';

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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            {/* Search bar */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" aria-hidden />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Cari log berdasarkan pesan, run ID, atau modul..."
                        aria-label="Cari log engine data rekonsiliasi"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Filters + actions */}
            <div className="px-5 py-3.5 flex flex-wrap items-center gap-3">
                {/* Dropdowns */}
                <div className="flex flex-wrap gap-3 flex-1">
                    <div className="min-w-[140px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Nama Engine</p>
                        <SearchableSelect
                            options={ENGINE_OPTIONS}
                            value={engineName}
                            onChange={onEngineChange}
                            placeholder="Semua Engine"
                            searchPlaceholder="Cari engine..."
                            aria-label="Filter berdasarkan Nama Engine"
                        />
                    </div>
                    <div className="min-w-[160px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Log Level</p>
                        <SearchableSelect
                            options={LOG_LEVEL_OPTIONS}
                            value={logLevel}
                            onChange={onLevelChange}
                            placeholder="Semua Level"
                            searchPlaceholder="Cari level..."
                            aria-label="Filter berdasarkan log level"
                        />
                    </div>
                    <div className="min-w-[170px]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Modul (Step)</p>
                        <SearchableSelect
                            options={MODULE_OPTIONS}
                            value={module}
                            onChange={onModuleChange}
                            placeholder="Semua Modul"
                            searchPlaceholder="Cari modul..."
                            aria-label="Filter berdasarkan modul"
                        />
                    </div>
                </div>

                {/* Live Tail toggle */}
                <div className="flex items-center gap-2 self-end pb-0.5">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">Live Tail</span>
                    <button
                        role="switch"
                        aria-checked={liveTail}
                        onClick={() => onLiveTailChange(!liveTail)}
                        className={`relative w-10 h-5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${liveTail ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${liveTail ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 self-end pb-0.5 ml-auto">
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        aria-label="Export log ke CSV"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-70"
                        aria-label="Muat ulang log"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
