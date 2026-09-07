"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { useTranslation } from "../../hooks/useTranslation";

export interface QrisChartProps {
    settled: number;
    unsettled: number;
    discrepancy: number;
}

export function QrisDiscrepancyChart({ settled, unsettled, discrepancy }: QrisChartProps) {
    const td = useTranslation("Dashboard");

    const data = useMemo(() => [
        { name: "Matched", value: settled, color: "#10b981" },
        { name: "Unmatched", value: discrepancy, color: "#ef4444" },
        { name: "Suspect", value: Math.max(0, unsettled - discrepancy), color: "#f59e0b" }
    ], [settled, unsettled, discrepancy]);

    const total = settled + unsettled;
    const unsettledPct = total > 0 ? ((unsettled / total) * 100).toFixed(1) : "0.0";

    // Custom formatter for the tooltip
    const tooltipFormatter = (value: any) => {
        if (typeof value !== "number") return value;

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:backdrop-blur-sm p-6 flex flex-col h-[350px] shadow-sm dark:shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">{td.operations.rekonStatus.title}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500 font-medium">{td.operations.rekonStatus.subtitle}</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip
                            formatter={tooltipFormatter}
                            contentStyle={{
                                backgroundColor: 'var(--card-bg, #fff)',
                                borderRadius: '12px',
                                border: '1px solid var(--card-border, #e5e7eb)',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                color: 'var(--text-primary, #111827)',
                            }}
                            itemStyle={{ color: 'inherit' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center text for donut chart */}
                <div className="absolute inset-0 flex items-center justify-center -mt-6 pointer-events-none">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{td.operations.rekonStatus.unsettled}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{unsettledPct}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
