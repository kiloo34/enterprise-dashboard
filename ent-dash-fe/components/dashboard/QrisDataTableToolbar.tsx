import React from "react";
import { Search, Download, ChevronDown, FileText, FileSpreadsheet, File as FileIcon } from "lucide-react";
import clsx from "clsx";
import { SearchableSelect } from "../ui/SearchableSelect";

interface QrisDataTableToolbarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    rowsPerPage: number;
    setRowsPerPage: (rows: number) => void;
    filterDate: string;
    handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    filterBankStatus: string;
    setFilterBankStatus: (status: string) => void;
    filterReconStatus: string;
    setFilterReconStatus: (status: string) => void;
    isExportOpen: boolean;
    setIsExportOpen: (open: boolean) => void;
    exportRef: React.RefObject<HTMLDivElement | null>;
}

export function QrisDataTableToolbar({
    searchTerm, setSearchTerm,
    rowsPerPage, setRowsPerPage,
    filterDate, handleDateChange,
    filterBankStatus, setFilterBankStatus,
    filterReconStatus, setFilterReconStatus,
    isExportOpen, setIsExportOpen,
    exportRef
}: QrisDataTableToolbarProps) {
    return (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative w-full xl:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search Merchant, STAN..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 dark:text-gray-200 transition-shadow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap xl:flex-nowrap items-center justify-start xl:justify-end gap-2 w-full xl:w-auto">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 font-medium">Show:</span>
                    <div className="w-[80px]">
                        <SearchableSelect
                            options={[
                                { value: "10", label: "10" },
                                { value: "20", label: "20" },
                                { value: "50", label: "50" },
                                { value: "100", label: "100" }
                            ]}
                            value={rowsPerPage.toString()}
                            onChange={(val) => setRowsPerPage(Number(val))}
                            searchPlaceholder="Cari..."
                        />
                    </div>
                </div>

                <input
                    type="date"
                    className="w-full sm:w-auto shrink-0 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={filterDate}
                    onChange={handleDateChange}
                />

                <div className="w-full sm:w-[160px] shrink-0">
                    <SearchableSelect
                        options={[
                            { value: "ALL", label: "All Bank Statuses" },
                            { value: "SUCCEED", label: "SUCCEED" },
                            { value: "FAILED", label: "FAILED" },
                            { value: "SUSPECT", label: "SUSPECT" }
                        ]}
                        value={filterBankStatus}
                        onChange={setFilterBankStatus}
                        placeholder="Bank Status"
                        searchPlaceholder="Cari..."
                    />
                </div>

                <div className="w-full sm:w-[170px] shrink-0">
                    <SearchableSelect
                        options={[
                            { value: "ALL", label: "All Recon Statuses" },
                            { value: "MATCHED", label: "MATCHED" },
                            { value: "UNMATCHED", label: "UNMATCHED" },
                            { value: "SUSPECT", label: "SUSPECT" }
                        ]}
                        value={filterReconStatus}
                        onChange={setFilterReconStatus}
                        placeholder="Recon Status"
                        searchPlaceholder="Cari..."
                    />
                </div>

                <div className="relative w-full sm:w-auto shrink-0 text-right sm:text-left" ref={exportRef}>
                    <button
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        className="w-full sm:w-auto justify-center sm:justify-start whitespace-nowrap inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 rounded-lg text-xs sm:text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline w-full">Export Data</span>
                        <span className="inline sm:hidden w-full">Export</span>
                        <ChevronDown className={clsx("w-4 h-4 ml-2 transition-transform", isExportOpen && "rotate-180")} />
                    </button>

                    {isExportOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors">
                                <FileText className="w-4 h-4 mr-3 text-blue-500" />
                                Export as CSV
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors">
                                <FileSpreadsheet className="w-4 h-4 mr-3 text-green-500" />
                                Export as Excel
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors">
                                <FileIcon className="w-4 h-4 mr-3 text-red-500" />
                                Export as PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
