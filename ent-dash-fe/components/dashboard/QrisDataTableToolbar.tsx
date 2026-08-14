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
    onExportCSV: () => void;
}

export function QrisDataTableToolbar({
    searchTerm, setSearchTerm,
    rowsPerPage, setRowsPerPage,
    filterDate, handleDateChange,
    filterBankStatus, setFilterBankStatus,
    filterReconStatus, setFilterReconStatus,
    isExportOpen, setIsExportOpen,
    exportRef, onExportCSV
}: QrisDataTableToolbarProps) {
    return (
        <div className="p-5 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-6 backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--card-bg) 40%, transparent)', borderColor: 'var(--card-border)' }}>
            <div className="relative w-full xl:w-80 shrink-0 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                <input
                    type="text"
                    placeholder="Cari Merchant, STAN..."
                    className="w-full pl-11 pr-4 py-2.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/50 transition-all font-semibold"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
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
                    className="w-full sm:w-auto shrink-0 px-4 py-2.5 border rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 font-semibold"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
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
                        className="w-full sm:w-auto justify-center sm:justify-start whitespace-nowrap inline-flex items-center px-6 py-2.5 bg-blue-600 rounded-xl text-xs sm:text-sm font-black text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                    >
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline w-full">EXPORT DATA</span>
                        <span className="inline sm:hidden w-full">EXPORT</span>
                        <ChevronDown className={clsx("w-4 h-4 ml-2 transition-transform", isExportOpen && "rotate-180")} />
                    </button>

                    {isExportOpen && (
                        <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 border backdrop-blur-xl" style={{ background: 'var(--modal-bg)', borderColor: 'var(--modal-border)' }}>
                            <button 
                                onClick={onExportCSV}
                                className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-[var(--card-bg-hover)] flex items-center transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <FileText className="w-4 h-4 mr-3 text-blue-500" />
                                Export as CSV
                            </button>
                            <button className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-[var(--card-bg-hover)] flex items-center transition-colors" style={{ color: 'var(--text-primary)' }}>
                                <FileSpreadsheet className="w-4 h-4 mr-3 text-green-500" />
                                Export as Excel
                            </button>
                            <button className="w-full text-left px-5 py-3 text-sm font-bold hover:bg-[var(--card-bg-hover)] flex items-center transition-colors" style={{ color: 'var(--text-primary)' }}>
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
