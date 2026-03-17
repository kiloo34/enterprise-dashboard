"use client";

import React from "react";
import { MetricCard } from "./MetricCard";
import { formatBigNumber } from "@/utils/formatting";

export interface MetricData {
    title: string;
    value: string | number;
    trend?: number;
    accentColor?: "blue" | "green" | "orange" | "red";
    isSafe?: boolean;
    useBigNumberFormat?: boolean;
}

interface MetricsGridProps {
    metrics: MetricData[];
    columns?: number;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics, columns = 4 }) => {
    const gridColsClass = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
    }[columns] || "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

    return (
        <div className={`grid ${gridColsClass} gap-4 lg:gap-6`}>
            {metrics.map((metric, index) => (
                <MetricCard
                    key={index}
                    title={metric.title}
                    value={
                        (metric.useBigNumberFormat && typeof metric.value === "number")
                            ? formatBigNumber(metric.value)
                            : String(metric.value)
                    }
                    trend={metric.trend}
                    accentColor={metric.accentColor || "blue"}
                    isSafe={metric.isSafe}
                />
            ))}
        </div>
    );
};
