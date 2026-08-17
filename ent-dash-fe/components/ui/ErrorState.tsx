import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    actionLabel?: string;
}

export function ErrorState({
    title = "Terjadi Kesalahan",
    message = "Maaf, sistem mengalami kesalahan tidak terduga saat memproses permintaan Anda.",
    onRetry,
    actionLabel = "Coba Lagi"
}: ErrorStateProps) {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
                <AlertOctagon className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
                {title}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
                {message}
            </p>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-all bg-gray-900 dark:bg-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 active:scale-95 shadow-sm"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
