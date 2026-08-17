"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "../../hooks/useTranslation";

interface MetricCardProps {
    title: string;
    value: string;
    trend?: number; // percentage, positive for up, negative for down
    dtd?: number;
    mtd?: number;
    ytd?: number;
    yoy?: number;
    isSafe?: boolean; // specific for NPL RATIO handling
    accentColor: "green" | "blue" | "orange" | "red";
}

export function MetricCard({
    title,
    value,
    trend,
    dtd,
    mtd,
    ytd,
    yoy,
    isSafe,
    accentColor,
}: MetricCardProps) {
    const t = useTranslation("Metrics");
    const isPositive = trend && trend > 0;
    const hasDetails = dtd !== undefined || mtd !== undefined || ytd !== undefined || yoy !== undefined;

    const accentClasses = {
        green: "bg-green-500",
        blue: "bg-blue-600",
        orange: "bg-orange-500",
        red: "bg-red-500",
    };

    const renderTrendDetail = (label: string, val?: number) => {
        if (val === undefined) return null;
        const pos = val > 0;
        return (
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                <span className={clsx("text-xs font-bold", pos ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {pos ? "+" : ""}{val}%
                </span>
            </div>
        );
    };

    return (
        <div
            className="relative overflow-hidden rounded-2xl shadow-sm p-6 flex flex-col justify-between h-full transition-all hover:shadow-md group border"
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
            <div className="space-y-3">
                <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    {title}
                </h3>
                <div className="flex items-baseline gap-3">
                    <span className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</span>

                    {trend !== undefined && (
                        <div
                            className={clsx(
                                "flex items-center text-sm font-bold",
                                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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
                </div>
            </div>

            {isSafe && (
                <div className="mt-4 flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full w-fit">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.safe}
                </div>
            )}

            {hasDetails && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-3">
                    {renderTrendDetail("DTD", dtd)}
                    {renderTrendDetail("MTD", mtd)}
                    {renderTrendDetail("YTD", ytd)}
                    {renderTrendDetail("YOY", yoy)}
                </div>
            )}

            <div
                className={clsx(
                    "absolute bottom-0 left-0 right-0 h-1 opacity-60",
                    accentClasses[accentColor]
                )}
            />
        </div>
    );
}

