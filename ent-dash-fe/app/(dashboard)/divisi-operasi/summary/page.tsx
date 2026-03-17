"use client";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useTranslation } from "@/hooks/useTranslation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PageHeader } from "@/components/ui/PageHeader";

const MOCK_OPERATIONS_DATA = [
    { name: "QRIS AJ", value: 450, color: "#3B82F6" },
    { name: "QRIS On-Us", value: 320, color: "#10B981" },
    { name: "QRIS Rintis", value: 150, color: "#F59E0B" },
];

export default function OperationSummaryDashboard() {
    const td = useTranslation("Dashboard");

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1 p-4 lg:p-8 space-y-6">
                <PageHeader title={td.operations.title} />

                {/* Collapsible Filters */}
                <FilterBar type="qris" />

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    <MetricCard
                        title={td.operations.metrics.totalQris}
                        value="920M"
                        trend={5.2}
                        accentColor="blue"
                    />
                    <MetricCard
                        title={td.operations.metrics.successSettlement}
                        value="895M"
                        trend={2.1}
                        accentColor="green"
                    />
                    <MetricCard
                        title={td.operations.metrics.unmatchedSuspect}
                        value="25M"
                        trend={-1.5}
                        accentColor="orange"
                        isSafe={false}
                    />
                </div>

                {/* Breakdown Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6">{td.operations.charts.channelDistribution}</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={MOCK_OPERATIONS_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {MOCK_OPERATIONS_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

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
