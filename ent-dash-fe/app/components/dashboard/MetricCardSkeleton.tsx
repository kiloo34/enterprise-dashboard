import React from "react";
import { Skeleton } from "../ui/Skeleton";

export function MetricCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col justify-between h-[120px] relative">
            <div className="space-y-4">
                {/* Title Skeleton */}
                <Skeleton className="h-3 w-24" />

                <div className="flex items-baseline gap-3">
                    {/* Value Skeleton */}
                    <Skeleton className="h-8 w-20" />

                    {/* Trend Indicator Skeleton */}
                    <Skeleton className="h-4 w-12" />
                </div>
            </div>

            {/* Bottom Accent Skeleton */}
            <div className="absolute bottom-0 left-6 right-6 h-1 rounded-t-sm bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
    );
}
