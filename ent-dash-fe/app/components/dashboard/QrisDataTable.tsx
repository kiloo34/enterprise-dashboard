"use client";

import React from "react";
import clsx from "clsx";
import { useQrisData } from "./hooks/useQrisData";
import { QrisDataTableToolbar } from "./QrisDataTableToolbar";
import { useTranslation } from "@/app/hooks/useTranslation";
import { StatusBadge, BadgeStatus } from "../ui/StatusBadge";

export interface QrisDataTableProps {
    dateFilter?: string;
    onDateFilterChange?: (date: string) => void;
}

export function QrisDataTable({ dateFilter, onDateFilterChange }: QrisDataTableProps) {
    const t = useTranslation("DataTable");
    const common = useTranslation("Common");
    const {
        searchTerm, setSearchTerm,
        filterBankStatus, setFilterBankStatus,
        filterReconStatus, setFilterReconStatus,
        filterDate, handleDateChange,
        rowsPerPage, setRowsPerPage,
        currentPage, setCurrentPage,
        isExportOpen, setIsExportOpen,
        exportRef,
        filteredData, paginatedData, totalPages,
        totalItems
    } = useQrisData(dateFilter, onDateFilterChange);

    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getRawStatusBadge = (status: string) => {
        const isSuccess = status === "SUCCESS";
        const isUnknown = status === "UNKNOWN" || status === "SUSPECT";

        return (
            <span className={clsx(
                "inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-wide",
                isSuccess ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                    isUnknown ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                        "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            )}>
                {status}
            </span>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
            <QrisDataTableToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                filterDate={filterDate}
                handleDateChange={handleDateChange}
                filterBankStatus={filterBankStatus}
                setFilterBankStatus={setFilterBankStatus}
                filterReconStatus={filterReconStatus}
                setFilterReconStatus={setFilterReconStatus}
                isExportOpen={isExportOpen}
                setIsExportOpen={setIsExportOpen}
                exportRef={exportRef}
            />

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                {t.headers.date}
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                {t.headers.stan}
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t.headers.merchant}
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">
                                {t.headers.nominal} (IDR)
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                                {t.headers.bankStatus}
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                                {t.headers.artajasaStatus}
                            </th>
                            <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                                {t.headers.reconStatus}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedData.length > 0 ? paginatedData.map((row) => (
                            <tr
                                key={row.id}
                                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors group"
                            >
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 whitespace-nowrap">
                                    <div className="font-medium text-xs">{row.timestamp.split(" ")[0]}</div>
                                    <div className="text-[11px] text-gray-500">{row.timestamp.split(" ")[1]}</div>
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {row.stan}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                                    {row.merchant}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right whitespace-nowrap">
                                    {formatRupiah(row.nominal)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {getRawStatusBadge(row.bankStatus)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {getRawStatusBadge(row.artajasaStatus)}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <StatusBadge status={row.reconStatus.toLowerCase() as BadgeStatus} />
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    {common.noData}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                <span>
                    {t.pagination.showing} {filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} {t.pagination.to} {Math.min(currentPage * rowsPerPage, filteredData.length)} {t.pagination.of} {new Intl.NumberFormat('en-US').format(filteredData.length)} {t.pagination.entries}
                    {filteredData.length < totalItems && <span className="ml-1">({t.pagination.filteredFrom} {new Intl.NumberFormat('en-US').format(totalItems)})</span>}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                        {t.pagination.prev}
                    </button>

                    <div className="flex items-center gap-1 mx-2">
                        <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span>
                        <span className="text-gray-400">/</span>
                        <span>{totalPages || 1}</span>
                    </div>

                    <button
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                        {t.pagination.next}
                    </button>
                </div>
            </div>
        </div>
    );
}
