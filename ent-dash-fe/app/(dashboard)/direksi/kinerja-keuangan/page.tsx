"use client";

import { FilterBar } from "@/app/components/dashboard/FilterBar";
import { DataTable } from "@/app/components/dashboard/DataTable/DataTable";
import { DPKBreakdownCharts } from "@/app/components/dashboard/DPKBreakdownCharts";
import { useTranslation } from "@/app/hooks/useTranslation";
import { MetricsGrid, MetricData } from "@/app/components/dashboard/MetricsGrid";

export default function Dashboard() {
  const tm = useTranslation("Metrics");
  const td = useTranslation("Dashboard");

  const metricItems: MetricData[] = [
    {
      title: tm.totalAsset,
      value: "1.284,5T",
      trend: 4.2,
      accentColor: "green"
    },
    {
      title: tm.dpk,
      value: "942,1T",
      trend: 1.8,
      accentColor: "blue"
    },
    {
      title: tm.loan,
      value: "812,4T",
      trend: -0.5,
      accentColor: "orange"
    },
    {
      title: tm.npl,
      value: "2.34%",
      isSafe: true,
      accentColor: "green"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Collapsible Filters */}
        <FilterBar />

        {/* Metrics Grid */}
        <MetricsGrid metrics={metricItems} />

        {/* DPK Breakdown Charts */}
        <DPKBreakdownCharts />

        {/* Data Table with Progressive Disclosure */}
        <DataTable />

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