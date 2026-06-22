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
        return data.map(m => {
            let displayLabel = m.indicator.slug.toUpperCase().replace(/_/g, " ");

            // Special formatting for LABA/RUGI
            displayLabel = displayLabel.replace("LABA RUGI", "LABA/RUGI");

            // Add ratio suffix if applicable
            if (m.indicator.is_ratio) {
                displayLabel += " (%)";
            }

            const formatValue = (val: any) => {
                if (typeof val !== 'number') return "-";
                return m.indicator.is_ratio
                    ? val.toFixed(2)
                    : Math.round(val).toLocaleString('id-ID');
            };

            return {
                slug: m.indicator.slug,
                label: displayLabel,
                level: m.indicator.level,
                isBold: m.indicator.is_bold || m.indicator.level === 0, // Root items are usually bold in image
                isLink: m.indicator.is_link,
                isRatio: m.indicator.is_ratio,
                kelompok: m.indicator.kelompok,
                segment: m.nama_wil || m.nama_cab || "NASIONAL",
                isAjp: m.is_ajp,
                isVisible: m.indicator.is_visible ?? true,
                isDeleted: !!m.indicator.deleted_at,
                // Map the history values [R1, R2, R3, R4, R5]
                valueR1: formatValue(m.history?.[0]),
                valueR2: formatValue(m.history?.[1]),
                valueR3: formatValue(m.history?.[2]),
                valueR4: formatValue(m.history?.[3]),
                valueR5: formatValue(m.history?.[4]),
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
            };
        });
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
            // Rule 1: jika keduanya true maka tidak ditampilkan
            // Rule 2: jika is_deleted false and is_visible true maka ditampilkan
            // Rule 3: jika is_deleted false and is_visible false maka tidak ditampilkan
            const isShown = row.isVisible === true && row.isDeleted === false;
            if (!isShown) return false;

            // Find the original metric based on slug
            const metric = data.find(m => m.indicator.slug === row.slug);
            const matchesCategory = filterCategory === "ALL" || (metric?.indicator.category === filterCategory);
            const matchesSearch = searchQuery === "" || row.label.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [tableRows, searchQuery, filterCategory, data]);

    return (
        <div 
            className="rounded-xl border shadow-sm overflow-hidden mt-4 lg:mt-6 mb-6 transition-colors"
            style={{ 
                background: 'var(--card-bg)', 
                borderColor: 'var(--card-border)' 
            }}
        >
            <div 
                className="p-4 border-b flex flex-col gap-4 transition-colors"
                style={{ 
                    borderColor: 'var(--modal-border)', 
                    background: 'var(--modal-footer-bg)' 
                }}
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Performance Data
                        </span>
                        {!showDetails && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase tracking-tight">Executive View</span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-bold transition-all shadow-sm active:scale-95"
                        style={{
                            background: 'var(--btn-secondary-bg)',
                            color: 'var(--btn-secondary-text)',
                            borderColor: 'var(--btn-secondary-border)',
                        }}
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
                            <Search className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari indikator..."
                            className="border text-sm rounded-lg block w-full pl-10 p-2.5 shadow-sm transition-all outline-none"
                            style={{
                                background: 'var(--input-bg)',
                                borderColor: 'var(--input-border)',
                                color: 'var(--input-text)',
                            }}
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
                    <tbody 
                        className="divide-y transition-colors"
                        style={{ 
                            borderColor: 'var(--card-border)',
                            background: 'var(--card-bg)'
                        }}
                    >
                        {filteredData.length > 0 ? (
                            filteredData.map((row, idx) => (
                                <TableRow key={idx} row={row} showDetails={showDetails} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
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

