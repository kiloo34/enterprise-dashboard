"use client";

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TableLoadingSkeleton } from './TableLoadingSkeleton';

export interface DataTableColumn<T> {
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    /** Column definitions */
    columns: DataTableColumn<T>[];
    /** Row data */
    data: T[];
    /** Unique key extractor */
    rowKey: (row: T) => string | number;
    /** Whether data is loading */
    isLoading?: boolean;
    /** Text shown when data is empty */
    emptyText?: string;
    /** Icon shown when data is empty */
    emptyIcon?: React.ReactNode;
    /** Number of skeleton rows to show while loading */
    skeletonRows?: number;
    /** Available page size options. Defaults to [10, 20, 50, 100] */
    pageSizeOptions?: number[];
    /** Default page size. Defaults to 10 */
    defaultPageSize?: number;
    /** Hide pagination footer entirely (for external pagination control) */
    hidePagination?: boolean;
    className?: string;
}

/**
 * Generic, reusable data table component.
 * Handles loading skeleton, empty state, data rendering, and built-in pagination
 * with a configurable rows-per-page selector.
 */
export function DataTable<T>({
    columns,
    data,
    rowKey,
    isLoading = false,
    emptyText = 'Tidak ada data',
    emptyIcon,
    skeletonRows = 5,
    pageSizeOptions = [10, 20, 50, 100],
    defaultPageSize = 10,
    hidePagination = false,
    className,
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // Reset to page 1 when data or pageSize changes
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, pageSize]);

    const totalItems = data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    const goTo = (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page)));

    const showPagination = !hidePagination && !isLoading && totalItems > 0;

    return (
        <div
            className={clsx('rounded-2xl shadow-sm overflow-hidden transition-colors', className)}
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" style={{ color: 'var(--text-secondary)' }}>
                    <thead
                        className="text-xs uppercase border-b"
                        style={{
                            color: 'var(--text-muted)',
                            background: 'var(--modal-footer-bg)',
                            borderColor: 'var(--card-border)'
                        }}
                    >
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={clsx(
                                        'px-6 py-4 font-medium tracking-wider',
                                        col.align === 'center' && 'text-center',
                                        col.align === 'right' && 'text-right',
                                        col.width
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                        {isLoading ? (
                            <TableLoadingSkeleton rows={skeletonRows} cols={columns.length} />
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-16 text-center">
                                    {emptyIcon && <div className="flex justify-center mb-3">{emptyIcon}</div>}
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{emptyText}</p>
                                </td>
                            </tr>
                        ) : (
                            pageData.map(row => (
                                <tr
                                    key={rowKey(row)}
                                    className="transition-colors group hover:bg-[var(--card-bg-hover)]"
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={clsx(
                                                'px-6 py-4',
                                                col.align === 'center' && 'text-center',
                                                col.align === 'right' && 'text-right'
                                            )}
                                        >
                                            {col.render(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Pagination Footer ─── */}
            {showPagination && (
                <div
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t"
                    style={{ borderColor: 'var(--card-border)', background: 'var(--modal-footer-bg)' }}
                >
                    {/* Left: rows per page + total info */}
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                        <span className="whitespace-nowrap">Tampilkan</span>
                        <select
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            className="rounded-lg text-sm px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer border"
                            style={{
                                background: 'var(--input-bg)',
                                color: 'var(--input-text)',
                                borderColor: 'var(--input-border)',
                            }}
                        >
                            {pageSizeOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <span className="whitespace-nowrap">data per halaman</span>
                        <span className="hidden sm:inline" style={{ color: 'var(--card-border)' }}>•</span>
                        <span className="hidden sm:inline whitespace-nowrap">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{startIndex + 1}–{endIndex}</span>
                            {' '}dari{' '}
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{totalItems}</span>
                            {' '}entri
                        </span>
                    </div>

                    {/* Right: page navigation */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => goTo(1)}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--card-bg-hover)]"
                            style={{ color: 'var(--text-muted)' }}
                            title="Halaman pertama"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => goTo(safePage - 1)}
                            disabled={safePage === 1}
                            className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--card-bg-hover)]"
                            style={{ color: 'var(--text-muted)' }}
                            title="Sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let start = Math.max(1, safePage - 2);
                                const end = Math.min(totalPages, start + 4);
                                start = Math.max(1, end - 4);
                                return start + i;
                            }).filter(p => p <= totalPages).map(page => (
                                <button
                                    key={page}
                                    onClick={() => goTo(page)}
                                    className={clsx(
                                        'min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-all',
                                        page === safePage
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'hover:bg-[var(--card-bg-hover)]'
                                    )}
                                    style={page !== safePage ? { color: 'var(--text-secondary)' } : undefined}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => goTo(safePage + 1)}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--card-bg-hover)]"
                            style={{ color: 'var(--text-muted)' }}
                            title="Berikutnya"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => goTo(totalPages)}
                            disabled={safePage === totalPages}
                            className="p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-[var(--card-bg-hover)]"
                            style={{ color: 'var(--text-muted)' }}
                            title="Halaman terakhir"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

