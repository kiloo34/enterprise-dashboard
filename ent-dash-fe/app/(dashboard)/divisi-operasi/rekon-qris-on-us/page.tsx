"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { QrisDataTable } from "@/components/dashboard/QrisDataTable";
import { ReconciliationTemplate } from "@/features/reconciliation/components/ReconciliationTemplate";
import { MetricData } from "@/components/dashboard/MetricsGrid";
import { getTodayIsoString } from "@/utils/date";
import { useTranslation } from "@/hooks/useTranslation";
import { api } from "@/utils/api";
import { QrisDiscrepancyChart } from "@/components/dashboard/QrisDiscrepancyChart";

export default function RekonQrisOnUsDashboard() {
    const t = useTranslation("Reconciliation");
    const [globalDate, setGlobalDate] = useState(getTodayIsoString());

    // Fetch dynamic metrics
    const { data: metrics, isLoading } = useSWR("/api/recon/dashboard/onus-stats", (url: string) => api<{ totalTransactions: number; settledAmount: number; unsettledAmount: number; totalDiscrepancyAmount: number }>(url));

    const metricItems: MetricData[] = useMemo(() => {
        if (!metrics) return [];
        return [
            {
                title: t.totalTransactions,
                value: metrics.totalTransactions,
                trend: 0,
                accentColor: "blue",
                useBigNumberFormat: true
            },
            {
                title: t.settledAmount,
                value: metrics.settledAmount,
                trend: 0,
                accentColor: "green",
                useBigNumberFormat: true
            },
            {
                title: t.unsettledAmount,
                value: metrics.unsettledAmount,
                trend: 0,
                accentColor: "orange",
                useBigNumberFormat: true
            },
            {
                title: t.totalDiscrepancy,
                value: metrics.totalDiscrepancyAmount,
                trend: 0,
                accentColor: "red",
                useBigNumberFormat: true
            }
        ];
    }, [metrics, t]);

    if (isLoading || !metrics) {
        return <div className="p-8"><div className="animate-pulse bg-gray-200 h-64 rounded-xl" /></div>;
    }

    return (
        <ReconciliationTemplate
            title={t.qrisOnus.title}
            description={t.qrisOnus.description}
            metrics={metricItems}
            chartSection={
                <QrisDiscrepancyChart 
                    settled={metrics.settledAmount}
                    unsettled={metrics.unsettledAmount}
                    discrepancy={metrics.totalDiscrepancyAmount}
                />
            }
            tableSection={
                <QrisDataTable
                    network="onus"
                    dateFilter={globalDate}
                    onDateFilterChange={setGlobalDate}
                />
            }
        />
    );
}
