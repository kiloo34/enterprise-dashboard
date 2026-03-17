"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useTranslation } from "../../../hooks/useTranslation";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { SearchableSelect } from "../../ui/SearchableSelect";
import { FinancialMetric } from "@/services/FinancialService";
import { DataRow } from "@/types";

interface DataTableProps {
    data: FinancialMetric[];
}

export function DataTable({ data }: DataTableProps) {
    const t = useTranslation("DataTable");
    const [showDetails, setShowDetails] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");

    // Map FinancialMetric to DataRow
    const tableRows: DataRow[] = useMemo(() => {
        return data.map(m => ({
            label: m.indicator.label,
            level: m.indicator.level,
            isBold: m.indicator.is_bold,
            isLink: m.indicator.is_link,
            isRatio: m.indicator.is_ratio,
            kelompok: m.indicator.kelompok,
            segment: m.nama_wil || m.nama_cab || "NASIONAL",
            isAjp: m.is_ajp,
            // Map the values
            valueR1: "-", // Historical placeholders for now
            valueR2: "-",
            valueR3: "-",
            valueR4: "-",
            valueR5: m.value?.toLocaleString('id-ID') || "0",
            targetNominal: m.target_nominal?.toLocaleString('id-ID') || "0",
            targetPct: m.target_nominal && m.value ? `${((m.value / m.target_nominal) * 100).toFixed(1)}%` : "0%",
            dtdNominal: m.dtd_nominal || 0,
            dtdPct: `${m.dtd_pct?.toFixed(1) || "0"}%`,
            mtdNominal: m.mtd_nominal || 0,
            mtdPct: `${m.mtd_pct?.toFixed(1) || "0"}%`,
            ytdNominal: m.ytd_nominal || 0,
            ytdPct: `${m.ytd_pct?.toFixed(1) || "0"}%`,
            yoyNominal: 0,
            yoyPct: "0%",
        }));
    }, [data]);

    // Extract categories based on indicator.category field
    const categories = useMemo(() => {
        return Array.from(new Set(data.map(m => m.indicator.category)));
    }, [data]);

    // Format headers based on the latest date in the data
    const latestDateStr = useMemo(() => {
        if (data.length === 0) return "";
        return data[0].report_date;
    }, [data]);

    const filteredData = useMemo(() => {
        return tableRows.filter(row => {
            // Find the original metric to get its category
            const metric = data.find(m => m.indicator.label === row.label);
            const matchesCategory = filterCategory === "ALL" || (metric?.indicator.category === filterCategory);
            const matchesSearch = searchQuery === "" || row.label.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [tableRows, searchQuery, filterCategory, data]);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mt-4 lg:mt-6 mb-6 transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4 bg-gray-50/50 dark:bg-gray-800/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance Data</span>
                        {!showDetails && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase tracking-tight">Executive View</span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                    >
                        {showDetails ? (
                            <>
                                <span>{t.hideDetails}</span>
                                <ChevronUp className="h-3.5 w-3.5" />
                            </>
                        ) : (
                            <>
                                <span>{t.showDetails} (DTD/MTD/YTD)</span>
                                <ChevronDown className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari indikator..."
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 shadow-sm transition-all"
                        />
                    </div>
                    <div className="flex gap-4 w-full sm:w-[250px]">
                        <SearchableSelect
                            options={[
                                { value: "ALL", label: "Semua Kategori" },
                                ...categories.map(cat => ({ value: cat, label: cat }))
                            ]}
                            value={filterCategory}
                            onChange={setFilterCategory}
                            placeholder="Pilih kategori..."
                            searchPlaceholder="Cari kategori..."
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                    <TableHeader translations={t} showDetails={showDetails} reportDate={latestDateStr} />
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 transition-colors">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, idx) => (
                                <TableRow key={idx} row={row} showDetails={showDetails} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Data tidak ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
