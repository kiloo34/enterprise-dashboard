import React from "react";
import { MetricCardSkeleton } from "../../../components/dashboard/MetricCardSkeleton";
import { Skeleton } from "../../../components/ui/Skeleton";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-1 p-4 lg:p-8 space-y-6">

                {/* Executive Summary Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
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

                {/* DPK Breakdown Charts Skeleton */}
                <Skeleton className="h-72 w-full rounded-xl" />

                {/* DataTable Skeleton */}
                <Skeleton className="h-96 w-full rounded-xl" />

                {/* Footer Skeleton */}
                <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </div>
    );
}
