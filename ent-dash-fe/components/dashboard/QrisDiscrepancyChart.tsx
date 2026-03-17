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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{td.operations.rekonStatus.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{td.operations.rekonStatus.subtitle}</p>
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
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center text for donut chart */}
                <div className="absolute inset-0 flex items-center justify-center -mt-6 pointer-events-none">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{td.operations.rekonStatus.unsettled}</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">{unsettledPct}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
