import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: React.ReactNode;
    isSubmitting?: boolean;
    itemName?: string;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isSubmitting = false,
    itemName
}: DeleteConfirmationModalProps) {
    const t = useTranslation("Common");
    const displayTitle = title || t.confirm;
    const displayItemName = itemName || t.noData.toLowerCase();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {displayTitle}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {message || (
                                <>
                                    {t.confirm} <strong>{displayItemName}</strong>? {t.noData}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex gap-3 pb-6 sm:pb-4 flex-col-reverse sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t.loading}
                            </>
                        ) : (
                            t.delete
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
