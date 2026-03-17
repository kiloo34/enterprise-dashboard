"use client";

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => {
            if (!open && !isSubmitting) onClose();
        }}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {displayTitle}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            {message || (
                                <>
                                    {t.confirm} <strong>{displayItemName}</strong>? {t.noData}
                                </>
                            )}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 mt-6 flex gap-3 sm:justify-end border-t border-gray-100 dark:border-gray-800">
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
