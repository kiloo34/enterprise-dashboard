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
  const { metrics, dates, isLoading } = useFinancialDashboard();

  const metricItems: MetricData[] = useMemo(() => {
    // Helper to find metric by slug
    const getMetric = (slug: string): FinancialMetric | undefined =>
      metrics.find(m => m.indicator.slug.toLowerCase() === slug.toLowerCase());

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
        dtd: asset?.dtd_pct || 0,
        mtd: asset?.mtd_pct || 0,
        ytd: asset?.ytd_pct || 0,
        yoy: asset?.yoy_pct || 0,
        accentColor: "green"
      },
      {
        title: tm.dpk,
        value: dpk?.value ? `${(dpk.value / 1000).toLocaleString('id-ID')}T` : "0T",
        trend: dpk?.dtd_pct || 0,
        dtd: dpk?.dtd_pct || 0,
        mtd: dpk?.mtd_pct || 0,
        ytd: dpk?.ytd_pct || 0,
        yoy: dpk?.yoy_pct || 0,
        accentColor: "blue"
      },
      {
        title: tm.loan,
        value: kredit?.value ? `${(kredit.value / 1000).toLocaleString('id-ID')}T` : "0T",
        trend: kredit?.dtd_pct || 0,
        dtd: kredit?.dtd_pct || 0,
        mtd: kredit?.mtd_pct || 0,
        ytd: kredit?.ytd_pct || 0,
        yoy: kredit?.yoy_pct || 0,
        accentColor: "orange"
      },
      {
        title: "BOPO (%)",
        value: bopo?.value ? `${bopo.value.toFixed(2)}%` : "0%",
        dtd: bopo?.dtd_pct || 0,
        mtd: bopo?.mtd_pct || 0,
        ytd: bopo?.ytd_pct || 0,
        yoy: bopo?.yoy_pct || 0,
        isSafe: (bopo?.value || 0) < 90,
        accentColor: "red"
      },
      {
        title: "NPL (%)",
        value: npl?.value ? `${npl.value.toFixed(2)}%` : "0%",
        dtd: npl?.dtd_pct || 0,
        mtd: npl?.mtd_pct || 0,
        ytd: npl?.ytd_pct || 0,
        yoy: npl?.yoy_pct || 0,
        isSafe: (npl?.value || 0) < 5,
        accentColor: "green"
      },
      {
        title: "LDR (%)",
        value: ldr?.value ? `${ldr.value.toFixed(2)}%` : "0%",
        dtd: ldr?.dtd_pct || 0,
        mtd: ldr?.mtd_pct || 0,
        ytd: ldr?.ytd_pct || 0,
        yoy: ldr?.yoy_pct || 0,
        accentColor: "blue"
      },
      {
        title: "NIM (%)",
        value: nim?.value ? `${nim.value.toFixed(2)}%` : "0%",
        dtd: nim?.dtd_pct || 0,
        mtd: nim?.mtd_pct || 0,
        ytd: nim?.ytd_pct || 0,
        yoy: nim?.yoy_pct || 0,
        accentColor: "orange"
      },
      {
        title: "ROA (%)",
        value: roa?.value ? `${roa.value.toFixed(2)}%` : "0%",
        dtd: roa?.dtd_pct || 0,
        mtd: roa?.mtd_pct || 0,
        ytd: roa?.ytd_pct || 0,
        yoy: roa?.yoy_pct || 0,
        accentColor: "green"
      }
    ];
  }, [metrics, tm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent p-6 lg:p-8 space-y-8">
        <div className="h-12 w-64 bg-gray-200 dark:bg-white/5 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl border border-gray-200 dark:border-white/10" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl border border-gray-200 dark:border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Collapsible Filters */}
        <FilterBar />

        {/* Metrics Grid */}
        <MetricsGrid metrics={metricItems} columns={4} />

        {/* DPK Breakdown Charts */}
        <DPKBreakdownCharts data={metrics} dates={dates} />

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