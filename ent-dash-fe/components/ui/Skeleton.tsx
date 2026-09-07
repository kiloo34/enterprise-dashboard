import React from "react";
import clsx from "clsx";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={clsx("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
            {...props}
        />
    );
}
