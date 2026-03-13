"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useTranslation } from "../../../hooks/useTranslation";
import { mockDashboardData } from "../../../constants/mockDashboardData";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { SearchableSelect } from "../../ui/SearchableSelect";

export function DataTable() {
    const t = useTranslation("DataTable");
    const [showDetails, setShowDetails] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");

    // Extract categories based on high-level rows (level 0) that are not ratios
    const categories = useMemo(() => {
        return Array.from(new Set(mockDashboardData.filter(d => d.level === 0).map(d => d.label)));
    }, []);

    const filteredData = useMemo(() => {
        let currentCategory = "";
        const result = [];
        for (const row of mockDashboardData) {
            // Track the active Top-level category for child grouping
            if (row.level === 0) {
                currentCategory = row.label;
            }

            const matchesCategory = filterCategory === "ALL" || currentCategory === filterCategory;
            const matchesSearch = searchQuery === "" || row.label.toLowerCase().includes(searchQuery.toLowerCase());

            if (matchesCategory && matchesSearch) {
                result.push(row);
            }
        }
        return result;
    }, [searchQuery, filterCategory]);

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
                    <TableHeader translations={t} showDetails={showDetails} />
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
