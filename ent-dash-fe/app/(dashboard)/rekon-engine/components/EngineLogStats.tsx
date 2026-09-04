'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Database, AlertCircle, AlertTriangle, PlayCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: { value: string; positive: boolean; label: string };
    subtext?: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    alert?: string;
    alertType?: 'error' | 'warning' | 'info';
}

function StatCard({ title, value, trend, subtext, icon: Icon, iconColor, iconBg, alert, alertType }: StatCardProps) {
    const alertColors = {
        error: "text-red-600 dark:text-red-400",
        warning: "text-amber-600 dark:text-amber-400",
        info: "text-blue-600 dark:text-blue-400",
    };
    return (
        <div className="relative overflow-hidden rounded-2xl border p-6 flex flex-col gap-4 shadow-sm dark:shadow-xl transition-all hover:scale-[1.02] hover:border-blue-500/30 group" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</p>
                    <p className="text-2xl font-black mt-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
                </div>
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 duration-300", iconBg)}>
                    <Icon className={clsx("w-5 h-5", iconColor)} />
                </div>
            </div>
            
            <div className="mt-auto">
                {trend && (
                    <div className="flex items-center gap-1.5">
                        <div className={clsx("flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold", trend.positive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
                            {trend.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {trend.value}
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
                    </div>
                )}
                {alert && (
                    <p className={clsx("text-[10px] font-bold mt-1 flex items-center gap-1", alertColors[alertType || "info"])}>
                        <AlertCircle className="w-3 h-3" />
                        {alert}
                    </p>
                )}
                {subtext && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{subtext}</p>}
            </div>
        </div>
    );
}

interface EngineLogStatsProps {
    totalLogs: number;
    errorTrend: number;
    warningCount: number;
    mostActiveEngine: string;
    mostActivePercent: number;
    isLoading?: boolean;
}

export function EngineLogStats({
    totalLogs, errorTrend, warningCount,
    mostActiveEngine, mostActivePercent, isLoading,
}: EngineLogStatsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border p-5 h-28 animate-pulse" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3" />
                        <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Total Eksekusi Job */}
            <StatCard
                title="Total Eksekusi Job"
                value={totalLogs.toLocaleString('id-ID')}
                icon={Database}
                iconColor="text-blue-600 dark:text-blue-400"
                iconBg="bg-blue-50 dark:bg-blue-900/30"
                trend={{ value: '+5.2%', positive: true, label: 'dari bulan lalu' }}
            />
            {/* Error Load */}
            <StatCard
                title="Error Load"
                value={`+${errorTrend}%`}
                icon={AlertCircle}
                iconColor="text-red-600 dark:text-red-400"
                iconBg="bg-red-50 dark:bg-red-900/30"
                alert={`Lonjakan error di ${mostActiveEngine}`}
                alertType="error"
            />
            {/* Peringatan Bulan Ini */}
            <StatCard
                title="Peringatan Data"
                value={warningCount.toLocaleString('id-ID')}
                icon={AlertTriangle}
                iconColor="text-amber-600 dark:text-amber-400"
                iconBg="bg-amber-50 dark:bg-amber-900/30"
                trend={{ value: '-2.1%', positive: true, label: 'perbaikan' }}
            />
            {/* Job Paling Aktif */}
            <StatCard
                title="Job Paling Aktif"
                value={mostActiveEngine}
                icon={PlayCircle}
                iconColor="text-violet-600 dark:text-violet-400"
                iconBg="bg-violet-50 dark:bg-violet-900/30"
                subtext={`${mostActivePercent}% dari total traffic`}
            />
        </div>
    );
}
