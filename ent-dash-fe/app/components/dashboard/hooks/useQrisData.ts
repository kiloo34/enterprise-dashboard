import { useState, useMemo, useEffect, useRef } from "react";
import qrisData from "../../../constants/qrisSample.json";

export interface QrisRow {
    id: string;
    timestamp: string;
    merchant: string;
    stan: string;
    nominal: number;
    bankStatus: string;
    artajasaStatus: string;
    reconStatus: "MATCHED" | "UNMATCHED" | "SUSPECT";
}

const tableData = qrisData.tableData as QrisRow[];

export function useQrisData(initialDateFilter?: string, onDateFilterChange?: (date: string) => void) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBankStatus, setFilterBankStatus] = useState("ALL");
    const [filterReconStatus, setFilterReconStatus] = useState("ALL");

    const getTodayString = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const [internalFilterDate, setInternalFilterDate] = useState(getTodayString());
    const filterDate = initialDateFilter !== undefined ? initialDateFilter : internalFilterDate;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (onDateFilterChange) onDateFilterChange(newDate);
        else setInternalFilterDate(newDate);
    };

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const filteredData = useMemo(() => {
        return tableData.filter((row) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === "" ||
                row.merchant.toLowerCase().includes(searchLower) ||
                row.stan.toLowerCase().includes(searchLower);

            const matchesBank = filterBankStatus === "ALL" || row.bankStatus === filterBankStatus;
            const matchesRecon = filterReconStatus === "ALL" || row.reconStatus === filterReconStatus;
            const matchesDate = filterDate === "" || row.timestamp.startsWith(filterDate);

            return matchesSearch && matchesBank && matchesRecon && matchesDate;
        });
    }, [searchTerm, filterBankStatus, filterReconStatus, filterDate]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    useEffect(() => {
        // eslint-disable-next-line
        setCurrentPage(1);
    }, [searchTerm, filterBankStatus, filterReconStatus, filterDate, rowsPerPage]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return {
        searchTerm, setSearchTerm,
        filterBankStatus, setFilterBankStatus,
        filterReconStatus, setFilterReconStatus,
        filterDate, handleDateChange,
        rowsPerPage, setRowsPerPage,
        currentPage, setCurrentPage,
        isExportOpen, setIsExportOpen,
        exportRef,
        filteredData, paginatedData, totalPages,
        totalItems: tableData.length
    };
}
