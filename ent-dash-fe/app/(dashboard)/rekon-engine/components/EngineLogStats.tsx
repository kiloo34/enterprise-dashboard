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
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-amber-600 dark:text-amber-400',
        info: 'text-blue-600 dark:text-blue-400',
    };
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</p>
                <div className={clsx('w-10 h-10 rounded-2xl flex items-center justify-center transition-colors group-hover:scale-110 duration-300', iconBg)}>
                    <Icon className={clsx('w-5 h-5', iconColor)} />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{value}</p>
            {trend && (
                <div className="flex items-center gap-1">
                    {trend.positive
                        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                    <span className={clsx('text-xs font-medium', trend.positive ? 'text-emerald-500' : 'text-red-500')}>
                        {trend.value}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{trend.label}</span>
                </div>
            )}
            {alert && (
                <p className={clsx('text-xs font-medium mt-1', alertColors[alertType || 'info'])}>{alert}</p>
            )}
            {subtext && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>
            )}
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
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-28 animate-pulse">
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
