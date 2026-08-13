import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="flex-1 p-4 lg:p-8 space-y-6 animate-pulse">
            {/* Page header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>

            {/* Filter / toolbar bar */}
            <Skeleton className="h-12 w-full rounded-xl" />

            {/* Main content area */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
            </div>

            {/* Table / card block */}
            <Skeleton className="h-96 w-full rounded-xl" />
        </div>
    );
}
