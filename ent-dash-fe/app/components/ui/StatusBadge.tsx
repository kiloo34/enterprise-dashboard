import React from 'react';
import clsx from 'clsx';

export type BadgeStatus = 'success' | 'processing' | 'pending' | 'failed' | 'partial' | 'default';

interface StatusBadgeProps {
    status: BadgeStatus;
    label?: string;
    className?: string;
    showIcon?: boolean;
}

export function StatusBadge({ status, label, className, showIcon = false }: StatusBadgeProps) {
    const config = {
        success: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
        processing: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
        pending: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        failed: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
        partial: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
        default: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };

    return (
        <span className={clsx(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
            config[status] || config.default,
            className
        )}>
            {showIcon && status === 'processing' && (
                <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {(label || status).toUpperCase()}
        </span>
    );
}
