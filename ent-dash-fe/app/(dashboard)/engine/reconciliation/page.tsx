"use client";

import React from "react";
import { useTranslation } from "@/app/hooks/useTranslation";

export default function EngineMonitoringReconciliationPage() {
    const t = useTranslation("Sidebar");

    return (
        <div className="p-4 lg:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t.reconciliation}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    List Engine Monitoring
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2h-2a2 2 0 00-2 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">List Engine Placeholder</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        Halaman ini akan menampilkan daftar engine untuk monitoring rekonsiliasi. Detail konten akan diimplementasikan segera.
                    </p>
                </div>
            </div>
        </div>
    );
}
