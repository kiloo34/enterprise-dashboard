import React from 'react';
import { AlertOctagon, RotateCcw, WifiOff, Lock, FileSearch } from 'lucide-react';
import clsx from 'clsx';

type ErrorVariant = 'error' | 'notFound' | 'unauthorized' | 'network';

interface PageErrorProps {
    /** The HTTP status code or other code to display */
    code?: number | string;
    /** Title override */
    title?: string;
    /** Description override */
    message?: string;
    /** Retry callback */
    onRetry?: () => void;
    /** Visual variant - auto-detected from `code` if not provided */
    variant?: ErrorVariant;
    /** Additional className for outer container */
    className?: string;
}

function detectVariant(code?: number | string): ErrorVariant {
    if (!code) return 'error';
    const c = Number(code);
    if (c === 404) return 'notFound';
    if (c === 401 || c === 403) return 'unauthorized';
    if (c === 0 || c === 503 || c === 504) return 'network';
    return 'error';
}

const variantConfig: Record<ErrorVariant, {
    icon: React.ReactNode;
    iconBg: string;
    badge: string;
    defaultTitle: string;
    defaultMessage: string;
}> = {
    notFound: {
        icon: <FileSearch className="w-9 h-9 text-amber-500" />,
        iconBg: 'bg-amber-50 dark:bg-amber-900/20 ring-amber-50 dark:ring-amber-900/10',
        badge: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700',
        defaultTitle: 'Data Tidak Ditemukan',
        defaultMessage: 'Data yang diminta tidak tersedia di server.',
    },
    unauthorized: {
        icon: <Lock className="w-9 h-9 text-purple-500" />,
        iconBg: 'bg-purple-50 dark:bg-purple-900/20 ring-purple-50 dark:ring-purple-900/10',
        badge: 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700',
        defaultTitle: 'Akses Ditolak',
        defaultMessage: 'Anda tidak memiliki izin untuk melihat data ini.',
    },
    network: {
        icon: <WifiOff className="w-9 h-9 text-gray-500" />,
        iconBg: 'bg-gray-50 dark:bg-gray-800/50 ring-gray-50 dark:ring-gray-800/20',
        badge: 'text-gray-700 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        defaultTitle: 'Koneksi Bermasalah',
        defaultMessage: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.',
    },
    error: {
        icon: <AlertOctagon className="w-9 h-9 text-red-500" />,
        iconBg: 'bg-red-50 dark:bg-red-900/20 ring-red-50 dark:ring-red-900/10',
        badge: 'text-red-700 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
        defaultTitle: 'Terjadi Kesalahan',
        defaultMessage: 'Sistem mengalami masalah saat memuat data. Silakan coba lagi.',
    },
};

/**
 * Inline error state for rendering inside a page canvas section.
 * The sidebar, navbar, and header remain unaffected.
 *
 * @example
 * const { data, error, mutate } = useSWR('/api/foo', fetcher);
 * if (error) return <PageError code={error.status} onRetry={mutate} />;
 */
export function PageError({
    code,
    title,
    message,
    onRetry,
    variant: variantProp,
    className,
}: PageErrorProps) {
    const variant = variantProp ?? detectVariant(code);
    const config = variantConfig[variant];

    const dotColors: Record<ErrorVariant, string> = {
        error: 'bg-red-500',
        notFound: 'bg-amber-500',
        unauthorized: 'bg-purple-500',
        network: 'bg-gray-500',
    };

    return (
        <div className={clsx('flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-400', className)}>

            {/* HTTP Code Badge */}
            {code && (
                <div className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold mb-6 tracking-widest',
                    config.badge
                )}>
                    <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />
                    HTTP {code}
                </div>
            )}

            {/* Icon */}
            <div className={clsx('w-16 h-16 rounded-full flex items-center justify-center mb-5 ring-8', config.iconBg)}>
                {config.icon}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                {title || config.defaultTitle}
            </h2>

            {/* Message */}
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-6">
                {message || config.defaultMessage}
            </p>

            {/* Retry */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 transition-all shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Muat Ulang
                </button>
            )}
        </div>
    );
}
