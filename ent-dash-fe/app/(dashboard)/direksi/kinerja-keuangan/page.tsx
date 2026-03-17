"use client";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { DataTable } from "@/components/dashboard/DataTable/DataTable";
import { DPKBreakdownCharts } from "@/components/dashboard/DPKBreakdownCharts";
import { useTranslation } from "@/hooks/useTranslation";
import { MetricsGrid, MetricData } from "@/components/dashboard/MetricsGrid";
import { useFinancialDashboard, FinancialMetric } from "@/services/FinancialService";
import { useMemo } from "react";

export default function Dashboard() {
  const tm = useTranslation("Metrics");
  const td = useTranslation("Dashboard");

  // Fetch all metrics
  const { metrics, isLoading } = useFinancialDashboard();

  const metricItems: MetricData[] = useMemo(() => {
    // Helper to find metric by slug
    const getMetric = (slug: string): FinancialMetric | undefined =>
      metrics.find(m => m.indicator.slug === slug);

    const asset = getMetric("total_aset");
    const dpk = getMetric("total_dpk");
    const kredit = getMetric("kredit");
    const npl = getMetric("npl");
    const bopo = getMetric("bopo");
    const ldr = getMetric("ldr");
    const nim = getMetric("nim");
    const roa = getMetric("roa");

    return [
      {
        title: tm.totalAsset,
        value: asset?.value ? `${(asset.value / 1000).toLocaleString('id-ID')}T` : "0T",
        trend: asset?.dtd_pct || 0,
        accentColor: "green"
      },
      {
        title: tm.dpk,
        value: dpk?.value ? `${(dpk.value / 1000).toLocaleString('id-ID')}T` : "0T",
        trend: dpk?.dtd_pct || 0,
        accentColor: "blue"
      },
      {
        title: tm.loan,
        value: kredit?.value ? `${(kredit.value / 1000).toLocaleString('id-ID')}T` : "0T",
        trend: kredit?.dtd_pct || 0,
        accentColor: "orange"
      },
      {
        title: "BOPO (%)",
        value: bopo?.value ? `${bopo.value.toFixed(2)}%` : "0%",
        isSafe: (bopo?.value || 0) < 90,
        accentColor: "red"
      },
      {
        title: "NPL (%)",
        value: npl?.value ? `${npl.value.toFixed(2)}%` : "0%",
        isSafe: (npl?.value || 0) < 5,
        accentColor: "green"
      },
      {
        title: "LDR (%)",
        value: ldr?.value ? `${ldr.value.toFixed(2)}%` : "0%",
        accentColor: "blue"
      },
      {
        title: "NIM (%)",
        value: nim?.value ? `${nim.value.toFixed(2)}%` : "0%",
        accentColor: "orange"
      },
      {
        title: "ROA (%)",
        value: roa?.value ? `${roa.value.toFixed(2)}%` : "0%",
        accentColor: "green"
      }
    ];
  }, [metrics, tm]);

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse bg-gray-200 h-64 rounded-xl" /></div>;
  }

  console.log('masuk');

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Collapsible Filters */}
        <FilterBar />

        {/* Metrics Grid */}
        <MetricsGrid metrics={metricItems} columns={4} />

        {/* DPK Breakdown Charts */}
        <DPKBreakdownCharts data={metrics} />

        {/* Data Table with Progressive Disclosure */}
        <DataTable data={metrics} />

        {/* Footer Area */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] lg:text-xs text-gray-500 font-medium py-4 gap-4">
          <p className="text-center sm:text-left">
            {td.footerInfo}
          </p>
          <p>{td.scale}</p>
        </div>
      </div>
    </div>
  );
}