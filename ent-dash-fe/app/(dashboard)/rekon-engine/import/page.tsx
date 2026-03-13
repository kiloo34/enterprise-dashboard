'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/app/utils/api';
import { BarChart2 } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { PageHeader } from '@/app/components/ui/PageHeader';
import { ImportConfigCard } from '../components/ImportConfigCard';
import { EngineHistoryTable } from '../components/EngineHistoryTable';
import { toast } from 'sonner';
import { useAuth } from '@/app/components/AuthContext';

interface DynamicEngineData {
    id?: number;
    [key: string]: any;
}

interface ImportHistory {
    id: string;
    file_name: string;
    target_table: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
    total_rows: number;
    processed_rows: number;
    failed_rows: number;
    error_log: Record<string, unknown>;
    created_at: string;
}

export default function RekonEnginePage() {
    const t = useTranslation('RekonEngine');
    const { user } = useAuth();

    // Upload States
    const [file, setFile] = useState<File | null>(null);
    const [targetTable, setTargetTable] = useState("rekon.rekon_qris_aj");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterTable, setFilterTable] = useState("ALL");

    // SWR General History Data Fetching - ALWAYS fetch to show logs
    const { data: rawHistory, mutate: mutateHistory } = useSWR(
        'api/imports/',
        async (url) => {
            const res = await api<ImportHistory[] | { data: ImportHistory[] }>(url);
            // Handle both wrapped and unwrapped responses
            return Array.isArray(res) ? res : (res.data || []);
        },
        { refreshInterval: 10000 }
    );

    const history: ImportHistory[] = rawHistory || [];
    const filteredHistory = history.filter((record: ImportHistory) => {
        const matchesSearch = searchQuery === "" ||
            record.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.target_table.toLowerCase().includes(searchQuery.toLowerCase());
        
        // If filterTable is not ALL, only show history for that specific table
        const matchesTable = filterTable === "ALL" || record.target_table === filterTable;
        
        const matchesStatus = filterStatus === "ALL" || record.status === filterStatus;
        return matchesSearch && matchesStatus && matchesTable;
    });

    const handleUpload = async () => {
        if (!file || !user?.accessToken) return;

        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_table', targetTable);

        try {
            // Simulate progress for UI feedback since native fetch doesn't support progress events natively without XMLHttpRequest
            const interval = setInterval(() => {
                setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
            }, 300);

            await api('api/imports/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type here; let the browser boundary magic happen
                }
            });

            clearInterval(interval);
            setUploadProgress(100);

            toast.success(t.successUpload);
            setFile(null);

            // Refresh data immediately
            mutateHistory();

            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1000);

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(t.errorUpload);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title={t.monitoring}
                description={t.description}
                icon={BarChart2}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Configuration & Upload */}
                <div className="lg:col-span-4 space-y-6">
                    <ImportConfigCard
                        t={t}
                        targetTable={targetTable}
                        setTargetTable={setTargetTable}
                        file={file}
                        setFile={setFile}
                        isUploading={isUploading}
                        uploadProgress={uploadProgress}
                        handleUpload={handleUpload}
                    />
                </div>

                {/* Right Column - History Table */}
                <div className="lg:col-span-8">
                    <EngineHistoryTable
                        t={t}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterTable={filterTable}
                        setFilterTable={setFilterTable}
                        isDynamicMode={false}
                        isDynamicLoading={false}
                        dynamicColumns={[]}
                        dynamicRows={[]}
                        filteredHistory={filteredHistory as any}
                        mutateHistory={mutateHistory}
                    />
                </div>
            </div>
        </div>
    );
}
