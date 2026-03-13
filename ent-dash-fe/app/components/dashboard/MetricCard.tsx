"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "../../hooks/useTranslation";

interface MetricCardProps {
    title: string;
    value: string;
    trend?: number; // percentage, positive for up, negative for down
    isSafe?: boolean; // specific for NPL RATIO handling
    accentColor: "green" | "blue" | "orange" | "red";
}

export function MetricCard({
    title,
    value,
    trend,
    isSafe,
    accentColor,
}: MetricCardProps) {
    const t = useTranslation("Metrics");
    const isPositive = trend && trend > 0;

    const accentClasses = {
        green: "bg-green-500",
        blue: "bg-blue-600",
        orange: "bg-orange-500",
        red: "bg-red-500",
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 relative flex flex-col justify-between h-full transition-colors">
            <div className="space-y-2">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {title}
                </h3>
                <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>

                    {trend !== undefined && (
                        <div
                            className={clsx(
                                "flex items-center text-sm font-bold",
                                isPositive ? "text-green-600" : "text-red-500"
                            )}
                        >
                            {isPositive ? (
                                <ArrowUpRight className="w-4 h-4 mr-0.5" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 mr-0.5" />
                            )}
                            {isPositive ? "+" : ""}
                            {trend}%
                        </div>
                    )}

                    {isSafe && (
                        <div className="flex items-center text-sm font-bold text-green-600">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {t.safe}
                        </div>
                    )}
                </div>
            </div>

            <div
                className={clsx(
                    "absolute bottom-0 left-6 right-6 h-1 rounded-t-sm",
                    accentClasses[accentColor]
                )}
            />
        </div>
    );
}
