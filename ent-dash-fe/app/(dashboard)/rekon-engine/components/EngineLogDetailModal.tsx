'use client';

import React from 'react';
import { X, Clock, Database, AlertCircle, Layers, Hash, Server, Activity } from 'lucide-react';
import { EngineLog, LogLevel } from '@/types/recon';
import { clsx } from 'clsx';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const LEVEL_COLORS: Record<LogLevel, string> = {
    ERROR: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    WARN: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    INFO: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    DEBUG: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
};

interface DetailRowProps {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex flex-col gap-0.5 w-full">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
            </div>
        </div>
    );
}

interface EngineLogDetailModalProps {
    log: EngineLog | null;
    onClose: () => void;
}

// ─── Log Console Component ──────────────────────────────────────────────────
interface LogConsoleProps {
    message: string;
    level: LogLevel;
}

function LogConsole({ message, level }: LogConsoleProps) {
    const lines = message.split('\n').filter(line => line.trim() !== '');
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(message);
    };

    return (
        <div className="relative group">
            <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800 shadow-inner">
                {/* Console Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors font-bold"
                    >
                        Copy Log
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="p-4 max-h-[350px] overflow-y-auto overflow-x-auto custom-scrollbar">
                    <div className="font-mono text-[12px] leading-relaxed whitespace-pre">
                        {lines.map((line, idx) => (
                            <div key={idx} className="flex gap-4 hover:bg-white/5 px-1 rounded transition-colors group/line">
                                <span className="text-gray-600 select-none text-right min-w-[20px]">{idx + 1}</span>
                                <span className={clsx(
                                    "break-all",
                                    level === 'ERROR' ? 'text-red-400' : 
                                    level === 'WARN' ? 'text-amber-400' : 
                                    'text-gray-300'
                                )}>
                                    {line}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EngineLogDetailModal({ log, onClose }: EngineLogDetailModalProps) {
    const modalRef = useFocusTrap(!!log, onClose);

    if (!log) return null;

    const dt = new Date(log.timestamp);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="log-detail-title"
                className="w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 id="log-detail-title" className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                                Log Detail Engine
                            </h2>
                            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                                {log.engineName} • {log.id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
                        aria-label="Tutup detail"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar pb-6 px-6 pt-6">
                    {/* Status Header */}
                    <div className={clsx('mb-6 px-5 py-3.5 rounded-2xl border flex items-center gap-3', LEVEL_COLORS[log.level])}>
                        <div className="flex-1 font-bold tracking-wide">
                            {log.level} STATUS
                        </div>
                        <div className="text-xs font-medium opacity-80 italic">
                            {log.module}
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 mb-8">
                        <DetailRow
                            icon={Clock}
                            label="Waktu Eksekusi"
                            value={
                                <span className="font-mono text-xs">
                                    {dt.toLocaleDateString('id-ID')} {dt.toLocaleTimeString('id-ID')}
                                </span>
                            }
                        />
                        <DetailRow
                            icon={Hash}
                            label="Run ID"
                            value={
                                <div className="flex flex-col">
                                    <span className="font-mono font-bold uppercase text-sm" style={{ color: 'var(--text-primary)' }}>{log.runId}</span>
                                </div>
                            }
                        />
                        <DetailRow
                            icon={Database}
                            label="Tabel Historis"
                            value={<span className="font-mono text-[11px] truncate block max-w-[200px]">{log.historyTable}</span>}
                        />
                         <DetailRow
                            icon={Layers}
                            label="Modul Langkah"
                            value={<span className="text-sm truncate block max-w-[200px]">{log.module}</span>}
                        />
                    </div>

                    {/* Console View */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Server className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pesan Sistem / Event Log</span>
                        </div>
                        <LogConsole message={log.message} level={log.level} />
                    </div>
                </div>
            </div>
        </div>
    );
}
