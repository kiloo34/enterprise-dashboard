'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { DataTable, DataTableColumn } from '../../../components/ui/DataTable';

// ─── Types ────────────────────────────────────────────────────────────────────
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export interface EngineLog {
    id: string;              // Primary Key tabel log
    timestamp: string;       // Timestamp log direkam
    engineName: string;      // Wildcard pada nama tabel (misal: 'qris' untuk engine_qris_log)
    runId: string;           // Referensi ke ID eksekusi di tabel engine_*_his
    level: LogLevel;         // Level severity
    message: string;         // Pesan log/event
    module: string;          // Modul atau langkah dalam eksekusi
    tableName: string;       // Menyimpan sumber tabel fisik log (engine_*_log)
    historyTable: string;    // Menyimpan sumber tabel fisik histori (engine_*_his)
}

// ─── Level Badge ──────────────────────────────────────────────────────────────
const LEVEL_STYLES: Record<LogLevel, string> = {
    ERROR: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    WARN: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    INFO: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    DEBUG: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

function LevelBadge({ level }: { level: LogLevel }) {
    return (
        <span className={clsx(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tighter min-w-[50px] uppercase',
            LEVEL_STYLES[level]
        )}>
            {level}
        </span>
    );
}

// ─── Timestamp Cell ───────────────────────────────────────────────────────────
function TimestampCell({ timestamp }: { timestamp: string }) {
    const dt = new Date(timestamp);
    const date = dt.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '-');
    const time = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return (
        <div className="font-mono text-[11px] leading-tight flex flex-col gap-0.5">
            <div className="text-gray-900 dark:text-gray-200 font-bold">{date}</div>
            <div className="text-gray-400 dark:text-gray-500">{time}</div>
        </div>
    );
}

// ─── Engine Info Cell ─────────────────────────────────────────────────────────
function EngineInfoCell({ log }: { log: EngineLog }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md w-fit border border-indigo-100/50 dark:border-indigo-800/50 uppercase tracking-tighter">
                {log.engineName}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono" title={`Histori di: ${log.historyTable}`}>RUN #{log.runId}</span>
        </div>
    );
}

// ─── Module Cell ─────────────────────────────────────────────────────────────
function ModuleCell({ module, tableName }: { module: string; tableName: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{module}</span>
            <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">{tableName}</span>
        </div>
    );
}

// ─── Message Cell ─────────────────────────────────────────────────────────────
function MessageCell({ message }: { message: string }) {
    return (
        <div 
            className="text-[12px] text-gray-600 dark:text-gray-400 max-w-md font-mono line-clamp-2 leading-relaxed"
            title={message}
        >
            {message}
        </div>
    );
}

// ─── Action Cell ─────────────────────────────────────────────────────────────
interface ActionCellProps {
    log: EngineLog;
    onViewDetail: (log: EngineLog) => void;
}

function ActionCell({ log, onViewDetail }: ActionCellProps) {
    return (
        <button
            onClick={() => onViewDetail(log)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all active:scale-95 group"
            aria-label={`Lihat detail log ${log.id}`}
        >
            Detail
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface EngineLogTableProps {
    logs: EngineLog[];
    isLoading: boolean;
    onViewDetail: (log: EngineLog) => void;
}

export function EngineLogTable({ logs, isLoading, onViewDetail }: EngineLogTableProps) {
    const columns: DataTableColumn<EngineLog>[] = [
        {
            key: 'timestamp',
            header: 'Timestamp',
            render: (log) => <TimestampCell timestamp={log.timestamp} />,
        },
        {
            key: 'engineInfo',
            header: 'Engine & Run ID',
            render: (log) => <EngineInfoCell log={log} />,
        },
        {
            key: 'level',
            header: 'Status',
            align: 'center' as const,
            render: (log) => <LevelBadge level={log.level} />,
        },
        {
            key: 'module',
            header: 'Modul / Sumber Tabel',
            render: (log) => <ModuleCell module={log.module} tableName={log.tableName} />,
        },
        {
            key: 'message',
            header: 'Pesan / Event',
            render: (log) => <MessageCell message={log.message} />,
        },
        {
            key: 'actions',
            header: 'Aksi',
            align: 'right' as const,
            render: (log) => <ActionCell log={log} onViewDetail={onViewDetail} />,
        },
    ];

    return (
        <DataTable<EngineLog>
            columns={columns}
            data={logs}
            rowKey={(log) => log.id}
            isLoading={isLoading}
            emptyText="Tidak ada log ditemukan. Sesuaikan filter atau rentang waktu."
            skeletonRows={8}
            defaultPageSize={10}
        />
    );
}
