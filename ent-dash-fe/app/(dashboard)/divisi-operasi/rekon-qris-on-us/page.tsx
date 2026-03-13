"use client";

import { useState } from "react";
import { QrisDataTable } from "@/app/components/dashboard/QrisDataTable";
import qrisData from "@/app/constants/qrisSample.json";
import { ReconciliationTemplate } from "@/app/features/reconciliation/components/ReconciliationTemplate";
import { MetricData } from "@/app/components/dashboard/MetricsGrid";
import { getTodayIsoString } from "@/app/utils/date";
import { useTranslation } from "@/app/hooks/useTranslation";

export default function RekonQrisOnUsDashboard() {
    const t = useTranslation("Reconciliation");
    const { metrics } = qrisData;
    const [globalDate, setGlobalDate] = useState(getTodayIsoString());

    const metricItems: MetricData[] = [
        {
            title: t.totalTransactions,
            value: metrics.totalTransactions,
            trend: 2.4,
            accentColor: "blue",
            useBigNumberFormat: true
        },
        {
            title: t.settledAmount,
            value: metrics.settledAmount,
            trend: 1.8,
            accentColor: "green",
            useBigNumberFormat: true
        },
        {
            title: t.unsettledAmount,
            value: metrics.unsettledAmount,
            trend: -0.4,
            accentColor: "orange",
            useBigNumberFormat: true
        },
        {
            title: t.totalDiscrepancy,
            value: metrics.totalDiscrepancyAmount,
            trend: 0.1,
            accentColor: "red",
            useBigNumberFormat: true
        }
    ];

    return (
        <ReconciliationTemplate
            title={t.qrisOnus.title}
            description={t.qrisOnus.description}
            metrics={metricItems}
            tableSection={
                <QrisDataTable
                    dateFilter={globalDate}
                    onDateFilterChange={setGlobalDate}
                />
            }
        />
    );
}
