"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { FileUploader } from '@/components/ui/FileUploader';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface ImportConfigCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: Record<string, any>;
    targetTable: string;
    setTargetTable: (val: string) => void;
    priority: number;
    setPriority: (val: number) => void;
    file: File | null;
    setFile: (file: File | null) => void;
    isUploading: boolean;
    uploadProgress: number;
    handleUpload: () => void;
}

export function ImportConfigCard({
    t,
    targetTable,
    setTargetTable,
    priority,
    setPriority,
    file,
    setFile,
    isUploading,
    uploadProgress,
    handleUpload
}: ImportConfigCardProps) {
    return (
        <Card className="shadow-sm border overflow-hidden relative isolate h-full min-h-[500px] transition-all" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <CardHeader className="pb-4 relative z-10 border-b mx-6 px-0 mt-2" style={{ borderColor: 'var(--card-border)' }}>
                <CardTitle className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{t.configTitle}</CardTitle>
                <CardDescription className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t.configDesc}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            {t.targetTable}
                        </label>
                        <SearchableSelect
                            options={[
                                { value: "rekon.rekon_qris_aj", label: t.tables.rekon_qris_aj || "Rekon QRIS AJ", group: t.schemas.rekon },
                                { value: "rekon.rekon_qris_onus", label: t.tables.rekon_qris_onus || "Rekon QRIS On-us", group: t.schemas.rekon },
                                { value: "rekon.rekon_qris_rintis", label: t.tables.rekon_qris_rintis || "Rekon QRIS Rintis", group: t.schemas.rekon },
                                { value: "engine_job_entry_log", label: t.tables.engine_job_entry_log, group: t.schemas.rekon },
                                { value: "engine_job_log", label: t.tables.engine_job_log, group: t.schemas.rekon },
                                { value: "engine_sts_load_data", label: t.tables.engine_sts_load_data, group: t.schemas.rekon },
                                { value: "engine_sts_proses_rpt", label: t.tables.engine_sts_proses_rpt, group: t.schemas.rekon },
                                { value: "TABLEAU_REPORT.fact_kinerjaprc", label: t.tables.fact_kinerjaprc, group: t.schemas.tableau }
                            ]}
                            value={targetTable}
                            onChange={setTargetTable}
                            placeholder="Pilih target tabel..."
                            searchPlaceholder="Cari tabel..."
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1.5 mt-2" style={{ color: 'var(--text-primary)' }}>
                            Prioritas Import
                        </label>
                        <SearchableSelect
                            options={[
                                { value: "0", label: "Normal (0)" },
                                { value: "5", label: "Tinggi (5)" },
                                { value: "9", label: "Mendesak (9)" }
                            ]}
                            value={priority.toString()}
                            onChange={(val) => setPriority(parseInt(val, 10) || 0)}
                            placeholder="Pilih prioritas..."
                            searchPlaceholder="Cari prioritas..."
                            disabled={isUploading}
                        />
                    </div>
                </div>

                <FileUploader
                    file={file}
                    onFileSelect={setFile}
                    isUploading={isUploading}
                    progress={uploadProgress}
                    onUpload={handleUpload}
                    labels={{
                        title: t.fileLabel,
                        select: t.selectFile,
                        noFile: t.noFile,
                        progressPrefix: "Uploading",
                        uploading: t.uploading,
                        button: t.startImport
                    }}
                />
            </CardContent>
        </Card>
    );
}
