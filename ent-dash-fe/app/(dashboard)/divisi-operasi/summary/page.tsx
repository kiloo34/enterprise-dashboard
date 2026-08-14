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
        <div className="flex flex-col min-h-screen bg-transparent">
            <div className="flex-1 p-6 lg:p-8 space-y-8">
                <PageHeader title={td.operations.title} />

                {/* Collapsible Filters */}
                <FilterBar type="qris" />

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border p-6 shadow-sm dark:shadow-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h3 className="font-bold uppercase tracking-widest text-xs mb-6" style={{ color: 'var(--text-muted)' }}>{td.operations.charts.channelDistribution}</h3>
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
                                        contentStyle={{ 
                                            backgroundColor: 'var(--card-bg)', 
                                            borderRadius: '12px', 
                                            border: '1px solid var(--card-border)', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                        }}
                                        itemStyle={{ color: 'var(--text-primary)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', color: 'var(--text-muted)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Footer Area */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] lg:text-xs font-medium py-4 gap-4" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-center sm:text-left">
                        {td.footerInfo}
                    </p>
                    <p>{td.scale}</p>
                </div>
            </div>
        </div>
    );
}
