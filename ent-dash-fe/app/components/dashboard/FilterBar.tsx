"use client";

import React, { useState } from "react";
import { ChevronDown, SlidersHorizontal, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "../../hooks/useTranslation";
import { SearchableSelect } from "../ui/SearchableSelect";

interface FilterBarProps {
    type?: "kinerja" | "qris";
}

export function FilterBar({ type = "kinerja" }: FilterBarProps) {
    const t = useTranslation("Dashboard").filter;
    const [isExpanded, setIsExpanded] = useState(false);

    // Dummy states for visual representation of SearchableSelect
    const [network, setNetwork] = useState("ALL");
    const [conventional, setConventional] = useState("ALL");
    const [area, setArea] = useState("ALL");
    const [branch, setBranch] = useState("ALL");
    const [dateRange, setDateRange] = useState("TODAY");
    const [rekonStatus, setRekonStatus] = useState("ALL");
    const [txType, setTxType] = useState("ALL");

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300">
            {/* Toggle Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 lg:px-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">{t.title}</span>
                    {!isExpanded && (
                        <div className="hidden sm:flex items-center gap-2 ml-4">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t.summary} </span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{t.all} {t.network}</span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{t.conventional}</span>
                        </div>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            {/* Collapsible Content */}
            <div
                className={clsx(
                    "overflow-hidden transition-all duration-300",
                    isExpanded ? "max-h-[500px] border-t border-gray-100 dark:border-gray-800" : "max-h-0"
                )}
            >
                <div className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                        {/* Filters Conditionally Rendered by Type */}

                        {type === "kinerja" && (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.network}
                                    </label>
                                    <SearchableSelect
                                        options={[{ value: "ALL", label: `${t.all} ${t.network}` }]}
                                        value={network}
                                        onChange={setNetwork}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.conventional}
                                    </label>
                                    <SearchableSelect
                                        options={[{ value: "ALL", label: t.all }]}
                                        value={conventional}
                                        onChange={setConventional}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.area}
                                    </label>
                                    <SearchableSelect
                                        options={[{ value: "ALL", label: `${t.all} ${t.area}` }]}
                                        value={area}
                                        onChange={setArea}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.branch}
                                    </label>
                                    <SearchableSelect
                                        options={[{ value: "ALL", label: `${t.all} ${t.branch}` }]}
                                        value={branch}
                                        onChange={setBranch}
                                    />
                                </div>
                            </div>
                        )}

                        {type === "qris" && (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.dateRange}
                                    </label>
                                    <SearchableSelect
                                        options={[
                                            { value: "TODAY", label: t.today },
                                            { value: "THIS_MONTH", label: t.thisMonth }
                                        ]}
                                        value={dateRange}
                                        onChange={setDateRange}
                                    />
                                </div>

                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.rekonStatus}
                                    </label>
                                    <SearchableSelect
                                        options={[
                                            { value: "ALL", label: `${t.all} Status` },
                                            { value: "MATCH", label: t.match },
                                            { value: "UNMATCH", label: t.unmatch },
                                            { value: "SUSPECT", label: t.suspect }
                                        ]}
                                        value={rekonStatus}
                                        onChange={setRekonStatus}
                                    />
                                </div>

                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {t.transactionType}
                                    </label>
                                    <SearchableSelect
                                        options={[
                                            { value: "ALL", label: `${t.all} Tipe` },
                                            { value: "PAYMENT", label: t.payment },
                                            { value: "REFUND", label: t.refund }
                                        ]}
                                        value={txType}
                                        onChange={setTxType}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 lg:gap-4 pt-4 lg:pt-0 lg:ml-6 lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-6">
                            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold text-xs lg:text-sm px-2">
                                {t.clear}
                            </button>
                            <button className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 lg:py-2.5 rounded-lg font-bold text-xs lg:text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap">
                                {t.apply}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
