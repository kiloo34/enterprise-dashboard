import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/Card';
import { FileUploader } from '@/app/components/ui/FileUploader';
import { SearchableSelect } from '@/app/components/ui/SearchableSelect';

interface ImportConfigCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: Record<string, any>;
    targetTable: string;
    setTargetTable: (val: string) => void;
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
    file,
    setFile,
    isUploading,
    uploadProgress,
    handleUpload
}: ImportConfigCardProps) {
    return (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 border-none bg-slate-900 overflow-hidden relative isolate h-full min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <CardHeader className="pb-4 relative z-10 border-b border-white/5 mx-6 px-0 mt-2">
                <CardTitle className="text-lg text-white font-medium">{t.configTitle}</CardTitle>
                <CardDescription className="text-slate-400 text-xs mt-1">
                    {t.configDesc}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative z-10">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.targetTable}
                        </label>
                        <SearchableSelect
                            options={[
                                { value: "engine_job_entry_log", label: t.tables.engine_job_entry_log },
                                { value: "engine_job_log", label: t.tables.engine_job_log },
                                { value: "engine_process_group", label: t.tables.engine_process_group },
                                { value: "engine_process_group_his", label: t.tables.engine_process_group_his },
                                { value: "engine_sts_load_data", label: t.tables.engine_sts_load_data },
                                { value: "engine_sts_load_data_his", label: t.tables.engine_sts_load_data_his },
                                { value: "engine_sts_proses_rpt", label: t.tables.engine_sts_proses_rpt },
                                { value: "engine_sts_proses_rpt_his", label: t.tables.engine_sts_proses_rpt_his }
                            ]}
                            value={targetTable}
                            onChange={setTargetTable}
                            placeholder="Pilih target tabel..."
                            searchPlaceholder="Cari tabel..."
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
