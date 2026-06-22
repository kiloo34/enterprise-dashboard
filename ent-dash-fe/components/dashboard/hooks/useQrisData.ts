import { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { api } from "@/utils/api";
import { useDebounce } from "@/hooks/useDebounce";

export interface QrisRow {
    id: string;
    timestamp: string;
    merchant: string;
    stan?: string;
    nominal: number;
    bankStatus: string;
    artajasaStatus?: string;
    reconStatus: string;
}

interface TransactionsResponse {
    transactions: QrisRow[];
    total: number;
}

export function useQrisData(network: 'aj' | 'onus' | 'rintis', initialDateFilter?: string, onDateFilterChange?: (date: string) => void) {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
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

    // Map 'aj' (Artajasa) to the backend API namespace 'qris'
    const apiNetwork = network === 'aj' ? 'qris' : network;
    const endpoint = `/api/recon/dashboard/${apiNetwork}-transactions?limit=${rowsPerPage * 10}`;
    const { data, isLoading, mutate } = useSWR(endpoint, (url: string) => api<TransactionsResponse>(url));

    const tableData = data?.transactions || [];
    const totalItems = data?.total || 0;

    const filteredData = useMemo(() => {
        return tableData.filter((row) => {
            const searchLower = debouncedSearchTerm.toLowerCase();
            const matchesSearch = debouncedSearchTerm === "" ||
                row.merchant.toLowerCase().includes(searchLower) ||
                (row.stan && row.stan.toLowerCase().includes(searchLower));

            const matchesBank = filterBankStatus === "ALL" || row.bankStatus === filterBankStatus;
            const matchesRecon = filterReconStatus === "ALL" || row.reconStatus === filterReconStatus;
            
            // Format timestamp for date matching (Backend returns ISO string)
            const rowDate = row.timestamp.split('T')[0];
            const matchesDate = filterDate === "" || rowDate === filterDate;

            return matchesSearch && matchesBank && matchesRecon && matchesDate;
        });
    }, [tableData, debouncedSearchTerm, filterBankStatus, filterReconStatus, filterDate]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    useEffect(() => {
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
        totalItems,
        isLoading,
        mutate
    };
}
