"use client";

import React, { ReactNode } from "react";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { MetricsGrid, MetricData } from "@/components/dashboard/MetricsGrid";
import { QrisDiscrepancyChart } from "@/components/dashboard/QrisDiscrepancyChart";
import { PageHeader } from "@/components/ui/PageHeader";

interface ReconciliationTemplateProps {
    title: string;
    description: string;
    metrics: MetricData[];
    chartSection?: ReactNode;
    tableSection: ReactNode;
    filterType?: "qris" | "kinerja";
    footerText?: string;
    footerScaleText?: string;
}

export const ReconciliationTemplate: React.FC<ReconciliationTemplateProps> = ({
    title,
    description,
    metrics,
    chartSection,
    tableSection,
    filterType = "qris",
    footerText = "Menampilkan data histori rekonsiliasi harian operasional.",
    footerScaleText = "Skala: Dalam Rupiah (IDR)",
}) => {

    return (
        <div className="flex flex-col min-h-screen bg-transparent">
            <div className="flex-1 p-6 lg:p-8 space-y-8 overflow-x-hidden">
                <PageHeader
                    title={title}
                    description={description}
                />

                <FilterBar type={filterType} />

                {/* Metrics Grid */}
                <MetricsGrid metrics={metrics} />

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="lg:col-span-1">
                        {chartSection || null}
                    </div>
                </div>

                {/* Data Table Section */}
                <div className="mt-8">
                    {tableSection}
                </div>

                {/* Footer Area */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 font-medium py-4 gap-4">
                    <p className="text-center sm:text-left">
                        {footerText}
                    </p>
                    <p>{footerScaleText}</p>
                </div>
            </div>
        </div>
    );
}
;
