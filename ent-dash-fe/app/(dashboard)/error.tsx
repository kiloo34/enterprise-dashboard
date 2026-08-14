'use client';

import { useEffect } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string; code?: string; status?: number };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Dashboard Error]', error);
    }, [error]);

    const statusCode = error.status || error.code || null;
    const isNotFound = statusCode === 404 || statusCode === '404';
    const isUnauthorized = statusCode === 401 || statusCode === 403 || statusCode === '401' || statusCode === '403';

    const title = isNotFound
        ? 'Halaman Tidak Ditemukan'
        : isUnauthorized
            ? 'Akses Ditolak'
            : statusCode
                ? `Error ${statusCode}`
                : 'Terjadi Kesalahan';

    const subtitle = isNotFound
        ? 'Halaman yang Anda cari tidak tersedia atau telah dipindahkan.'
        : isUnauthorized
            ? 'Anda tidak memiliki izin untuk mengakses halaman ini.'
            : error.message || 'Sistem mengalami kesalahan tidak terduga saat memproses permintaan.';

    const iconColor = isNotFound
        ? 'text-amber-500'
        : isUnauthorized
            ? 'text-purple-500'
            : 'text-red-500';

    const ringColor = isNotFound
        ? 'bg-amber-50 dark:bg-amber-900/20 ring-amber-50 dark:ring-amber-900/10'
        : isUnauthorized
            ? 'bg-purple-50 dark:bg-purple-900/20 ring-purple-50 dark:ring-purple-900/10'
            : 'bg-red-50 dark:bg-red-900/20 ring-red-50 dark:ring-red-900/10';

    return (
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="max-w-lg w-full text-center">

                {/* Error Code Badge */}
                {statusCode && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono font-bold text-gray-600 dark:text-gray-300 mb-8 tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        HTTP {statusCode}
                    </div>
                )}

                {/* Icon */}
                <div className={`w-20 h-20 ${ringColor} rounded-full flex items-center justify-center mb-6 ring-8 mx-auto`}>
                    <AlertOctagon className={`w-10 h-10 ${iconColor}`} />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
                    {title}
                </h1>

                {/* Subtitle */}
                <p className="text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                    {subtitle}
                </p>

                {/* Digest / Debug */}
                {error.digest && (
                    <p className="text-xs font-mono text-gray-400 dark:text-gray-600 mt-2 mb-8">
                        ID: {error.digest}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 transition-all shadow-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Coba Lagi
                    </button>
                    <Link
                        href="/direksi/kinerja-keuangan"
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 active:scale-95 transition-all shadow-sm"
                    >
                        <Home className="w-4 h-4" />
                        Ke Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
