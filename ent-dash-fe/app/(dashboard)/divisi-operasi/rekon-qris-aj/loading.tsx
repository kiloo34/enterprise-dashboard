"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { MetricCardSkeleton } from "@/components/dashboard/MetricCardSkeleton";

export default function QRISLoading() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1 p-4 lg:p-8 space-y-6">

                {/* Header Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* FilterBar Skeleton */}
                <Skeleton className="h-16 w-full rounded-xl" />

                {/* Metrics Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                    <MetricCardSkeleton />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Discrepancy Chart Skeleton */}
                    <Skeleton className="h-72 w-full rounded-xl lg:col-span-1" />
                    {/* Top Merchants Chart Skeleton */}
                    <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
                </div>

                {/* DataTable Skeleton */}
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        </div>
    );
}
