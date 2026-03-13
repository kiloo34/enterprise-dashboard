import React from 'react';
import { Skeleton } from './Skeleton';

interface TableLoadingSkeletonProps {
    /** Number of skeleton rows to render */
    rows?: number;
    /** Number of columns in the table */
    cols?: number;
}

/**
 * Consistent loading skeleton for all data tables across the app.
 * Replace inline `animate-spin` loading states with this component.
 */
export function TableLoadingSkeleton({ rows = 5, cols = 4 }: TableLoadingSkeletonProps) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-100 dark:border-gray-700/50">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <td key={colIdx} className="px-6 py-4">
                            <Skeleton
                                className={`h-4 rounded ${colIdx === 0 ? 'w-3/4' : colIdx === cols - 1 ? 'w-1/4 ml-auto' : 'w-1/2'}`}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
